import { startExtension, toggle } from "extension";
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
    const buttons = (root = document) => $(root).find(".gmail-toggle-button");

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
    });

    test("shows a closed envelope while read labels are hidden", () => {
      toggle();
      expect(buttons().find("img").attr("src")).toEqual(
        "icons/icon_closed_16.png",
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
