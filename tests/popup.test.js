import fs from "fs";
import path from "path";
import { initPopup } from "popup";

describe("Popup", () => {
  let chromeApi;
  const radio = (value, name = "placement") =>
    document.querySelector(`input[name="${name}"][value="${value}"]`);

  beforeEach(() => {
    document.documentElement.innerHTML = fs.readFileSync(
      path.resolve(__dirname, "../public/popup.html"),
      "utf8",
    );
    chromeApi = {
      tabs: {
        query: jest.fn(async () => [{ id: 7 }]),
        sendMessage: jest.fn(async () => ({
          placement: "labels",
          hide: "mail",
        })),
      },
    };
  });

  test("checks the placement the GMail tab reports", async () => {
    await initPopup(document, chromeApi);
    expect(chromeApi.tabs.sendMessage).toHaveBeenCalledWith(7, {
      type: "gmail-toggle.getSettings",
    });
    expect(radio("labels").checked).toBe(true);
    expect(radio("mail", "hide").checked).toBe(true);
    document
      .querySelectorAll("fieldset")
      .forEach((fieldset) => expect(fieldset.disabled).toBe(false));
    expect(document.getElementById("unavailable").hidden).toBe(true);
  });

  test("sends a new placement to the GMail tab", async () => {
    await initPopup(document, chromeApi);
    radio("toolbar").checked = true;
    radio("toolbar").dispatchEvent(new Event("change", { bubbles: true }));
    expect(chromeApi.tabs.sendMessage).toHaveBeenLastCalledWith(7, {
      type: "gmail-toggle.setPlacement",
      placement: "toolbar",
    });
  });

  test("sends a new choice of what to hide to the GMail tab", async () => {
    await initPopup(document, chromeApi);
    radio("both", "hide").checked = true;
    radio("both", "hide").dispatchEvent(new Event("change", { bubbles: true }));
    expect(chromeApi.tabs.sendMessage).toHaveBeenLastCalledWith(7, {
      type: "gmail-toggle.setHide",
      hide: "both",
    });
  });

  test("asks to open GMail when the tab doesn't answer", async () => {
    chromeApi.tabs.sendMessage = jest.fn(async () => {
      throw new Error("Could not establish connection.");
    });
    await initPopup(document, chromeApi);
    document
      .querySelectorAll("fieldset")
      .forEach((fieldset) => expect(fieldset.disabled).toBe(true));
    expect(document.getElementById("unavailable").hidden).toBe(false);
  });

  test("links to the Chrome Web Store and GitHub", () => {
    const links = [...document.querySelectorAll("footer a")].map((a) => a.href);
    expect(links).toEqual([
      "https://chromewebstore.google.com/detail/toggle-categories-and-lab/ckejkcopppahbffilefogkmhcgepmnog",
      "https://github.com/dblock/gmail-toggle",
    ]);
  });
});
