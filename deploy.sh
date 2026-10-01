#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"
task_mode="${1:-deploy}"
case "$task_mode" in
  deploy|resume) task_flags=(--publish) ;;
  verify) task_flags=() ;;
  *) echo 'Usage: bash deploy.sh [deploy|resume|verify]' >&2; exit 2 ;;
esac
task_fbt_root="${FBT_ROOT:-/Users/fangs/workspace/fbt}"
python3 "$task_fbt_root/workflows/pages-site/scripts/pages_site.py" "$task_mode" \
  --config "$PWD/config/pages-site.json" "${task_flags[@]}" --json
