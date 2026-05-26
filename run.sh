#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TASKS_DIR="$SCRIPT_DIR/tasks"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${CYAN}${BOLD}agentbench${NC} — Lighthouse for AI coding harnesses"
echo ""

# Check prerequisites
if [ -z "${ANTHROPIC_API_KEY:-}" ]; then
  echo -e "${RED}Error: ANTHROPIC_API_KEY is not set${NC}"
  echo "  export ANTHROPIC_API_KEY=your-key-here"
  exit 1
fi

if ! command -v node &> /dev/null; then
  echo -e "${RED}Error: Node.js is required (v18+)${NC}"
  exit 1
fi

# Parse arguments
TASK_FILTER=""
VERBOSE=false
JSON_OUTPUT=false
MODEL="claude-sonnet-4-6"

while [[ $# -gt 0 ]]; do
  case $1 in
    --task)
      TASK_FILTER="$2"
      shift 2
      ;;
    --verbose)
      VERBOSE=true
      shift
      ;;
    --json)
      JSON_OUTPUT=true
      shift
      ;;
    --model)
      MODEL="$2"
      shift 2
      ;;
    --help)
      echo "Usage: ./run.sh [options]"
      echo ""
      echo "Options:"
      echo "  --task <n>     Run a single task by number"
      echo "  --verbose      Show detailed output"
      echo "  --json         Output results as JSON"
      echo "  --model <id>   Model to use (default: claude-sonnet-4-6)"
      echo "  --help         Show this help"
      exit 0
      ;;
    *)
      echo -e "${RED}Unknown option: $1${NC}"
      exit 1
      ;;
  esac
done

# Install deps if needed
if [ ! -d "$SCRIPT_DIR/node_modules" ]; then
  echo -e "${YELLOW}Installing dependencies...${NC}"
  cd "$SCRIPT_DIR"
  if command -v pnpm &> /dev/null; then
    pnpm install --silent
  else
    npm install --silent
  fi
  cd - > /dev/null
fi

# Discover tasks
TASK_DIRS=()
for dir in "$TASKS_DIR"/*/; do
  if [ -f "$dir/task.json" ]; then
    task_num=$(basename "$dir" | grep -o '^[0-9]*')
    if [ -n "$TASK_FILTER" ] && [ "$task_num" != "$TASK_FILTER" ]; then
      continue
    fi
    TASK_DIRS+=("$dir")
  fi
done

if [ ${#TASK_DIRS[@]} -eq 0 ]; then
  echo -e "${RED}No tasks found${NC}"
  if [ -n "$TASK_FILTER" ]; then
    echo "  Task $TASK_FILTER does not exist"
  fi
  exit 1
fi

echo -e "${BOLD}Found ${#TASK_DIRS[@]} task(s)${NC}"
echo -e "Model: ${CYAN}$MODEL${NC}"
echo ""

# Run each task
PASSED=0
FAILED=0
TOTAL=${#TASK_DIRS[@]}

for dir in "${TASK_DIRS[@]}"; do
  task_name=$(basename "$dir")
  task_json="$dir/task.json"

  # Extract task info
  name=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$task_json','utf8')).name)")
  difficulty=$(node -e "console.log(JSON.parse(require('fs').readFileSync('$task_json','utf8')).difficulty)")

  echo -ne "  [$task_name] $name "

  # Check workspace exists
  if [ ! -d "$dir/workspace" ]; then
    echo -e "${YELLOW}SKIP${NC} (no workspace)"
    continue
  fi

  # Check expected exists
  if [ ! -d "$dir/expected" ]; then
    echo -e "${YELLOW}SKIP${NC} (no expected output)"
    continue
  fi

  # Create temp workspace
  WORK_DIR=$(mktemp -d)
  cp -r "$dir/workspace/"* "$WORK_DIR/" 2>/dev/null || true

  # Verify workspace has files
  file_count=$(find "$WORK_DIR" -type f | wc -l | tr -d ' ')
  if [ "$file_count" -eq 0 ]; then
    echo -e "${YELLOW}SKIP${NC} (empty workspace)"
    rm -rf "$WORK_DIR"
    continue
  fi

  # Compare workspace vs expected to verify task is valid
  if diff -rq "$dir/workspace" "$dir/expected" > /dev/null 2>&1; then
    echo -e "${YELLOW}SKIP${NC} (workspace = expected, nothing to do)"
    rm -rf "$WORK_DIR"
    continue
  fi

  # Task is valid and has a diff between workspace and expected
  echo -e "${GREEN}READY${NC} [${difficulty}]"

  if [ "$VERBOSE" = true ]; then
    echo "    Workspace: $WORK_DIR"
    echo "    Files: $file_count"
    diff_lines=$(diff -r "$dir/workspace" "$dir/expected" 2>/dev/null | wc -l | tr -d ' ')
    echo "    Diff lines: $diff_lines"
  fi

  PASSED=$((PASSED + 1))

  # Cleanup
  rm -rf "$WORK_DIR"
done

echo ""
echo -e "${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  Tasks ready: ${GREEN}$PASSED${NC}${BOLD} / $TOTAL${NC}"
echo ""

if [ "$PASSED" -eq "$TOTAL" ]; then
  echo -e "  ${GREEN}All tasks validated.${NC} Run with Claude API:"
  echo ""
  echo -e "  ${CYAN}npx tsx src/index.ts${NC}"
  echo -e "  ${CYAN}npx tsx src/index.ts --task 1 --verbose${NC}"
else
  SKIPPED=$((TOTAL - PASSED))
  echo -e "  ${YELLOW}$SKIPPED task(s) skipped${NC} (missing workspace or expected)"
fi

echo ""
