# Contributing to gmail-toggle

This project is work of [many contributors](https://github.com/dblock/gmail-toggle/graphs/contributors).

You're encouraged to submit [pull requests](https://github.com/dblock/gmail-toggle/pulls), [propose features and discuss issues](https://github.com/dblock/gmail-toggle/issues).

In the examples below, substitute your GitHub username for `contributor` in URLs.

## Fork the Project

Fork the [project on GitHub](https://github.com/dblock/gmail-toggle) and check out your copy.

```bash
git clone https://github.com/contributor/gmail-toggle.git
cd gmail-toggle
git remote add upstream https://github.com/dblock/gmail-toggle.git
```

### Install Dependencies

Ensure that you can build the project and run tests with Node.js 22 or newer.

```bash
npm install
npm run lint
npm test
```

### Build and Install in Chrome

```bash
npm run build
```

This creates `build/*` which can be loaded as an unpacked extension in Chrome.

## Contribute Code

### Create a Topic Branch

Make sure your fork is up-to-date and create a topic branch for your feature or bug fix.

```bash
git checkout master
git pull upstream master
git checkout -b my-feature-branch
```

### Write Tests

Try to write a test that reproduces the problem you're trying to fix or describes a feature that you want to build. Add tests to [tests](tests).

We definitely appreciate pull requests that highlight or reproduce a problem, even without a fix.

### Write Code

Implement your feature or bug fix.

Code style is enforced with [Prettier](https://prettier.io) through ESLint. Run `npm run format` to format code and `npm run lint` to check code, Markdown, and spelling. Add project-specific words to [.spellcheck.txt](.spellcheck.txt).

### Write Documentation

Document any external behavior in the [README](README.md).

### Update Changelog

Add a line to [CHANGELOG](CHANGELOG.md) under *Next*. Don't remove *Your contribution here*.

Make it look like every other line, including a link to the issue being fixed, your name and link to your GitHub account.

### Commit Changes

Make sure git knows your name and email address:

```bash
git config --global user.name "Your Name"
git config --global user.email "contributor@example.com"
```

Writing good commit logs is important. A commit log should describe what changed and why.

```bash
git add ...
git commit
```

### Push

```bash
git push origin my-feature-branch
```

### Make a Pull Request

Go to `https://github.com/contributor/gmail-toggle` and select your feature branch. Click the 'Pull Request' button and fill out the form. Pull requests are usually reviewed within a few days.

### Update CHANGELOG Again

Update the [CHANGELOG](CHANGELOG.md) with the pull request number. A typical entry looks as follows.

```markdown
* [#123](https://github.com/dblock/gmail-toggle/pull/123): Reticulated splines - [@contributor](https://github.com/contributor).
```

Amend your previous commit and force push the changes.

```bash
git commit --amend
git push origin my-feature-branch -f
```

### Rebase

If you've been working on a change for a while, rebase with upstream/master.

```bash
git fetch upstream
git rebase upstream/master
git push origin my-feature-branch -f
```

### Check on Your Pull Request

Go back to your pull request after a few minutes and see whether it passed muster with [GitHub Actions](https://github.com/dblock/gmail-toggle/actions). Everything should look green, otherwise fix issues and amend your commit as described above.

### Be Patient

It's likely that your change will not be merged and that the nitpicky maintainers will ask you to do more, or fix seemingly benign problems. Hang on there!

## Releasing

See [RELEASING](RELEASING.md).

## Thank You

Please do know that we really appreciate and value your time and work. We love you, really.
