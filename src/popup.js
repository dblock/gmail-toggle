"use strict";

const GET_SETTINGS = "gmail-toggle.getSettings";
const SET_PLACEMENT = "gmail-toggle.setPlacement";
const SET_HIDE = "gmail-toggle.setHide";

// Reads the settings from the GMail tab's content script and sends changes
// back to it. The content script saves them in GMail's own storage, so the
// extension needs no extra permissions.
async function initPopup(document, chromeApi) {
  const form = document.getElementById("settings");
  const unavailable = document.getElementById("unavailable");

  let tab;
  let settings;
  try {
    [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
    settings = await chromeApi.tabs.sendMessage(tab.id, { type: GET_SETTINGS });
  } catch {
    // The active tab isn't GMail, so no content script answers.
  }

  const hide = form.querySelector(
    `input[name="hide"][value="${settings?.hide}"]`,
  );
  const placement = form.querySelector(
    `input[name="placement"][value="${settings?.placement}"]`,
  );
  if (!hide || !placement) {
    unavailable.hidden = false;
    return;
  }
  hide.checked = true;
  placement.checked = true;
  form.querySelectorAll("fieldset").forEach((fieldset) => {
    fieldset.disabled = false;
  });

  form.addEventListener("change", async (event) => {
    const { name, value } = event.target;
    await chromeApi.tabs.sendMessage(
      tab.id,
      name === "hide"
        ? { type: SET_HIDE, hide: value }
        : { type: SET_PLACEMENT, placement: value },
    );
  });
}

if (globalThis.chrome?.tabs) {
  initPopup(document, globalThis.chrome);
}

export { initPopup };
