# Contributing to gmail-hide-read-categories

This project is work of [many contributors](https://github.com/dblock/gmail-hide-read-categories/graphs/contributors).

You're encouraged to submit [pull requests](https://github.com/dblock/gmail-hide-read-categories/pulls), [propose features and discuss issues](https://github.com/dblock/gmail-hide-read-categories/issues).

In the examples below, substitute your Github username for `contributor` in URLs.

### Fork the Project

Fork the [project on Github](https://github.com/dblock/gmail-hide-read-categories) and check out your copy.

```
git clone https://github.com/contributor/gmail-hide-read-categories.git
cd gmail-hide-read-categories
git remote add upstream https://github.com/dblock/gmail-hide-read-categories.git
```

### Install Dependencies

Ensure that you can build the project and run tests.

```
npm install
```

### Build and Install in Chrome

```
npm run build
```

This creates `build/*` which can be loaded as an unpacked extension in Chrome.

### Package

Use `npm run repack` to package a .zip in `release`.

## Contribute Code

### Create a Topic Branch

Make sure your fork is up-to-date and create a topic branch for your feature or bug fix.

```
git checkout master
git pull upstream master
git checkout -b my-feature-branch
```

### Write Tests

Try to write a test that reproduces the problem you're trying to fix or describes a feature that you want to build. Add tests to [spec](spec).

We definitely appreciate pull requests that highlight or reproduce a problem, even without a fix.

### Write Code

Implement your feature or bug fix.

Code style is enforced with prettier. Run `npm run format`.

### Write Documentation

Document any external behavior in the [README](README.md).

### Update Changelog

Add a line to [CHANGELOG](CHANGELOG.md) under *Next Release*. Don't remove *Your contribution here*.

Make it look like every other line, including a link to the issue being fixed, your name and link to your Github account.

### Commit Changes

Make sure git knows your name and email address:

```
git config --global user.name "Your Name"
git config --global user.email "contributor@example.com"
```

Writing good commit logs is important. A commit log should describe what changed and why.

```
git add ...
git commit
```

### Push

```
git push origin my-feature-branch
```

### Make a Pull Request

Go to https://github.com/contributor/gmail-hide-read-categories and select your feature branch. Click the 'Pull Request' button and fill out the form. Pull requests are usually reviewed within a few days.

### Update CHANGELOG Again

Update the [CHANGELOG](CHANGELOG.md) with the pull request number. A typical entry looks as follows.

```
* [#123](https://github.com/dblock/gmail-hide-read-categories/pull/123): Reticulated splines - [@contributor](https://github.com/contributor).
```

Amend your previous commit and force push the changes.

```
git commit --amend
git push origin my-feature-branch -f
```

### Rebase

If you've been working on a change for a while, rebase with upstream/master.

```
git fetch upstream
git rebase upstream/master
git push origin my-feature-branch -f
```

### Check on Your Pull Request

Go back to your pull request after a few minutes and see whether it passed muster with Travis-CI. Everything should look green, otherwise fix issues and amend your commit as described above.

### Be Patient

It's likely that your change will not be merged and that the nitpicky maintainers will ask you to do more, or fix seemingly benign problems. Hang on there!

## Releasing

1. Change "Next" in [CHANGELOG.md](CHANGELOG.md) to today's date. 
2. Create a new release/tag in GitHub (e.g., `v1.0.0`).
3. The [.github/workflows/release.yml](.github/workflows/release.yaml) workflow will automatically build the project, create a zip package, and upload the zip file to the release. 
4. The [.github/workflows/post-release.yml](.github/workflows/post-release.yaml) workflow will open a pull request to increment the version.

## Thank You

Please do know that we really appreciate and value your time and work. We love you, really.
