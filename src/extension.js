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
const PLACEMENT_KEY = "gmail-toggle.placement";

// Where the button goes: the message list toolbar, the Labels header next to
// "+", or both.
const PLACEMENTS = ["toolbar", "labels", "both"];
const DEFAULT_PLACEMENT = "both";

const HIDE_KEY = "gmail-toggle.hide";

// What a toggle hides: read categories and labels ("folders"), read messages
// in the message list ("mail"), or both.
const HIDES = ["folders", "mail", "both"];
const DEFAULT_HIDE = "folders";
const HIDE_MAIL_CLASS = "gmail-toggle-hide-read-mail";

let state = { showUnread: null };

function loadHideRead() {
  try {
    return window.localStorage.getItem(HIDE_READ_KEY) === "true";
  } catch {
    return false;
  }
}

function loadPlacement() {
  try {
    const placement = window.localStorage.getItem(PLACEMENT_KEY);
    return PLACEMENTS.includes(placement) ? placement : DEFAULT_PLACEMENT;
  } catch {
    return DEFAULT_PLACEMENT;
  }
}

function loadHide() {
  try {
    const hide = window.localStorage.getItem(HIDE_KEY);
    return HIDES.includes(hide) ? hide : DEFAULT_HIDE;
  } catch {
    return DEFAULT_HIDE;
  }
}

function saveHide(hide) {
  try {
    window.localStorage.setItem(HIDE_KEY, hide);
  } catch {
    // Storage may be unavailable, for example when blocked by browser settings.
  }
}

function savePlacement(placement) {
  try {
    window.localStorage.setItem(PLACEMENT_KEY, placement);
  } catch {
    // Storage may be unavailable, for example when blocked by browser settings.
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

const hidesFolders = () => state.hide !== "mail";
const hidesMail = () => state.hide !== "folders";

// Hides read message rows with a stylesheet while the class is on the page,
// so rows GMail renders later are hidden too.
function addHideMailStyle() {
  if (document.getElementById(HIDE_MAIL_CLASS)) {
    return;
  }
  const style = document.createElement("style");
  style.id = HIDE_MAIL_CLASS;
  style.textContent = `.${HIDE_MAIL_CLASS} tr.zA.yO { display: none !important; }`;
  (document.head || document.documentElement).append(style);
}

function applyState() {
  const hideFolders = !state.showUnread && hidesFolders();
  const hideMail = !state.showUnread && hidesMail();

  if (hideMail) {
    addHideMailStyle();
  }
  document.documentElement.classList.toggle(HIDE_MAIL_CLASS, hideMail);

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
      if (!hideFolders) {
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
    if (!state.showUnread && hidesFolders() && addsLabels(mutations)) {
      applyState();
    }
  });
  labelsObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}

const BUTTON_CLASS = "gmail-toggle-button";
const TOOLBAR_BUTTON_CLASS = "gmail-toggle-toolbar-button";
const LABELS_BUTTON_CLASS = "gmail-toggle-labels-button";

// An open envelope while every label is shown, a closed one while read labels
// are hidden, with a 32 pixel version for high-density screens.
function icon(img) {
  const name = state.showUnread ? "icon" : "icon_closed";
  img.src = chrome.runtime.getURL(`icons/${name}_16.png`);
  img.srcset = `${chrome.runtime.getURL(`icons/${name}_32.png`)} 2x`;
}

function updateIcons() {
  $(`.${BUTTON_CLASS} img`).each((_, img) => icon(img));
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
  icon(img);

  const button = $(document.createElement("div"))
    .attr("class", "T-I J-J5-Ji gmailjs lS asa")
    .append(img)
    .on("click", () => toggle());

  const container = $(document.createElement("div"))
    .attr("class", `G-Ni J-J5-Ji ${BUTTON_CLASS} ${TOOLBAR_BUTTON_CLASS}`)
    .attr("data-tooltip", "Toggle Read/Unread")
    .append(button);

  toolbar.append(container);
  keepVisible(container.get(0));
}

// GMail renders a new message list toolbar for each view, for example when a
// label is selected, so add the button to every toolbar that doesn't have it.
function ensureToolbarButtons() {
  $("[gh='mtb']").each((_, element) => {
    let toolbar = $(element);
    if (toolbar.find(`.${TOOLBAR_BUTTON_CLASS}`).length > 0) {
      return;
    }
    while (toolbar.children().length === 1) {
      toolbar = toolbar.children().first();
    }
    addButton(toolbar);
  });
}

// Styles the Labels header button like the "+" next to it.
function addLabelsButtonStyle() {
  if (document.getElementById(LABELS_BUTTON_CLASS)) {
    return;
  }
  const style = document.createElement("style");
  style.id = LABELS_BUTTON_CLASS;
  style.textContent = `
    .${LABELS_BUTTON_CLASS} {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      margin-left: auto;
      border-radius: 50%;
      cursor: pointer;
    }
    .${LABELS_BUTTON_CLASS}:hover,
    .${LABELS_BUTTON_CLASS}:focus-visible {
      background-color: rgba(32, 33, 36, 0.08);
      outline: none;
    }
    .${LABELS_BUTTON_CLASS} img {
      width: 16px;
      height: 16px;
      /* The envelopes sit low in their square; line them up with the "+". */
      transform: translateY(-1.5px);
    }
  `;
  (document.head || document.documentElement).append(style);
}

// Adds the button to the Labels header, just before its "+" (create new label)
// button. GMail's class names don't depend on the interface language.
function ensureLabelsButton() {
  $(".aAw").each((_, header) => {
    const create = $(header).children(".aAu").first();
    if (
      create.length === 0 ||
      $(header).find(`.${LABELS_BUTTON_CLASS}`).length > 0
    ) {
      return;
    }
    addLabelsButtonStyle();

    const img = document.createElement("img");
    icon(img);
    img.alt = "";

    const button = $(document.createElement("div"))
      .attr({
        class: `${BUTTON_CLASS} ${LABELS_BUTTON_CLASS}`,
        role: "button",
        tabindex: "0",
        "aria-label": "Toggle Read/Unread",
        "data-tooltip": "Toggle Read/Unread",
      })
      .append(img)
      .on("click", () => toggle())
      .on("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          toggle();
        }
      });
    create.before(button);
  });
}

