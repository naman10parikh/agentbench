#!/usr/bin/env bash
# scrub-public — genericize an extracted harness repo's inherited layer for PUBLIC open-source.
# Strips energy-internal references (chairman/Naman/prod URLs/personal paths/vision-doc/customer names)
# from .claude/, CLAUDE.md, memory/, identity/, brain/, AGENTS.md. Keeps generic methodology + "Energy" brand.
# CP103 chairman-approved (2026-05-25). Portable to macOS bash 3.2 (no mapfile).
set -uo pipefail
D="${1:?repo-dir required}"
[ -d "$D" ] || { echo "ERROR: not a dir: $D"; exit 2; }
echo "=== scrub-public: $D ==="

SEDP="$(mktemp -t scrubpub).sed"
cat > "$SEDP" <<'SED'
s/Chairman/Maintainer/g
s/chairman/maintainer/g
s/CHAIRMAN/MAINTAINER/g
s/Naman's/the user's/g
s/Naman/the user/g
s#energy-taupe\.vercel\.app#your-app.example.com#g
s#/Users/naman/energy#$PROJECT_ROOT#g
s#/Users/naman#$HOME#g
s/the_complete_story\.md/VISION.md/g
s/the_complete_story/the vision doc/g
s/complete_story/vision/g
s/CHAIRMAN-CHECKLIST/PROJECT-CHECKLIST/g
s/Gayathri/[redacted]/g
s/Gayatri/[redacted]/g
SED

# Apply across harness dirs (only those that exist) + root docs. find -exec (bash-3.2 safe).
for sub in .claude memory identity brain; do
  [ -d "$D/$sub" ] && find "$D/$sub" -type f \( -name '*.md' -o -name '*.sh' -o -name '*.js' -o -name '*.json' -o -name '*.yaml' -o -name '*.yml' \) -exec sed -i '' -f "$SEDP" {} + 2>/dev/null
done
for rf in "$D/CLAUDE.md" "$D/AGENTS.md" "$D/CONTEXT.md" "$D/QUICKSTART.md"; do
  [ -f "$rf" ] && sed -i '' -f "$SEDP" "$rf" 2>/dev/null
done
rm -f "$SEDP"
echo "  scrub applied."

echo "=== VERIFY (residual sensitive tokens — want 0) ==="
PAT='chairman|Chairman|CHAIRMAN|\bNaman\b|energy-taupe|/Users/naman|the_complete_story|CHAIRMAN-CHECKLIST|Gayathri|Gayatri'
HITS=$(grep -rIl -E "$PAT" "$D/.claude" "$D/memory" "$D/identity" "$D/brain" "$D/CLAUDE.md" "$D/AGENTS.md" "$D/CONTEXT.md" "$D/QUICKSTART.md" 2>/dev/null || true)
N=$(printf '%s\n' "$HITS" | grep -c . || true)
echo "  files with residual sensitive tokens: $N"
[ "$N" != "0" ] && printf '%s\n' "$HITS" | sed "s|$D/|    |"
echo "=== scrub-public done ==="
exit 0
