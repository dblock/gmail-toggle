import { startExtension, toggle, handleMessage } from "extension";
import fs from "fs";
import path from "path";
import $ from "jquery";

const RealMutationObserver = global.MutationObserver;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Extension", () => {
  describe("#startExtension", () => {
    let mockGmail;
    let extensionObserver;

    // A GMail message list toolbar: [gh='mtb'] wraps the row of buttons.
    const toolbarHtml =
      '<div gh="mtb"><div><div class="row"><div class="refresh"></div><div class="more"></div></div></div></div>';
    const buttons = (root = document) =>
      $(root).find(".gmail-toggle-toolbar-button");

    beforeEach(() => {
      window.localStorage.clear();
      document.body.innerHTML = toolbarHtml;

      global.chrome = {
        runtime: {
          getURL: jest.fn((path) => path),
        },
      };

      mockGmail = {
        observe: {
          on: jest.fn((event, callback) => {
            if (event === "load") {
              callback();
            }
          }),
        },
      };

      extensionObserver = {
        observe: jest.fn(),
      };

      global.MutationObserver = jest.fn(() => {
        return extensionObserver;
      });

      startExtension(mockGmail);
    });

    test("adds a toolbar button next to the other buttons", () => {
      expect(buttons().length).toEqual(1);
      expect(buttons().parent().hasClass("row")).toBe(true);
      expect(buttons().find("img").attr("src")).toEqual("icons/icon_16.png");
    });

    test("shows an open envelope while every label is shown", () => {
      expect(buttons().find("img").attr("src")).toEqual("icons/icon_16.png");
      expect(buttons().find("img").attr("srcset")).toEqual(
        "icons/icon_32.png 2x",
      );
    });

    test("shows a closed envelope while read labels are hidden", () => {
      toggle();
      expect(buttons().find("img").attr("src")).toEqual(
        "icons/icon_closed_16.png",
      );
      expect(buttons().find("img").attr("srcset")).toEqual(
        "icons/icon_closed_32.png 2x",
      );
    });

    test("shows an open envelope again after toggling back", () => {
      toggle();
      toggle();
      expect(buttons().find("img").attr("src")).toEqual("icons/icon_16.png");
    });

    test("shows a closed envelope on reload when read labels were hidden", () => {
      window.localStorage.setItem("gmail-toggle.hideRead", "true");
      startExtension(mockGmail);
      expect(buttons().find("img").attr("src")).toEqual(
        "icons/icon_closed_16.png",
      );
    });

    test("adds a tooltip", () => {
      expect(buttons().attr("data-tooltip")).toEqual("Toggle Read/Unread");
    });

    test("observed on load", () => {
      expect(mockGmail.observe.on).toHaveBeenCalledWith(
        "load",
        expect.any(Function),
      );
    });

    test("adds a MutationObserver", () => {
      expect(global.MutationObserver).toHaveBeenCalled();
    });

    test("calls observe on MutationObserver with the added button", () => {
      expect(extensionObserver.observe).toHaveBeenCalledWith(buttons().get(0), {
        attributeFilter: ["style"],
        attributes: true,
      });
    });

    describe("hiding read mail", () => {
      // GMail's message list: a read row (yO) and an unread row (zE).
      const rowsHtml =
        '<table><tbody><tr class="zA yO"><td>Read</td></tr><tr class="zA zE"><td>Unread</td></tr></tbody></table>' +
        // The banner after selecting a whole page, with its link to select every conversation.
        '<div class="ya yb"><span>All <b>2</b> conversations on this page are selected.</span> <span class="x8" role="link">Select all <b>9</b> conversations in Inbox</span></div>';
      let html;
      const start = (hide) => {
        if (hide) {
          window.localStorage.setItem("gmail-toggle.hide", hide);
        }
        html = document.createElement("div");
        html.innerHTML =
          fs.readFileSync(
            path.resolve(__dirname, "./fixtures/categories.html"),
            "utf8",
          ) + rowsHtml;
        document.body.appendChild(html);
        startExtension(mockGmail);
      };
      const hiddenLabels = () =>
        $(html).find('.TN[style*="display: none"]').length;
      const hidesMail = () =>
        document.documentElement.classList.contains(
          "gmail-toggle-hide-read-mail",
        );
      const display = (selector) =>
        window.getComputedStyle($(selector).get(0)).display;
      const send = (message) => {
        const sendResponse = jest.fn();
        handleMessage(message, {}, sendResponse);
        return sendResponse;
      };

      test("hides only read categories and labels by default", () => {
        start();
        toggle();
        expect(hiddenLabels()).toEqual(42);
        expect(hidesMail()).toBe(false);
        expect(display("tr.zA.yO")).not.toEqual("none");
      });

      test("hides only read mail when chosen", () => {
        start("mail");
        toggle();
        expect(hiddenLabels()).toEqual(0);
        expect(hidesMail()).toBe(true);
        expect(display("tr.zA.yO")).toEqual("none");
        expect(display("tr.zA.zE")).not.toEqual("none");
      });

      test("shows the read row under the keyboard cursor", () => {
        start("mail");
        toggle();
        $("tr.zA.yO").addClass("btb");
        expect(display("tr.zA.yO")).not.toEqual("none");
      });

      test("keeps read rows hidden when an unread row is selected", () => {
        start("mail");
        toggle();
        $("tr.zA.zE").addClass("x7");
        expect(display("tr.zA.yO")).toEqual("none");
      });

      test("hides the link to select conversations on other pages", () => {
        start("mail");
        toggle();
        expect(display(".ya .x8")).toEqual("none");
        toggle();
        expect(display(".ya .x8")).not.toEqual("none");
      });

      test("keeps the link to select every conversation when only labels are hidden", () => {
        start();
        toggle();
        expect(display(".ya .x8")).not.toEqual("none");
      });

      test("shows a selected read row", () => {
        start("mail");
        toggle();
        $("tr.zA.yO").addClass("x7");
        expect(display("tr.zA.yO")).not.toEqual("none");
        $("tr.zA.yO").removeClass("x7");
        expect(display("tr.zA.yO")).toEqual("none");
      });

      test("hides read categories, labels, and mail when both are chosen", () => {
        start("both");
        toggle();
        expect(hiddenLabels()).toEqual(42);
        expect(hidesMail()).toBe(true);
      });

      test("shows everything again when toggled back", () => {
        start("both");
        toggle();
        toggle();
        expect(hiddenLabels()).toEqual(0);
        expect(hidesMail()).toBe(false);
        expect(display("tr.zA.yO")).not.toEqual("none");
      });

      test("applies and saves a new choice from the popup while hidden", () => {
        start();
        toggle();
        expect(
          send({ type: "gmail-toggle.setHide", hide: "mail" }),
        ).toHaveBeenCalledWith({ placement: "both", hide: "mail" });
        expect(window.localStorage.getItem("gmail-toggle.hide")).toEqual(
          "mail",
        );
        expect(hiddenLabels()).toEqual(0);
        expect(hidesMail()).toBe(true);
      });

      test("ignores an unknown choice", () => {
        start();
        expect(
          send({ type: "gmail-toggle.setHide", hide: "everything" }),
        ).not.toHaveBeenCalled();
        expect(send({ type: "gmail-toggle.getSettings" })).toHaveBeenCalledWith(
          { placement: "both", hide: "folders" },
        );
      });

      test("falls back to folders for an unknown saved choice", () => {
        start("everything");
        toggle();
        expect(hiddenLabels()).toEqual(42);
        expect(hidesMail()).toBe(false);
      });

      test("follows a choice made in another GMail tab", () => {
        start();
        toggle();
        window.localStorage.setItem("gmail-toggle.hide", "both");
        window.dispatchEvent(
          new StorageEvent("storage", { key: "gmail-toggle.hide" }),
        );
        expect(hiddenLabels()).toEqual(42);
        expect(hidesMail()).toBe(true);
      });

      test("hides read mail again on reload when it was hidden", () => {
        window.localStorage.setItem("gmail-toggle.hideRead", "true");
        start("mail");
        expect(hidesMail()).toBe(true);
        expect(hiddenLabels()).toEqual(0);
      });
    });

    describe("placement", () => {
      // GMail's Labels header: the heading and its "+" (create new label) button.
      const labelsHeaderHtml =
        '<div class="aAw"><span class="aAv" role="heading">Labels</span><div class="aAu" role="button"></div></div>';
      const labelsButtons = () => $(".gmail-toggle-labels-button");
      const start = (placement) => {
        if (placement) {
          window.localStorage.setItem("gmail-toggle.placement", placement);
        }
        document.body.innerHTML = toolbarHtml + labelsHeaderHtml;
        startExtension(mockGmail);
      };
      const send = (message) => {
        const sendResponse = jest.fn();
        handleMessage(message, {}, sendResponse);
        return sendResponse;
      };

      test("shows the button in the toolbar and the Labels header by default", () => {
        start();
        expect(buttons().length).toEqual(1);
        expect(labelsButtons().length).toEqual(1);
        expect(labelsButtons().next().hasClass("aAu")).toBe(true);
        expect(labelsButtons().attr("role")).toEqual("button");
        expect(labelsButtons().attr("data-tooltip")).toEqual(
          "Toggle Read/Unread",
        );
      });

      test("shows only the toolbar button when chosen", () => {
        start("toolbar");
        expect(buttons().length).toEqual(1);
        expect(labelsButtons().length).toEqual(0);
      });

      test("shows only the Labels header button when chosen", () => {
        start("labels");
        expect(buttons().length).toEqual(0);
        expect(labelsButtons().length).toEqual(1);
      });

      test("falls back to both for an unknown placement", () => {
        start("sidebar");
        expect(buttons().length).toEqual(1);
        expect(labelsButtons().length).toEqual(1);
      });

      test("adds the Labels header button once", () => {
        start();
        startExtension(mockGmail);
        expect(labelsButtons().length).toEqual(1);
        expect($("#gmail-toggle-labels-button").length).toEqual(1);
      });

      test("toggles from the Labels header button by click and keyboard", () => {
        start();
        labelsButtons().trigger("click");
        expect(labelsButtons().find("img").attr("src")).toEqual(
          "icons/icon_closed_16.png",
        );
        labelsButtons().trigger($.Event("keydown", { key: "Enter" }));
        expect(labelsButtons().find("img").attr("src")).toEqual(
          "icons/icon_16.png",
        );
      });

      test("answers the popup with the current placement", () => {
        start("labels");
        expect(send({ type: "gmail-toggle.getSettings" })).toHaveBeenCalledWith(
          { placement: "labels", hide: "folders" },
        );
      });

      test("changes and saves the placement from the popup", () => {
        start();
        expect(
          send({ type: "gmail-toggle.setPlacement", placement: "toolbar" }),
        ).toHaveBeenCalledWith({ placement: "toolbar", hide: "folders" });
        expect(window.localStorage.getItem("gmail-toggle.placement")).toEqual(
          "toolbar",
        );
        expect(labelsButtons().length).toEqual(0);
        expect(buttons().length).toEqual(1);
        send({ type: "gmail-toggle.setPlacement", placement: "labels" });
        expect(labelsButtons().length).toEqual(1);
        expect(buttons().length).toEqual(0);
      });

      test("ignores unknown placements and messages", () => {
        start();
        expect(
          send({ type: "gmail-toggle.setPlacement", placement: "sidebar" }),
        ).not.toHaveBeenCalled();
        expect(send({ type: "other" })).not.toHaveBeenCalled();
        expect(buttons().length).toEqual(1);
        expect(labelsButtons().length).toEqual(1);
      });

      test("follows a placement chosen in another GMail tab", () => {
        start();
        window.localStorage.setItem("gmail-toggle.placement", "labels");
        window.dispatchEvent(
          new StorageEvent("storage", { key: "gmail-toggle.placement" }),
        );
        expect(buttons().length).toEqual(0);
        expect(labelsButtons().length).toEqual(1);
      });

      test("listens for messages from the popup", () => {
        global.chrome.runtime.onMessage = { addListener: jest.fn() };
        start();
        expect(
          global.chrome.runtime.onMessage.addListener,
        ).toHaveBeenCalledWith(handleMessage);
      });
    });

    describe("when GMail renders a new toolbar", () => {
      beforeEach(() => {
        global.MutationObserver = RealMutationObserver;
        document.body.innerHTML = toolbarHtml;
        startExtension(mockGmail);
      });

      test("adds the button to a toolbar that replaces the old one", async () => {
        $("[gh='mtb']").remove();
        $(document.body).append(toolbarHtml);
        await flush();
        expect(buttons().length).toEqual(1);
        expect(buttons().parent().hasClass("row")).toBe(true);
      });

      test("adds the button to each toolbar", async () => {
        $(document.body).append(toolbarHtml);
        await flush();
        expect(buttons().length).toEqual(2);
        $("[gh='mtb']").each((_, toolbar) =>
          expect(buttons(toolbar).length).toEqual(1),
        );
      });

      test("never adds a second button to a toolbar", async () => {
        $(".row").append('<div class="new"></div>');
        $(document.body).append("<div></div>");
        await flush();
        expect(buttons().length).toEqual(1);
      });
    });

    describe("#toggle", () => {
      let html;

      beforeEach(() => {
        html = document.createElement("html");
        html.innerHTML = fs.readFileSync(
          path.resolve(__dirname, "./fixtures/categories.html"),
          "utf8",
        );
        document.body.appendChild(html);
      });

      test("has unread categories", () => {
        expect($(html).find(".TN").length).toEqual(59);
        expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
          0,
        );
        expect($(html).find(".nU").length).toEqual(59);
        expect($(html).find(".n1").length).toEqual(9);
      });

      test("clicking the toolbar button hides read categories", () => {
        buttons().children().first().trigger("click");
        expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
          42,
        );
      });

      describe("clicked once", () => {
        beforeEach(() => {
          toggle();
        });

        test("hides read categories", () => {
          expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
            42,
          );
        });

        test("keeps an unread node", () => {
          let unreadNode = $(
            $(html).find(
              '.nU a[aria-label*="OpenSearch 77 unread has menu"]',
            )[0],
          )
            .parent()
            .parent()
            .parent();
          expect(unreadNode.css("display")).toEqual("block");
        });

        test("shows an unread category", () => {
          let unreadCategoryNode = $(
            $(html).find(
              '.nU a[aria-label*="_ Open Source expanded has menu"]',
            )[0],
          )
            .parent()
            .parent()
            .parent();
          expect(unreadCategoryNode.css("display")).toEqual("block");
        });

        test("hides an unread leaf node", () => {
          let unreadLeafNode = $(
            $(html).find('.nU a[aria-label*="aws-cdk has menu"]')[0],
          )
            .parent()
            .parent()
            .parent();
          expect(unreadLeafNode.css("display")).toEqual("none");
        });

        test("remembers that read categories are hidden", () => {
          expect(window.localStorage.getItem("gmail-toggle.hideRead")).toEqual(
            "true",
          );
        });

        describe("toggled", () => {
          beforeEach(() => {
            toggle();
          });

          test("remembers that read categories are shown", () => {
            expect(
              window.localStorage.getItem("gmail-toggle.hideRead"),
            ).toEqual("false");
          });

          test("toggles read node back", () => {
            expect($(html).find(".TN").length).toEqual(59);
            expect(
              $($(html).find('.TN[style*="display: none"]')).length,
            ).toEqual(0);
          });
        });

        describe("with a randomly expanded node", () => {
          beforeEach(() => {
            let unreadNode = $(
              $(html).find(
                '.nU a[aria-label*="OpenSearch 77 unread has menu"]',
              )[0],
            )
              .parent()
              .parent()
              .parent();
            unreadNode.hide();
            toggle();
          });

          test("toggles read node back", () => {
            expect($(html).find(".TN").length).toEqual(59);
            expect(
              $($(html).find('.TN[style*="display: none"]')).length,
            ).toEqual(0);
          });
        });
      });
    });

    describe("on reload", () => {
      let html;

      beforeEach(() => {
        html = document.createElement("html");
        html.innerHTML = fs.readFileSync(
          path.resolve(__dirname, "./fixtures/categories.html"),
          "utf8",
        );
        document.body.appendChild(html);
      });

      test("hides read categories when they were hidden", () => {
        window.localStorage.setItem("gmail-toggle.hideRead", "true");
        startExtension(mockGmail);
        expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
          42,
        );
      });

      test("shows read categories when they were shown", () => {
        window.localStorage.setItem("gmail-toggle.hideRead", "false");
        startExtension(mockGmail);
        expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
          0,
        );
      });

      test("shows read categories when nothing was remembered", () => {
        startExtension(mockGmail);
        expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
          0,
        );
      });

      describe("when GMail renders labels later", () => {
        let label;
        let labelParent;

        beforeEach(() => {
          global.MutationObserver = RealMutationObserver;
          label = $(html)
            .find('.nU a[aria-label*="aws-cdk has menu"]')
            .closest(".aim");
          labelParent = label.parent();
          label.detach();
        });

        test("hides read labels that appear while hidden", async () => {
          window.localStorage.setItem("gmail-toggle.hideRead", "true");
          startExtension(mockGmail);
          labelParent.append(label);
          await flush();
          await flush();
          expect(label.find(".TN").css("display")).toEqual("none");
          expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
            42,
          );
        });

        test("shows a hidden label when unread labels appear below it", async () => {
          label.appendTo(labelParent);
          const rows = $(html).find(".aim").toArray();
          const parentIndex = rows.findIndex(
            (row) => $(row).find('a[aria-label^="_ Open Source"]').length,
          );
          const parentRow = $(rows[parentIndex]);
          const descendants = [];
          for (const row of rows.slice(parentIndex + 1)) {
            if (/margin-left:\s*0px/.test($(row).find(".TN").attr("style"))) {
              break;
            }
            descendants.push(row);
          }
          const placeholders = descendants.map((row) => {
            const placeholder = document.createComment("label");
            row.replaceWith(placeholder);
            return placeholder;
          });

          window.localStorage.setItem("gmail-toggle.hideRead", "true");
          startExtension(mockGmail);
          expect(parentRow.find(".TN").css("display")).toEqual("none");

          placeholders.forEach((placeholder, i) =>
            placeholder.replaceWith(descendants[i]),
          );
          await flush();
          expect(parentRow.find(".TN").css("display")).not.toEqual("none");
          expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
            42,
          );
        });

        test("leaves labels that appear while shown alone", async () => {
          window.localStorage.setItem("gmail-toggle.hideRead", "false");
          startExtension(mockGmail);
          labelParent.append(label);
          await flush();
          await flush();
          expect(label.find(".TN").css("display")).not.toEqual("none");
          expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
            0,
          );
        });
      });

      test("toggles back to showing read categories", () => {
        window.localStorage.setItem("gmail-toggle.hideRead", "true");
        startExtension(mockGmail);
        toggle();
        expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
          0,
        );
        expect(window.localStorage.getItem("gmail-toggle.hideRead")).toEqual(
          "false",
        );
      });
    });
  });
});
