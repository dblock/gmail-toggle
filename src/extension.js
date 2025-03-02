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

let state = { showUnread: null };

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

function toggle() {
  function toggleLeaf(leaf) {
    const visibleChildren = leaf
      .getChildren()
      .map((child) => {
        return toggleLeaf(child);
      })
      .reduce((sum, value) => sum + value, 0);

    if (leaf.isRoot() || visibleChildren > 0) {
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

  state.showUnread = !state.showUnread;
  toggleLeaf(nodesTree());
}

function addButton() {
  const button = gmail.tools.add_toolbar_button(
    (() => {
      const img = document.createElement("img");
      img.src = chrome.runtime.getURL("icons/icon_16.png");
      return img;
    })(),
    () => toggle(),
    "asa",
  );

  button.attr("data-tooltip", "Toggle Read/Unread");

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

  observer.observe(button.get(0), {
    attributes: true,
    attributeFilter: ["style"],
  });
}

function startExtension(gmail) {
  window.gmail = gmail;

  state = { showUnread: true };

  gmail.observe.on("load", () => {
    addButton();
  });
}

export { startExtension, toggle };
