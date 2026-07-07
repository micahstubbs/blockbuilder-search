# Security Audit: blockbuilder-search

**Audit date:** 2026-07-07
**Repo:** /home/m/wk/blockbuilder-search (fork of enjalot/blockbuilder-search)
**Ref audited:** `97d8358` (master, last commit 2019-07-24)

## Executive Summary

**VERDICT: CLEAN**

This is a small (~30 file), well-known open-source project: the search UI + Express/Elasticsearch API plugin for blockbuilder.org, by Ian Johnson (enjalot) with contributions from Micah Stubbs and Cameron Yick (hydrosquall). The audit found **no malware, no data exfiltration, no obfuscated code, no install-time attack surface, and no hardcoded credentials**. All 207 commits are from known project contributors; every dependency in `yarn.lock` resolves to the official npm/yarn registry with integrity hashes.

The only items worth attention are hygiene issues typical of an unmaintained 2019-era codebase: outdated dependencies with known CVEs (handlebars 4.1.2, node-sass 4.12.0), a hardcoded plaintext-HTTP IP address for a defunct "graph search" prototype, and a committed 2 MB `bundle.js` build artifact (verified consistent with source). None of these block dependency installation or local development.

## Project Overview

| Attribute | Value |
|---|---|
| Name | blockbuilder-search v0.3.0 |
| Purpose | Search UI (React/Redux) + API endpoint (Express → Elasticsearch) for blockbuilder.org / bl.ocks.org d3 examples |
| Author / License | Ian Johnson (enjalot) / BSD-3-Clause |
| Type | Node.js library/plugin, consumed by the host `blockbuilder` app via `npm link` |
| Entry points | `index.js` (server plugin), `src/main.js` → `public/bundle.js` (webpack UI bundle) |
| Node version | 12.3.0 (`.nvmrc`, `.node-version`) |
| Package manager | yarn (yarn.lock present, package-lock.json gitignored) |
| Search backend | Elasticsearch, via legacy `elasticsearch` npm client 15.5.0; index `blockbuilder`, mapping type `blocks` (ES 5.x/6.x era) |
| CI / build scripts | None (no .github/, no Makefile, no *.sh, no git hooks) |
| Last activity | 2019-07-24 |

## Dependency Analysis

- **No git/http/file dependencies.** All `dependencies` and `devDependencies` in `package.json` are semver ranges against the public registry.
- **Lockfile integrity:** 0 of the `resolved` URLs in `yarn.lock` point anywhere other than `registry.yarnpkg.com`; all entries carry `integrity` hashes. No git+, git://, or GitHub-tarball resolutions.
- **No typosquats.** All package names are canonical, widely used packages (react, redux, express, d3, elasticsearch, handlebars, webpack, babel, eslint, prettier, etc.). Spot-checked resolved versions: `elasticsearch@15.5.0`, `handlebars@4.1.2`, `node-sass@4.12.0`, `superagent@1.8.5`, `sass@0.5.0`.
- **No preinstall/postinstall scripts in this project's package.json.** The `scripts` block contains only webpack build, prettier, and eslint commands.
- **Transitive install scripts:** `node-sass@4.12.0` runs its standard postinstall (`node scripts/build.js`) which downloads a prebuilt libsass binding from node-sass's official GitHub releases or compiles natively. This is the well-known legitimate behavior of node-sass, not a threat — but note it (a) executes code at install time and (b) will fail on modern Node; use Node 12 (see Recommendations).
- **Oddity (benign):** `"sass": "^0.5.0"` — this is the ancient pre-dart-sass npm package named `sass`, apparently a vestigial/unused declaration (the build actually uses `node-sass` + `sass-loader`). Not malicious; could be removed.

## Code Analysis

| Check | Result |
|---|---|
| `eval(` / `new Function` | None in source (`src/`, `index.js`, `webpack.config.js`, `search.html`) |
| `child_process` / `exec` / `spawn` | None |
| `curl \| bash` or shell pipes | None (no shell scripts exist at all) |
| base64 / `atob` obfuscation | None |
| Env var access exfiltrated over network | None — only `process.env.API_URL` read at build time (webpack), used as the fetch base URL for the app's own API |
| Hidden files | Only standard dotfiles: `.babelrc`, `.eslintrc.json`, `.gitignore`, `.nvmrc`, `.node-version`, `.prettierrc.json`, `.prettierignore` — all inspected, all benign config |
| Git hooks / CI configs | None beyond `.sample` defaults |
| Hardcoded credentials / API keys / private keys | None (`api[_-]key`, `secret`, `password`, `token`, `AKIA`, `-----BEGIN` grep: only a `handleAPIKeyDown` keyboard handler, a naming false positive) |
| Committed build artifact (`public/bundle.js`, 2 MB) | Scanned all embedded URLs and IP-like strings; every external endpoint matches source. IP-looking strings `1.22.34.2`, `1.5.72.72`, `18.28.4.28` are SVG path coordinate data (open-iconic icons), not addresses |

### External network endpoints (all in browser-side code, all explainable)

