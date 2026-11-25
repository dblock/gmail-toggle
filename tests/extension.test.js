import { startExtension, toggle } from "extension";
import fs from "fs";
import path from "path";
import $ from "jquery";

const RealMutationObserver = global.MutationObserver;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

describe("Extension", () => {
  describe("#startExtension", () => {
    let mockGmail;
    let extensionButton;
    let extensionButtonContainer;
    let extensionObserver;

    beforeEach(() => {
      window.localStorage.clear();
      document.body.innerHTML = "";

      global.chrome = {
        runtime: {
          getURL: jest.fn(),
        },
      };

      extensionButtonContainer = {
        get: jest.fn(() => extensionButton),
        attr: jest.fn(() => {}),
      };

      extensionButton = document.createElement("div");

      mockGmail = {
        tools: {
          add_toolbar_button: jest.fn(() => {
            return extensionButtonContainer;
          }),
        },
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

    test("adds a toolbar button", () => {
      expect(mockGmail.tools.add_toolbar_button).toHaveBeenCalled();
    });

    test("adds a tooltip", () => {
      expect(extensionButtonContainer.attr).toHaveBeenCalledWith(
        "data-tooltip",
        "Toggle Read/Unread",
      );
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
      expect(extensionObserver.observe).toHaveBeenCalledWith(extensionButton, {
        attributeFilter: ["style"],
        attributes: true,
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
