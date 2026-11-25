# Releasing gmail-toggle

Releases are made by the [Release](.github/workflows/release.yml) workflow with [npm-package-release](https://github.com/dblock/npm-package-release). The extension is not published to npm; each release is a GitHub Release with the packaged extension attached as `gmail-toggle-vX.Y.Z.zip`.

## Prerequisites

In **Settings → Environments**, create a `release` environment and allow deployments only from `master`. Optionally require a maintainer's approval.

The release pushes a release commit, a `vX.Y.Z` tag, and a next-version commit directly to `master` as fast-forward pushes. The `master` ruleset only blocks deletion and force pushes, so these pushes are allowed; keep it that way, and do not add a rule that requires pull requests on `master` without allowing the release to push.

No npm account or token is needed.

## Prepare the Release

Make sure the [CHANGELOG](CHANGELOG.md) section for the version in [package.json](package.json), for example `## 0.5.0 (Next)`, lists the changes in the release, and that tests and lint pass on `master`.

```bash
npm test
npm run lint
```

## Release

Dispatch the release workflow from `master`.

```bash
gh workflow run release.yml
```

This releases the version in `package.json`. To release a different version, pass it explicitly.

```bash
gh workflow run release.yml -f version=0.6.0
```

The workflow runs `npm test` and `npm run lint`, sets the version in `package.json`, `package-lock.json`, and `public/manifest.json`, replaces `(Next)` with today's date in the CHANGELOG and removes *Your contribution here*, runs `npm run build`, zips the contents of `build` with `manifest.json` at the root of `gmail-toggle-vX.Y.Z.zip`, commits and tags `vX.Y.Z`, pushes to `master`, and creates a GitHub Release with the CHANGELOG notes and the zip attached. It then prepares the next patch version in the same files with a new `## X.Y.Z (Next)` CHANGELOG section and pushes that commit too.

Watch the run and check the release.

```bash
gh run list --workflow release.yml --limit 5
gh release view vX.Y.Z
```

## Recovery

Do not rerun a failed release blindly. The workflow retains its artifacts, including `release.json`, the zip, and the release notes, for 30 days. Inspect them, the `master` branch, the tag, and the GitHub Release before retrying, as described in [Recovery and Reconciliation](https://github.com/dblock/npm-package-release/blob/master/docs/recovery.md).
