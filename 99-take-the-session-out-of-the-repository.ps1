# 99-take-the-session-out-of-the-repository.ps1
# Housekeeping, and it matters. No migration.
#
# Script 97 ran git add . and swept up auth.json, which Playwright wrote
# when you signed in. That file is your live session: anybody with the
# repository can put it in a browser and be you. It is on GitHub now.
#
# This removes it from the repository, deletes it from your machine,
# and puts it in .gitignore along with the audit and recon output so it
# cannot happen again.
#
# You will need to sign in again for the audit, which is one command:
#   node audit.mjs --login
#
# Two things this script cannot do for you.
#
# The file is still in the history of the repository, so removing it now
# does not unpublish it. The repository is private, so the exposure is
# whoever can already see it, but the session should be ended anyway.
# Sign out everywhere from Supabase: Authentication, Users, your own
# user, Sign out. That makes the token in the history worthless.
#
# And git add . is how it got there. From here my scripts should add
# only the files they wrote, which I will change from the next one.
#
#   powershell -ExecutionPolicy Bypass -File .\99-take-the-session-out-of-the-repository.ps1

$ErrorActionPreference = "Stop"
$root = "C:\Users\HP\Desktop\expatpreneur"
Set-Location $root

$utf8NoBom = New-Object System.Text.UTF8Encoding($false)

function Write-File($relativePath, $contents) {
    $full = Join-Path $root $relativePath
    $dir = Split-Path $full -Parent
    if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
    [System.IO.File]::WriteAllText($full, $contents, $utf8NoBom)
    Write-Host "wrote $relativePath"
}

$f0 = @'
# See https://help.github.com/articles/ignoring-files/ for more about ignoring files.

# dependencies
/node_modules
/.pnp
.pnp.*
.yarn/*
!.yarn/patches
!.yarn/plugins
!.yarn/releases
!.yarn/versions

# testing
/coverage

# next.js
/.next/
/out/

# production
/build

# misc
.DS_Store
*.pem

# debug
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*

# env files (can opt-in for committing if needed)
.env*

# vercel
.vercel

# typescript
*.tsbuildinfo
next-env.d.ts
.env*.local
.env

# the audit and the recon
# auth.json holds a live sign in. It must never be committed.
auth.json
audit-shots/
audit-report.md
recon-report.md
recon-links.csv
'@
Write-File ".gitignore" $f0

git rm --cached auth.json --quiet
git rm --cached recon-report.md --quiet
git rm --cached recon-links.csv --quiet
if (Test-Path "auth.json") { Remove-Item "auth.json" -Force; Write-Host "deleted auth.json from this machine" }

git add .gitignore
git commit -m "Take the saved session out of the repository and ignore the audit output"
git push
if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "Pushed."
    Write-Host ""
    Write-Host "Now sign out everywhere in Supabase: Authentication, Users, your user, Sign out."
    Write-Host "Then sign in again for the audit:"
    Write-Host "  node audit.mjs --login"
    Write-Host "  node audit.mjs"
} else {
    Write-Host ""
    Write-Host "The commit is saved, but the push failed. Run git push again when the connection is back."
}
