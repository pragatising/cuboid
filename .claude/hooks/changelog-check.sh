#!/bin/sh
# PostToolUse hook (Write|Edit): reminds if tracked source changed this
# session but CHANGELOG.md wasn't updated. Self-silences once CHANGELOG.md
# is itself part of the modified set, so it only fires on the gap between
# "source changed" and "changelog caught up" — not on every edit after that.
#
# Watched paths post-Phase-1 workspace split: packages/primitives/src
# (tokens + build scripts) and packages/react/src (components). Top-level
# src/scripts no longer exist as of the split — kept here as a harmless
# no-op fallback in case anything still lands there.
cd "$(git rev-parse --show-toplevel 2>/dev/null)" || exit 0
changed=$(git status --porcelain -- packages/primitives/src packages/react/src src scripts 2>/dev/null)
[ -z "$changed" ] && exit 0
changelog_changed=$(git status --porcelain -- CHANGELOG.md 2>/dev/null)
if [ -z "$changelog_changed" ]; then
  echo '{"decision":"block","reason":"Source changed this session (packages/primitives/src or packages/react/src) but CHANGELOG.md was not updated yet. Add a top entry (what changed, why, next-agent notes) before finishing this thread — or note explicitly why this change does not need one (e.g. trivial/reverted)."}'
  exit 0
fi
exit 0
