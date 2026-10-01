#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
if [[ "$(git config --local user.name)" != "imfangs" ]] || [[ "$(git config --local user.email)" != "mafangshuai@126.com" ]]; then
  echo 'Unexpected local Git identity.' >&2; exit 1
fi
if [[ "$(git remote get-url deploy)" != "https://github.com/imfangs/story-shelf-site.git" ]]; then
  echo 'Unexpected deployment repository.' >&2; exit 1
fi
npm run build
node scripts/validate.mjs --release
task_deploy_dir=$(mktemp -d /tmp/story-shelf-publish.XXXXXX)
cleanup(){ git worktree remove --force "$task_deploy_dir" >/dev/null 2>&1 || true; }
trap cleanup EXIT
git fetch deploy gh-pages >/dev/null 2>&1 || true
if git show-ref --verify --quiet refs/remotes/deploy/gh-pages; then
  git worktree add --detach "$task_deploy_dir" deploy/gh-pages
else
  git worktree add --detach "$task_deploy_dir" HEAD
  git -C "$task_deploy_dir" checkout --orphan gh-pages
fi
# The first orphan checkout stages source files; remove them only in this disposable worktree.
git -C "$task_deploy_dir" rm -rf --ignore-unmatch . >/dev/null
cp -R docs/.vitepress/dist/. "$task_deploy_dir/"
git -C "$task_deploy_dir" add -A
if git -C "$task_deploy_dir" diff --cached --quiet; then
  echo 'Public build unchanged.'; exit 0
fi
git -C "$task_deploy_dir" commit -m "Publish Chinese reading collection"
git -C "$task_deploy_dir" push deploy HEAD:gh-pages
