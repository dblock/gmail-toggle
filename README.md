# <img src="public/icons/icon_32.png" align="left" alt=""> Toggle Read and Unread Labels and Mail in GMail

[![Test](https://github.com/dblock/gmail-toggle/actions/workflows/test.yml/badge.svg)](https://github.com/dblock/gmail-toggle/actions/workflows/test.yml)
[![Lint](https://github.com/dblock/gmail-toggle/actions/workflows/lint.yml/badge.svg)](https://github.com/dblock/gmail-toggle/actions/workflows/lint.yml)

A Chrome extension that shows and hides the GMail labels, categories, and messages you've already read.

![Showing and hiding read labels and mail in GMail](demo.gif)

## Installation

Install [Toggle Read and Unread Labels and Mail in GMail](https://chromewebstore.google.com/detail/toggle-categories-and-lab/ckejkcopppahbffilefogkmhcgepmnog) from the Chrome Web Store. To build the extension from source instead, see [CONTRIBUTING](CONTRIBUTING.md).

## Usage

Open [GMail](https://mail.google.com) and click the extension's button in the toolbar above the message list to hide categories and labels without unread messages. Click it again to show them. The extension remembers your choice when GMail reloads.

The button appears both in that toolbar and next to the "+" in the sidebar's Labels header. To choose one, click the extension's icon in Chrome's toolbar (or in its Extensions menu) while GMail is open, and pick Message toolbar, Labels header, or Both.

The same menu chooses what the button hides: read labels and categories (the default), read messages in the message list, or both. Hidden messages are only hidden on your screen; nothing in GMail changes. Read messages that you select show again, so selecting all and deleting, archiving, or moving never touches mail you can't see, and keyboard shortcuts that change a message do nothing while the keyboard cursor is on a hidden one. GMail's link to select every conversation, including those on other pages, is hidden too; show everything to use it.

## Contributing

You're encouraged to contribute to this project. See [CONTRIBUTING](CONTRIBUTING.md) for details, [CHANGELOG](CHANGELOG.md) for what changed in each release, and [RELEASING](RELEASING.md) for how releases are made.

This project was bootstrapped with [Chrome Extension CLI](https://github.com/dutiyesh/chrome-extension-cli) and uses [gmail.js](https://github.com/KartikTalwar/gmail.js) and its [boilerplate](https://github.com/josteink/gmailjs-node-boilerplate). [Unread icons created by Milkghost Studio - Flaticon](https://www.flaticon.com/free-icons/unread).

## License

Copyright (c) Daniel Doubrovkine and Contributors.

This project is licensed under the [MIT License](LICENSE.md).
