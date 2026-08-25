#!/usr/bin/env bash
# ============================================================
# RealWorld UI Automation — one-shot GitHub setup
#
# Run from your WSL terminal (where gh is authenticated):
#   cd /mnt/c/Users/dsbon/OneDrive/Documentos/Claude/Projects/Portfolio
#   bash realworld-ui-automation/setup-github.sh
#
# Creates the repo, commits the project in reviewable slices, and pushes.
# Safe to re-run: it stops early if the repo already exists.
# ============================================================
set -euo pipefail

REPO_NAME="realworld-ui-automation"
WIN_SRC="/mnt/c/Users/dsbon/OneDrive/Documentos/Claude/Projects/Portfolio/${REPO_NAME}"
WSL_DEST="$HOME/${REPO_NAME}"
GITHUB_USER="douglasbonafe"
VISIBILITY="${VISIBILITY:-public}"   # VISIBILITY=private bash setup-github.sh

echo "==> Checking gh auth..."
command -v gh >/dev/null || { echo "gh CLI not found. Install it, then: gh auth login"; exit 1; }
gh auth status >/dev/null 2>&1 || { echo "Not logged in. Run: gh auth login"; exit 1; }

if gh repo view "${GITHUB_USER}/${REPO_NAME}" >/dev/null 2>&1; then
  echo "Repo ${GITHUB_USER}/${REPO_NAME} already exists. Nothing to do."
  echo "To push new work: cd ${WSL_DEST} && git add -A && git commit && git push"
  exit 0
fi

echo "==> Copying project from Windows to WSL home..."
rm -rf "$WSL_DEST"
cp -r "$WIN_SRC" "$WSL_DEST"
cd "$WSL_DEST"

# Never commit build output, dependencies or a captured browser session.
rm -rf .git node_modules \
       cypress-e2e/node_modules playwright-e2e/node_modules \
       playwright-e2e/.auth playwright-e2e/test-results playwright-e2e/playwright-report \
       selenium-e2e/target

echo "==> Initializing git repo..."
git init -b main
git config user.email "dsbonafe@gmail.com"
git config user.name "Douglas Bonafé"

echo "==> Commit 1/6: documentation and shared fixture"
git add README.md docs/ .gitignore shared/
git commit -m "docs: document the app under test, architecture and framework comparison

- README explaining the three-framework comparison and how to run each suite
- docs/app-under-test.md: routes, seed data, and the Material UI selector trap
- docs/architecture.md, docs/framework-comparison.md, docs/ci.md
- shared/seed-users.json: one fixture read by all three suites"

echo "==> Commit 2/6: Cypress suite"
git add cypress-e2e/
git commit -m "test(cypress): add end-to-end suite with page objects and session caching

- cy.session() around an API login, with a validate() callback
- page objects expose intent; no selector appears in a spec
- cy.intercept to wait on the profile PATCH instead of reloading blindly"

echo "==> Commit 3/6: Playwright suite"
git add playwright-e2e/
git commit -m "test(playwright): add end-to-end suite with fixtures and storageState

- setup project performs a UI login once and saves storageState
- page objects injected as fixtures; separate anonymous test object
- projects for chromium, firefox, webkit and mobile-chrome"

echo "==> Commit 4/6: Selenium suite"
git add selenium-e2e/
git commit -m "test(selenium): add end-to-end suite with explicit waits and JUnit

- Selenium Manager resolves drivers; no binaries vendored
- BasePage centralises explicit waits; no implicit waits, no sleeps
- TestWatcher extension captures a screenshot on failure"

echo "==> Commit 5/6: continuous integration"
git add .github/
git commit -m "ci: run all three suites against a freshly seeded app

- composite action checks out, seeds and boots cypress-realworld-app,
  then polls both ports rather than sleeping
- one job per framework, Playwright matrixed across three browsers
- artifacts on failure: screenshots, video, and Playwright traces"

echo "==> Commit 6/6: remaining files"
git add -A
git diff --cached --quiet || git commit -m "chore: add remaining project files"

echo "==> Creating ${VISIBILITY} repo and pushing..."
gh repo create "${GITHUB_USER}/${REPO_NAME}" \
  --"${VISIBILITY}" \
  --source=. \
  --description "The same E2E suite in Cypress, Playwright and Selenium against cypress-realworld-app" \
  --push

gh repo edit "${GITHUB_USER}/${REPO_NAME}" \
  --add-topic e2e-testing --add-topic cypress --add-topic playwright \
  --add-topic selenium --add-topic test-automation --add-topic qa || true

echo ""
echo "Done: https://github.com/${GITHUB_USER}/${REPO_NAME}"
echo "Next: bash add-realworld-projects-to-profile.sh   (adds both repos to the portfolio table)"