| Endpoint | Location | Purpose |
|---|---|---|
| `${API_URL}/api/search`, `/api/aggregateD3API`, `/api/aggregateD3Modules` | `src/actions/actionCreators.js:22,33,54,63` | App's own search API (blockbuilder.org or local) |
| `https://christopheviau.com/block_screenshot/…` | `src/actions/actionCreators.js:42`, `src/components/results.js:94` | Community-hosted block screenshot thumbnails (Christophe Viau, known d3 community member) |
| `https://storage.googleapis.com/blockbuilder-screenshots/…` | `src/components/results.js:105` | Project's GCP bucket of block thumbnails |
| `https://gist.githubusercontent.com/…/thumbnail.png` | `src/components/results.js:90` | Gist-hosted thumbnails |
| `https://beta.observablehq.com/search?query=…` | `src/components/searchbar.js:105` | Cross-link to Observable search |
| `http://35.203.147.195:8080/?gist_id=…` | `src/constants.js:1`, `src/components/results.js:57,139` | "Graph search" prototype on a GCP VM — see Findings |
| `//fonts.googleapis.com`, `//www.google-analytics.com` | `search.html` | Fonts + optional GA (only injected if host app passes a `ga` tracking ID via Handlebars) |

## Findings

1. **Hardcoded IP for graph-search prototype, plaintext HTTP** — `src/constants.js:1` (`export const graphSearchIPAddress = '35.203.147.195'`), used at `src/components/results.js:57` and `:139`. This was a GCP-hosted prototype (comment: "no https for graph search server yet"). Not malicious, but the IP is 7 years stale and could have been reassigned to an arbitrary tenant; the shift-key/mouse-over handler `window.open`s it. Low risk (user-initiated navigation only, no data sent beyond a gist id), but should be removed or domain-ified before any redeploy.
2. **Outdated dependencies with known CVEs (vulnerability, not malware):**
   - `handlebars@4.1.2` — prototype pollution / template RCE advisories fixed in ≥4.7.7. Practical exposure here is low: the only template compiled is the repo's own `search.html` with a server-supplied `ga` value (`index.js:9-12`), never user input.
   - `node-sass@4.12.0` — deprecated libsass; build-time only.
   - `elasticsearch@15.5.0` — the deprecated legacy ES JS client; superseded by `@elastic/elasticsearch`.
   - `d3@3.5.x`, `superagent@1.8.5`, `express@4.13.x` range, `webpack@4` — all old; `npm audit` will report many advisories.
3. **Unvalidated query passthrough in search API** — `index.js:18-33, 67-191`: user-supplied `req.query` values (`text`, `user`, `size`, `from`, `sort`, `sort_dir`) are inserted into the ES query body. Values are used as JSON values (no string-concatenated query injection), but `size`/`sort` are unvalidated (a huge `size` is a trivial DoS vector against the ES cluster) and errors are echoed to the client (`res.send(err)` at `index.js:30`), leaking ES error internals. Hygiene issue for production, not a supply-chain concern.
4. **Committed build artifact** — `public/bundle.js` (2 MB, with inline source map). Verified consistent with `src/`; contains no endpoints absent from source. Standard practice for this project (host app serves it via `express.static`, `index.js:7`), but rebuild from source (`yarn build`) if deploying, rather than trusting the checked-in binary.
5. **Vestigial `sass@0.5.0` dependency** — declared but unused; the pipeline uses `node-sass`. Cosmetic.

## Security Concerns

- **None that indicate compromise.** No exfiltration, no obfuscation, no install-time hooks in the project itself, no suspicious endpoints, no credentials.
- Residual concerns are operational: CVE-laden 2019 dependency tree (do not expose the Express endpoint or webpack dev tooling to untrusted traffic without updating), the stale hardcoded IP, and the unvalidated `size`/`from` params if the search API is ever fronted publicly again.

## Recommendations

1. Safe to `yarn install` — but use **Node 12** (`nvm use` picks up `.nvmrc` 12.3.0); `node-sass@4.12.0` will fail to build on modern Node. Alternative: swap `node-sass` for `sass` (dart-sass) + current `sass-loader` if modernizing.
2. If deploying anywhere reachable: bump `handlebars` ≥4.7.7, replace the deprecated `elasticsearch` client, validate/cap `size` and `from` in `index.js`, and stop echoing raw ES errors to clients.
3. Remove or replace the `http://35.203.147.195:8080` graph-search links (`src/constants.js`, `src/components/results.js`) before serving the UI.
4. Rebuild `public/bundle.js` from source rather than serving the committed artifact.
5. Drop the unused `sass@^0.5.0` dependency.

## Conclusion

blockbuilder-search is exactly what it claims to be: enjalot's 2016-2019 search plugin for blockbuilder.org — an Express handler set that queries an Elasticsearch index named `blockbuilder` (type `blocks`, i.e. ES 5.x/6.x era) plus a React/Redux search UI. All code paths, dependencies, scripts, and hidden files were reviewed; nothing malicious or suspicious was found. **Verdict: CLEAN.** Dependency installation and local development may proceed, with the age-related caveats above. Note that this repo only *queries* the index — index creation/population lives in the companion repo [enjalot/blockbuilder-search-index](https://github.com/enjalot/blockbuilder-search-index), which fetches gist data from GitHub into static JSON files and loads them into Elasticsearch (README.md:21-25); any dataset/tarball for seeding a deployment must be sourced from that project, not this one.
