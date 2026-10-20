#!/usr/bin/env bash
# eval/golden.sh: golden behavioural tasks for agentbench's job, which is to score a coding agent's harness.
#
# Everything runs for real (the built CLI, the scorer, the reporter, the run log, the MCP server) except the model:
# eval/stub-api.mjs stands in for the Anthropic Messages API, so no paid call is ever made. Each run works in a
# temporary folder, so this repository's own .agentbench/ is never touched. Pass^k: every task must pass K rounds
# in a row (AG_EVAL_K, default 3).
#
#   pnpm build && bash eval/golden.sh      needs node and python3
#   AG_EVAL_K=1 bash eval/golden.sh        one round
set -uo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT" || exit 1
K="${AG_EVAL_K:-3}"
OUT="${AB_EVAL_OUT:-$ROOT/.agentbench/eval-golden.json}"
TMP="$(mktemp -d "${TMPDIR:-/tmp}/agentbench-eval.XXXXXX")"
for dep in node python3; do command -v "$dep" >/dev/null 2>&1 || { echo "FAIL: $dep is required"; exit 1; }; done
[ -f dist/src/index.js ] || { echo "FAIL: dist/src/index.js missing, run 'pnpm build' first"; exit 1; }
CLI="node $ROOT/dist/src/index.js"
# The benchmark's own task list: how many tasks, and how many are hard (judged by the LLM judge).
read -r NTASKS NHARD < <(node --input-type=module -e "import { loadTasks } from '$ROOT/dist/tasks/index.js'; const t = loadTasks(); console.log(t.length, t.filter((x) => x.difficulty === 'hard').length)")

# The stand-in API, on a free local port; stopped on exit.
export STUB_LOG="$TMP/stub.jsonl"
: > "$STUB_LOG"
node "$ROOT/eval/stub-api.mjs" > "$TMP/stub.port" &
STUB_PID=$!
cleanup() { kill "$STUB_PID" 2>/dev/null; wait "$STUB_PID" 2>/dev/null; rm -rf "$TMP"; }
trap cleanup EXIT
i=0; while [ ! -s "$TMP/stub.port" ] && [ "$i" -lt 100 ]; do sleep 0.1; i=$((i+1)); done
STUB_URL="http://127.0.0.1:$(head -1 "$TMP/stub.port")"
unset ANTHROPIC_API_KEY AGENTBENCH_MODEL AGENTBENCH_JUDGE_MODEL

# Two harnesses to score: an empty folder, and one with a long CLAUDE.md, 8 skills, 8 rules and 5 hook groups in the
# shared .claude/settings.json (the file most projects commit).
mkdir -p "$TMP/bare" "$TMP/rich/.claude/skills" "$TMP/rich/.claude/rules"
for n in $(seq 1 65); do echo "Rule $n: keep diffs small and test before you report done." >> "$TMP/rich/CLAUDE.md"; done
for n in 1 2 3 4 5 6 7 8; do
  printf -- '---\nname: skill-%s\ndescription: test skill\n---\nSteps.\n' "$n" > "$TMP/rich/.claude/skills/skill-$n.md"
  printf 'Rule file %s.\n' "$n" > "$TMP/rich/.claude/rules/rule-$n.md"
done
cat > "$TMP/rich/.claude/settings.json" <<'JSON'
{"hooks": {"PreToolUse": [{"matcher": "Bash", "hooks": []}, {"matcher": "Edit", "hooks": []}],
           "PostToolUse": [{"matcher": "Write", "hooks": []}, {"matcher": "Edit", "hooks": []}],
           "SessionStart": [{"hooks": []}]}}
JSON

PASS=0; FAIL=0; LOG=""
ok()  { echo "  PASS  r$ROUND $1"; PASS=$((PASS+1)); LOG="$LOG{\"round\":$ROUND,\"task\":\"$1\",\"pass\":true},"; }
bad() { echo "  FAIL  r$ROUND $1: $2"; FAIL=$((FAIL+1)); LOG="$LOG{\"round\":$ROUND,\"task\":\"$1\",\"pass\":false},"; }
stub_lines() { wc -l < "$STUB_LOG" | tr -d ' '; }
json() {  # json <file> <python expression over d>
  python3 -c "import json,sys; d=json.load(open(sys.argv[1])); print($2)" "$1" 2>/dev/null
}
bench() {  # bench <key> <out.json> [args...]: one benchmark run against the stand-in, in the rich harness
  local key="$1" out="$2"; shift 2
  (cd "$TMP/rich" && ANTHROPIC_BASE_URL="$STUB_URL" ANTHROPIC_API_KEY="$key" $CLI --json --no-cache "$@" > "$out" 2>"$out.err")
}

