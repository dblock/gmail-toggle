# <img src="public/icons/icon_32.png" align="left" alt=""> Toggle Categories and Labels in GMail

[![Test](https://github.com/dblock/gmail-toggle/actions/workflows/test.yml/badge.svg)](https://github.com/dblock/gmail-toggle/actions/workflows/test.yml)
[![Lint](https://github.com/dblock/gmail-toggle/actions/workflows/lint.yml/badge.svg)](https://github.com/dblock/gmail-toggle/actions/workflows/lint.yml)

A Chrome extension that toggles (shows or hides) categories and labels that have unread messages in GMail.

![Toggling read categories and labels in GMail](demo.gif)

## Installation

Download `gmail-toggle-v<version>.zip` from the [latest release](https://github.com/dblock/gmail-toggle/releases/latest) and unzip it. In Chrome, open `chrome://extensions`, turn on Developer mode, choose Load unpacked, and select the unzipped folder. To build the extension from source instead, see [CONTRIBUTING](CONTRIBUTING.md).

## Usage

Open [GMail](https://mail.google.com) and click the extension's button in the toolbar above the message list to hide categories and labels without unread messages. Click it again to show them. The extension remembers your choice when GMail reloads.

## Contributing

You're encouraged to contribute to this project. See [CONTRIBUTING](CONTRIBUTING.md) for details, [CHANGELOG](CHANGELOG.md) for what changed in each release, and [RELEASING](RELEASING.md) for how releases are made.

This project was bootstrapped with [Chrome Extension CLI](https://github.com/dutiyesh/chrome-extension-cli) and uses [gmail.js](https://github.com/KartikTalwar/gmail.js) and its [boilerplate](https://github.com/josteink/gmailjs-node-boilerplate). [Unread icons created by Milkghost Studio - Flaticon](https://www.flaticon.com/free-icons/unread).

## License

Copyright (c) Daniel Doubrovkine and Contributors.

This project is licensed under the [MIT License](LICENSE.md).
