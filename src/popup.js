"use strict";

const GET_PLACEMENT = "gmail-toggle.getPlacement";
const SET_PLACEMENT = "gmail-toggle.setPlacement";

// Reads the placement from the GMail tab's content script and sends changes
// back to it. The content script saves the choice in GMail's own storage, so
// the extension needs no extra permissions.
async function initPopup(document, chromeApi) {
  const form = document.getElementById("placement");
  const fieldset = form.querySelector("fieldset");
  const unavailable = document.getElementById("unavailable");

  let tab;
  let placement;
  try {
    [tab] = await chromeApi.tabs.query({ active: true, currentWindow: true });
    ({ placement } = await chromeApi.tabs.sendMessage(tab.id, {
      type: GET_PLACEMENT,
    }));
  } catch {
    // The active tab isn't GMail, so no content script answers.
  }

  const radio = form.querySelector(`input[value="${placement}"]`);
  if (!radio) {
    unavailable.hidden = false;
    return;
  }
  radio.checked = true;
  fieldset.disabled = false;

  form.addEventListener("change", async (event) => {
    await chromeApi.tabs.sendMessage(tab.id, {
      type: SET_PLACEMENT,
      placement: event.target.value,
    });
  });
}

if (globalThis.chrome?.tabs) {
  initPopup(document, globalThis.chrome);
}

export { initPopup };