echo "=== agentbench golden eval: $K round(s), stand-in API at $STUB_URL ==="
START=$(date +%s)
ROUND=1
while [ "$ROUND" -le "$K" ]; do
  rm -rf "$TMP/rich/.agentbench"

  # G0: the CLI answers --help and --version, with the package's version.
  PKG_VERSION="$(node -p "require('$ROOT/package.json').version")"
  if $CLI --help 2>&1 | grep -q "score" && $CLI --help 2>&1 | grep -q "sandbox-run" && [ "$($CLI --version 2>&1)" = "$PKG_VERSION" ]; then
    ok "help-and-version-answer"
  else bad "help-and-version-answer" "version $($CLI --version 2>&1), want $PKG_VERSION"; fi

  # G1: without an API key the benchmark stops with a clear message before any request is made.
  BEFORE=$(stub_lines)
  NOKEY_OUT="$(cd "$TMP/rich" && ANTHROPIC_BASE_URL="$STUB_URL" $CLI 2>&1)"; NOKEY_RC=$?
  if [ "$NOKEY_RC" -ne 0 ] && printf '%s' "$NOKEY_OUT" | grep -q "ANTHROPIC_API_KEY" && [ "$(stub_lines)" = "$BEFORE" ]; then
    ok "no-key-stops-before-any-call"
  else bad "no-key-stops-before-any-call" "rc=$NOKEY_RC requests $BEFORE -> $(stub_lines)"; fi

  # G2: the free static score: an empty folder scores 0, the rich harness 100, hooks in settings.json counted.
  $CLI score "$TMP/bare" --json > "$TMP/bare.json" 2>&1
  $CLI score "$TMP/rich" --json > "$TMP/rich.json" 2>&1
  if [ "$(json "$TMP/bare.json" "d['overallScore']")" = "0" ] && [ "$(json "$TMP/rich.json" "d['overallScore']")" = "100" ] &&
     [ "$(json "$TMP/rich.json" "d['harnessSummary']['hookCount']")" = "5" ]; then
    ok "static-score-bare-0-rich-100"
  else bad "static-score-bare-0-rich-100" "bare=$(json "$TMP/bare.json" "d['overallScore']") rich=$(json "$TMP/rich.json" "d['overallScore']") hooks=$(json "$TMP/rich.json" "d['harnessSummary']['hookCount']")"; fi

  # G3: the whole benchmark against the stand-in: every task, one call each with tools, a judge call per hard task,
  # 5 dimensions, efficiency and the baseline reported as not measured (null, never a made-up 50), the overall score
  # the average of the measured dimensions, and the harness detected from the folder it ran in.
  BEFORE=$(stub_lines)
  bench stub-tool "$TMP/full.json"
  CALLS="$(python3 -c "
import json,sys
rows=[json.loads(l) for l in open(sys.argv[1]).read().splitlines()[int(sys.argv[2]):]]
print(sum(not r['judge'] for r in rows), sum(r['judge'] for r in rows))" "$STUB_LOG" "$BEFORE")"
  FULL="$(json "$TMP/full.json" "len(d['taskResults'])==$NTASKS and all(t['completed'] for t in d['taskResults']) and len(d['dimensions'])==5 and [x['score'] for x in d['dimensions'] if x['name']=='efficiency']==[None] and d['baselineScore'] is None and d['overallScore']==int(sum(x['score'] for x in d['dimensions'] if x['score'] is not None)/4+0.5) and d['harnessConfig']['skillCount']==8 and d['harnessConfig']['hookCount']==5")"
  if [ "$FULL" = "True" ] && [ "$CALLS" = "$NTASKS $NHARD" ]; then ok "benchmark-scores-all-tasks-via-stand-in"
  else bad "benchmark-scores-all-tasks-via-stand-in" "report=$FULL calls(task judge)=$CALLS $(tail -2 "$TMP/full.json.err" | tr '\n' ' ')"; fi

  # G4: the run log has one line per task call and one for the run, with tokens and an estimated cost.
  RUNLOG="$TMP/rich/.agentbench/runs.jsonl"
  if [ -f "$RUNLOG" ] && [ "$(python3 -c "
import json,sys
rows=[json.loads(l) for l in open(sys.argv[1])]
tasks=[r for r in rows if r['kind']=='task']
print(len(tasks)==int(sys.argv[2]) and all(r['totalTokens']==150 and r['costUsd']>0 for r in tasks) and sum(r['kind']=='benchmark' for r in rows)==1)" "$RUNLOG" "$NTASKS" 2>/dev/null)" = "True" ]; then
    ok "run-log-records-tokens-and-cost"
  else bad "run-log-records-tokens-and-cost" "$(wc -l < "$RUNLOG" 2>/dev/null) lines"; fi

  # G5: the completion rule the README states: a task is done when the reply calls a tool AND the reply (its text
  # plus one "[tool: name(input)]" line per call) is longer than 50 characters. Text alone, or a tool call with a
  # short reply, is not done.
  bench stub-tool "$TMP/t-tool.json" --task 1
  bench stub-text "$TMP/t-text.json" --task 1
  bench stub-short "$TMP/t-short.json" --task 1
  RULE="$(json "$TMP/t-tool.json" "d['taskResults'][0]['completed']") $(json "$TMP/t-text.json" "d['taskResults'][0]['completed']") $(json "$TMP/t-short.json" "d['taskResults'][0]['completed']")"
  if [ "$RULE" = "True False False" ]; then ok "done-means-a-tool-call-and-over-50-characters"
  else bad "done-means-a-tool-call-and-over-50-characters" "tool/text/short = $RULE"; fi

  # G6: both models are settings: the environment sets them, a flag wins over the environment.
  BEFORE=$(stub_lines)
  (export AGENTBENCH_MODEL=model-from-env AGENTBENCH_JUDGE_MODEL=judge-from-env
   bench stub-tool "$TMP/m1.json" --task 7
   bench stub-tool "$TMP/m2.json" --task 7 --model model-from-flag --judge-model judge-from-flag)
  MODELS="$(python3 -c "
