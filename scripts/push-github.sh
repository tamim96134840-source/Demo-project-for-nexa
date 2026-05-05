#!/usr/bin/env bash
set -euo pipefail

if [ -z "${GITHUB_PERSONAL_ACCESS_TOKEN:-}" ]; then
  echo "Error: GITHUB_PERSONAL_ACCESS_TOKEN is not set." >&2
  echo "Add it as a secret in the Replit environment before running this script." >&2
  exit 1
fi

REMOTE_URL="${GITHUB_REPO_URL:-https://github.com/tamim96134840-source/Demo-project-for-nexa.git}"

# Build the Basic auth header from the token without storing the token in .git/config.
# base64 flags differ between GNU and BSD; handle both.
BASE64_TOKEN=$(printf "x-access-token:%s" "${GITHUB_PERSONAL_ACCESS_TOKEN}" \
  | base64 -w0 2>/dev/null || printf "x-access-token:%s" "${GITHUB_PERSONAL_ACCESS_TOKEN}" | base64)

echo "Pushing main branch to GitHub..."
GIT_CONFIG_COUNT=2 \
GIT_CONFIG_KEY_0="http.${REMOTE_URL}.extraheader" \
GIT_CONFIG_VALUE_0="Authorization: Basic ${BASE64_TOKEN}" \
GIT_CONFIG_KEY_1="user.name" \
GIT_CONFIG_VALUE_1="Nexamove" \
  git -c user.email="nexamove@replit.com" push "${REMOTE_URL}" main:main
echo "Done. Code is now synced to GitHub."
