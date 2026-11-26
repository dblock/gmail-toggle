"use strict";

import $ from "jquery";
import { Tree } from "versatile-tree";

const loaderId = setInterval(() => {
  if (!window._gmailjs) {
    return;
  }

  clearInterval(loaderId);
  startExtension(window._gmailjs);
}, 100);

const HIDE_READ_KEY = "gmail-toggle.hideRead";

let state = { showUnread: null };

function loadHideRead() {
  try {
    return window.localStorage.getItem(HIDE_READ_KEY) === "true";
  } catch {
    return false;
  }
}

function saveHideRead(hideRead) {
  try {
    window.localStorage.setItem(HIDE_READ_KEY, String(hideRead));
  } catch {
    // Storage may be unavailable, for example when blocked by browser settings.
  }
}

function nodesList() {
  return $.map($(".nU"), (element) => {
    if (element.parentNode) {
      const outerNode = $(element.parentNode.parentNode);
      if (outerNode) {
        if (!$(outerNode.children()[0]).hasClass("qj")) {
          const firstChild = $(element).children()[0];
          if (firstChild) {
            if (firstChild.getAttribute("tabindex") == "-1") {
              return outerNode;
            }
          }
        }
      }
    }
  }).filter((node) => node !== undefined && node !== null);
}

function getNodeLevel(node) {
  const style = node.attr("style");
  const marginLeftMatch = style.match(/margin-left:\s*(\d+)\s*px/);
  const marginLeft = marginLeftMatch ? parseInt(marginLeftMatch[1], 10) : null;
  const level = marginLeft ? marginLeft / 12 : 0;
  return level;
}

function nodesTree() {
  function buildTree(root, nodes) {
    while (nodes.length > 0) {
      const node = nodes[0];
      const level = getNodeLevel(node);
      if (root.isRoot() || level > root.getData().level) {
        const child = root.addChildData({ node: node, level: level });
        nodes.shift();
        buildTree(child, nodes);
      } else if (level == root.level) {
        root = root.addSiblingData({ node: node, level: level });
        nodes.shift();
      } else {
        break;
      }
    }
    return root;
  }

  const tree = new Tree();
  return buildTree(tree, [...nodesList()]);
}

// function printTree(node) {
//   if (! node.isRoot()) {
//     const data = node.getData()
//     console.log(`${' '.repeat(data.level)}${data.node.text()}`);
//   }
//   node.getChildren().forEach((node) => {
//     printTree(node)
//   })
// }

function applyState() {
  function toggleLeaf(leaf) {
    const visibleChildren = leaf
      .getChildren()
      .map((child) => {
        return toggleLeaf(child);
      })
      .reduce((sum, value) => sum + value, 0);

    if (leaf.isRoot()) {
      return visibleChildren;
    } else if (visibleChildren > 0) {
      // A label with unread labels below it stays visible, also when it was
      // hidden before GMail rendered those labels.
      leaf.getData().node.show();
      return visibleChildren;
    } else {
      const node = leaf.getData().node;
      const unread = node.parent().find(".n1").length;
      // console.log(`${node.text()}: ${unread}`)
      if (state.showUnread == true) {
        node.show();
      } else if (unread == 0) {
        node.hide();
      }
      return unread;
    }
  }

  toggleLeaf(nodesTree());
}

function toggle() {
  state.showUnread = !state.showUnread;
  applyState();
  saveHideRead(!state.showUnread);
  updateIcons();
}

let labelsObserver = null;

function addsLabels(mutations) {
  return mutations.some((mutation) =>
    Array.from(mutation.addedNodes).some(
      (node) =>
        node.nodeType === Node.ELEMENT_NODE &&
        (node.matches(".nU") || node.querySelector(".nU")),
    ),
  );
}

// GMail renders labels before and after it loads, for example the children
// of labels it expands again, and when a label is expanded. Hide the read ones
// as they appear. Observer callbacks run before the browser paints, so hidden
// labels do not flicker.
function observeLabels() {
  labelsObserver = new MutationObserver((mutations) => {
    ensureButtons();
    if (!state.showUnread && addsLabels(mutations)) {
      applyState();
    }
  });
  labelsObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

const BUTTON_CLASS = "gmail-toggle-button";

// An open envelope while every label is shown, a closed one while read labels
// are hidden.
function iconUrl() {
  return chrome.runtime.getURL(
    state.showUnread ? "icons/icon_16.png" : "icons/icon_closed_16.png",
  );
}

function updateIcons() {
  $(`.${BUTTON_CLASS} img`).attr("src", iconUrl());
}

// Keeps the button visible when GMail hides toolbar items.
function keepVisible(container) {
  const observer = new MutationObserver((mutationsList) => {
    for (let mutation of mutationsList) {
      if (
        mutation.type === "attributes" &&
        mutation.attributeName === "style"
      ) {
        if (
          mutation.target &&
          mutation.target.style &&
          mutation.target.style.display === "none"
        ) {
          mutation.target.style.display = "block";
        }
      }
    }
  });

  observer.observe(container, {
    attributes: true,
    attributeFilter: ["style"],
  });
}

// Adds the button to a toolbar, with the same markup as gmail.js toolbar buttons.
function addButton(toolbar) {
  const img = document.createElement("img");
  img.src = iconUrl();

  const button = $(document.createElement("div"))
    .attr("class", "T-I J-J5-Ji gmailjs lS asa")
    .append(img)
    .on("click", () => toggle());

  const container = $(document.createElement("div"))
    .attr("class", `G-Ni J-J5-Ji ${BUTTON_CLASS}`)
    .attr("data-tooltip", "Toggle Read/Unread")
    .append(button);

  toolbar.append(container);
  keepVisible(container.get(0));
}

// GMail renders a new message list toolbar for each view, for example when a
// label is selected, so add the button to every toolbar that doesn't have it.
function ensureButtons() {
  $("[gh='mtb']").each((_, element) => {
    let toolbar = $(element);
    if (toolbar.find(`.${BUTTON_CLASS}`).length > 0) {
      return;
    }
    while (toolbar.children().length === 1) {
      toolbar = toolbar.children().first();
    }
    addButton(toolbar);
  });
}

function startExtension(gmail) {
  window.gmail = gmail;

  state = { showUnread: !loadHideRead() };

  if (labelsObserver) {
    labelsObserver.disconnect?.();
    labelsObserver = null;
  }

  if (!state.showUnread) {
    applyState();
  }
  observeLabels();

  gmail.observe.on("load", () => {
    ensureButtons();
    updateIcons();
  });
}

export { startExtension, toggle };
