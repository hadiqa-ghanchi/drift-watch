# Driftwatch

An architecture guardian, not a code assistant.

## What it does
Driftwatch is an AI-powered tool that watches a codebase's structure over 
time. Instead of writing or reviewing code line-by-line, it uses IBM Bob 
2.0's full-repository context to detect when a project's real architecture 
drifts away from its intended design — catching structural violations, 
visualizing the "blast radius" of changes, and keeping architecture 
diagrams always up to date.

## GitHub connection and repository scanning
The onboarding flow supports **public repositories only**. It uses a GitHub OAuth App with the `read:user` and `public_repo` scopes to identify the account and list public repositories. GitHub's classic `public_repo` scope also permits write access to public repositories; private repositories are not listed or accepted. Use a GitHub App with read-only repository permissions before enabling private-repository access.

### Configure locally
1. Create a GitHub OAuth App in **GitHub → Settings → Developer settings → OAuth Apps**.
2. Set its Homepage URL to `http://localhost:3000` and Authorization callback URL to `http://localhost:3000/auth/github/callback`.
3. Copy `.env.example` to `.env`, then set `GITHUB_CLIENT_ID` and `GITHUB_CLIENT_SECRET`.
4. Generate unique server secrets:

   ```powershell
   node -e "console.log('SESSION_SECRET=' + require('node:crypto').randomBytes(48).toString('base64url'))"
   node -e "console.log('TOKEN_ENCRYPTION_KEY=' + require('node:crypto').randomBytes(32).toString('hex'))"
   ```

   Put each generated value in `.env`. Keep `.env` and the OAuth client secret private.
5. Install Git (the server runs `git clone --depth 1`) and Node.js 20 or newer.
6. Run `npm install`, then `npm run dev`, and open `http://localhost:3000`.

The OAuth callback uses a per-session, one-time `state` value. Session cookies are HTTP-only and SameSite=Lax. Sessions are persisted in SQLite; OAuth access tokens are AES-256-GCM encrypted before they are written into the session store. Set `APP_BASE_URL` to the deployed HTTPS origin, register `${APP_BASE_URL}/auth/github/callback` as the OAuth callback URL, and set `TRUST_PROXY=1` when TLS terminates at a trusted reverse proxy. Keep the SQLite file on persistent storage and run one server instance per database file.

### Repository scan behavior
`POST /api/scans` accepts either a public GitHub URL or the ID and full name of a repository selected from the signed-in user's public repository list. The server verifies the repository against GitHub, shallow-clones the canonical GitHub URL into a unique temporary directory, parses source files, manifests, imports, and up to 12 Git commits, then removes the temporary checkout on both success and failure. The clone does not run project build scripts, install dependencies, initialize submodules, or download Git LFS objects.

The static analyzer skips `.git`, dependency caches/vendor folders, and common build outputs, rejects repositories whose GitHub-reported size exceeds 200 MiB, limits trees to 15,000 files, reads at most 128 KiB per source file and 4 MiB of source total, and shows at most 500 file paths in the UI. Import resolution and directory-layer classification are heuristics; resolved imports are evaluated against the architecture rules below. Commit history is limited to the shallow clone and is **not historical drift analysis**. Private repositories, background scan persistence across server restarts, deeper history, and clone progress percentages are not supported in this phase.

### Architecture rules and health score
Each resolved local import is checked against these default layer rules:

| Rule | Severity | Constraint |
| --- | --- | --- |
| RULE-001 | Critical | Frontend must not import database files. |
| RULE-002 | Critical | Frontend must not import backend files directly. |
| RULE-003 | Critical | Database must not import frontend or backend files. |
| RULE-004 | Warning | Services must not import frontend files. |

Backend imports of database files are allowed (for example, controllers importing models). Critical violations subtract 10 points and warnings subtract 3 points from a starting health score of 100; the score cannot go below 0. The scan analysis includes `violations` with the rule, severity, message, importing/imported paths, and both layers; `summary` reports healthy dependencies and warning/critical violation counts. A dependency matching multiple rules contributes a violation for each matched rule but is counted once for `healthy`.

Repositories can include `driftwatch.yml` or `driftwatch.json` at the root to replace a default rule by ID or add rules. YAML format:

```yaml
rules:
  - id: RULE-010
    from: frontend
    to: database
    severity: critical
    message: "UI must not access the database directly"
```

JSON uses the same fields in a `rules` array:

```json
{
  "rules": [
    {
      "id": "RULE-010",
      "from": "frontend",
      "to": "database",
      "severity": "critical",
      "message": "UI must not access the database directly"
    }
  ]
}
```

Custom rules accept `frontend`, `backend`, `database`, `service`/`services`, or `shared` for `from` and `to`, and `critical` or `warning` for severity. If a custom configuration is malformed, scanning continues with the defaults and `ruleConfigError` explains why it was ignored. The included `demo-repo/` has two intentional violations and can be scanned locally with `analyzeRepository` from `scanner.js`.

Deploy this as a long-running Node service with Git installed, outbound access to `api.github.com` and `github.com`, a persistent volume for the SQLite database, and the environment variables above. The current static Vercel rewrite alone is not a scan backend: routing the UI to Vercel without deploying/configuring the Node service and its API will not enable scans.

Disconnecting removes the local session and asks GitHub to revoke the OAuth grant. If GitHub is unavailable, Driftwatch reports that the grant may need to be revoked manually in GitHub settings.


## Team
- Abdul Rauf
- Hadiqa Ghanchi

## IBM Bob 2.0 Hackathon
Built for the IBM Bob 2.0 Hackathon, September 2026.