// Shows the button where the placement says, and removes it elsewhere.
function ensureButtons() {
  if (state.placement === "labels") {
    $(`.${TOOLBAR_BUTTON_CLASS}`).remove();
  } else {
    ensureToolbarButtons();
  }
  if (state.placement === "toolbar") {
    $(`.${LABELS_BUTTON_CLASS}`).remove();
  } else {
    ensureLabelsButton();
  }
}

function setPlacement(placement) {
  state.placement = placement;
  ensureButtons();
}

function setHide(hide) {
  state.hide = hide;
  applyState();
}

const GET_SETTINGS = "gmail-toggle.getSettings";
const SET_PLACEMENT = "gmail-toggle.setPlacement";
const SET_HIDE = "gmail-toggle.setHide";

// Answers the extension's popup, which reads and changes the settings.
function handleMessage(message, _sender, sendResponse) {
  if (
    message?.type === SET_PLACEMENT &&
    PLACEMENTS.includes(message.placement)
  ) {
    savePlacement(message.placement);
    setPlacement(message.placement);
  } else if (message?.type === SET_HIDE && HIDES.includes(message.hide)) {
    saveHide(message.hide);
    setHide(message.hide);
  } else if (message?.type !== GET_SETTINGS) {
    return false;
  }
  sendResponse({ placement: state.placement, hide: state.hide });
  return false;
}

// Follows settings chosen in another GMail tab.
function handleStorage(event) {
  if (event.key === PLACEMENT_KEY) {
    setPlacement(loadPlacement());
  } else if (event.key === HIDE_KEY) {
    setHide(loadHide());
  }
}

function startExtension(gmail) {
  window.gmail = gmail;

  state = {
    showUnread: !loadHideRead(),
    placement: loadPlacement(),
    hide: loadHide(),
  };

  chrome.runtime.onMessage?.addListener(handleMessage);
  window.removeEventListener("storage", handleStorage);
  window.addEventListener("storage", handleStorage);

  if (labelsObserver) {
    labelsObserver.disconnect?.();
    labelsObserver = null;
  }

  if (!state.showUnread) {
    applyState();
  } else {
    document.documentElement.classList.remove(HIDE_MAIL_CLASS);
  }
  observeLabels();

  gmail.observe.on("load", () => {
    ensureButtons();
    updateIcons();
  });
}

export { startExtension, toggle, handleMessage };
