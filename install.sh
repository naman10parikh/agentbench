#!/usr/bin/env bash
set -euo pipefail

echo "Installing agentbench..."

if command -v npm &> /dev/null; then
  npm install -g agentbench
elif command -v pnpm &> /dev/null; then
  pnpm add -g agentbench
else
  echo "Error: npm or pnpm is required. Install Node.js 18+ first."
  exit 1
fi

echo "Done. Run 'agentbench' to benchmark your Claude Code harness."
