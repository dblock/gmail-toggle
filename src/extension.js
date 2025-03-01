"use strict";

import $ from "jquery";

const loaderId = setInterval(() => {
  if (!window._gmailjs) {
    return;
  }

  clearInterval(loaderId);
  startExtension(window._gmailjs);
}, 100);

function hideReadCategories() {
  $.each($(".nU"), (index, element) => {
    if (!$(element).hasClass("n1")) {
      const outerNode = $(element.parentNode.parentNode);
      if (!$(outerNode.children()[0]).hasClass("qj")) {
        if ($(element).children()[0].getAttribute("tabindex") == "-1") {
          outerNode.hide();
        }
      }
    }
  });
}

function addButton() {
  const button = gmail.tools.add_toolbar_button(
    (() => {
      const img = document.createElement("img");
      img.src = chrome.runtime.getURL("icons/icon_16.png");
      return img;
    })(),
    () => hideReadCategories(),
    "asa",
  );

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

  gmail.observe.on("load", () => {
    addButton();
  });
}
