#!/bin/sh
# Stop hook: reminds to check THREADS.md for open/deferred work before ending
# the session. "Did anything get left hanging" can't be detected from a git
# diff the way a missing changelog entry can — this can only nudge a check,
# not verify one happened. Self-silences once THREADS.md is itself part of
# the modified set this session (i.e. it was already touched/reviewed).
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
changed=$(git status --porcelain -- src scripts 2>/dev/null)
[ -z "$changed" ] && exit 0
threads_changed=$(git status --porcelain -- THREADS.md 2>/dev/null)
if [ -z "$threads_changed" ]; then
  echo '{"decision":"block","reason":"src/ or scripts/ changed this session but THREADS.md has not been touched. Before stopping: did anything get deferred, abandoned mid-way, or left blocked on a decision (e.g. a design question, an approval, a follow-up)? If so, add it to THREADS.md (what is pending, why it stalled, what unblocks it). If nothing was left hanging, no changes needed — just confirm that explicitly."}'
  exit 0
fi
exit 0
