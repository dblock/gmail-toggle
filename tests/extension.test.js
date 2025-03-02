import { startExtension, hideReadCategories } from "extension";
import fs from "fs";
import path from "path";
import $ from "jquery";

describe("Extension", () => {
  describe("#startExtension", () => {
    let mockGmail;
    let extensionButton;
    let extensionObserver;

    beforeEach(() => {
      global.chrome = {
        runtime: {
          getURL: jest.fn(),
        },
      };

      extensionButton = document.createElement("div");

      mockGmail = {
        tools: {
          add_toolbar_button: jest.fn(() => {
            return {
              get: jest.fn(() => extensionButton), // Return a mock Node
            };
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
  });

  describe("#hideReadCategories", () => {
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
      expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(0);
      expect($(html).find(".nU").length).toEqual(59);
      expect($(html).find(".n1").length).toEqual(9);
    });

    describe("clicked once", () => {
      beforeEach(() => {
        hideReadCategories();
      });

      test("hides read categories", () => {
        expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
          42,
        );
      });

      test("keeps an unread parent nodes", () => {
        let openSourceNode = $(
          $(html).find(
            '.nU a[aria-label*="_ Open Source expanded has menu"]',
          )[0],
        )
          .parent()
          .parent()
          .parent();
        expect(openSourceNode.css("display")).toEqual("block");
      });

      test("hides an unread leaf node", () => {
        let awsCdkNode = $(
          $(html).find('.nU a[aria-label*="aws-cdk has menu"]')[0],
        )
          .parent()
          .parent()
          .parent();
        expect(awsCdkNode.css("display")).toEqual("none");
      });

      describe("toggled", () => {
        beforeEach(() => {
          hideReadCategories();
        });

        test("toggles read node back", () => {
          expect($(html).find(".TN").length).toEqual(59);
          expect($($(html).find('.TN[style*="display: none"]')).length).toEqual(
            0,
          );
        });
      });
    });
  });
});