import json,sys
rows=[json.loads(l) for l in open(sys.argv[1]).read().splitlines()[int(sys.argv[2]):]]
print(' '.join(r['model'] for r in rows))" "$STUB_LOG" "$BEFORE")"
  if [ "$MODELS" = "model-from-env judge-from-env model-from-flag judge-from-flag" ]; then ok "models-are-settings-flag-beats-env"
  else bad "models-are-settings-flag-beats-env" "requests: $MODELS"; fi

  # G7: another coding agent uses the MCP server: list the tool, score the rich harness.
  MCP="$(printf '%s\n' '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{}}' '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' \
    "{\"jsonrpc\":\"2.0\",\"id\":3,\"method\":\"tools/call\",\"params\":{\"name\":\"score-a-harness\",\"arguments\":{\"targetPath\":\"$TMP/rich\"}}}" \
    | node "$ROOT/dist/src/mcp-server.js" 2>/dev/null | python3 -c "
import json,sys
r={}
for line in sys.stdin:
    try:
        m=json.loads(line); r[m['id']]=m
    except (ValueError, KeyError):
        pass
tools=[t['name'] for t in r.get(2,{}).get('result',{}).get('tools',[])]
score=r.get(3,{}).get('result',{}).get('structuredContent',{}).get('overallScore')
text=''.join(c.get('text','') for c in r.get(3,{}).get('result',{}).get('content',[]))
print(tools==['score-a-harness'] and score==100 and '100/100' in text)")"
  if [ "$MCP" = "True" ]; then ok "mcp-scores-a-harness"
  else bad "mcp-scores-a-harness" "$MCP"; fi

  # G8: memory search finds a rule this repository learned.
  if $CLI memory-search "settings.json hooks" --json 2>/dev/null | python3 -c "import json,sys; print(any('LEARNINGS' in h['path'] for h in json.load(sys.stdin)))" 2>/dev/null | grep -q True; then
    ok "memory-search-finds-a-learned-rule"
  else bad "memory-search-finds-a-learned-rule" "no memory/LEARNINGS.md hit"; fi

  # G9: the terminal scorecard says efficiency and the baseline are not measured yet, and shows no score for them.
  CARD="$(cd "$TMP/rich" && ANTHROPIC_BASE_URL="$STUB_URL" ANTHROPIC_API_KEY=stub-tool $CLI --no-cache --task 1 2>&1)"
  if printf '%s\n' "$CARD" | grep -q "efficiency *not measured yet" && printf '%s\n' "$CARD" | grep -q "vs. baseline: not measured yet" &&
     ! printf '%s\n' "$CARD" | grep -E "efficiency .*%" >/dev/null; then
    ok "scorecard-says-efficiency-not-measured"
  else bad "scorecard-says-efficiency-not-measured" "$(printf '%s\n' "$CARD" | grep -E 'efficiency|baseline' | tr -s ' ' | tr '\n' ' ')"; fi

  ROUND=$((ROUND+1))
done

SECS=$(( $(date +%s) - START ))
TOTAL=$((PASS+FAIL))
mkdir -p "$(dirname "$OUT")"
printf '{"eval":"golden","k":%s,"pass":%s,"fail":%s,"total":%s,"seconds":%s,"results":[%s]}\n' \
  "$K" "$PASS" "$FAIL" "$TOTAL" "$SECS" "${LOG%,}" > "$OUT"
echo "=== golden: $PASS/$TOTAL passed over $K round(s) in ${SECS}s ==="
[ "$FAIL" -eq 0 ]
