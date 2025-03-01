import { startExtension, hideReadCategories } from "extension";

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
    let nodeUnread;
    let nodeRead;

    beforeEach(() => {
      nodeUnread = document.createElement("div");
      nodeUnread.innerHTML = `
<div class="aim ain">
    <div class="TO nZ aiq"
         data-tooltip="gmail-hide-read-categories"
         data-tooltip-align="r"
         id=":dp"
         jslog="36893; u014N:cOuCgd; 14:WzBd">
        <div class="TN aY7xie aik aHS-bnr" style="margin-left: 12px;">
            <div class="TH J-J5-Ji"></div>
            <div class="qj aEe qr"></div>
            <div class="aio aip">
                <span class="nU n1">
                    <a aria-label="gmail-hide-read-categories 3 unread has menu"
                       class="J-Ke n0"
                       draggable="false"
                       href="https://mail.google.com/mail/u/0/?ui=2#label/_+Open+Source/gmail-hide-read-categories"
                       tabindex="-1"
                       target="_top">
                        gmail-hide-read-categories
                    </a>
                </span>
                <div class="bsU">3</div>
            </div>
            <div class="nL aig">
                <div aria-haspopup="true"
                     aria-hidden="true"
                     class="pM aj0"
                     data-label-name="_ Open Source/gmail-hide-read-categories"
                     jsaction="ZElhof"
                     style="color: ; background-color:; border-color: "
                     tabindex="-1">
                    <div class="p6" style="background-color: ">
                        <div class="p8">▼</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
      `;

      document.body.appendChild(nodeUnread);

      nodeRead = document.createElement("div");
      nodeRead.innerHTML = `
<div class="aim ain">
    <div class="TO nZ aiq"
         data-tooltip="gli"
         data-tooltip-align="r"
         id=":do"
         jslog="36893; u014N:cOuCgd; 14:WzBd">
        <div class="TN aY7xie aik aHS-bnr" style="margin-left: 12px;">
            <div class="TH J-J5-Ji"></div>
            <div class="qj aEe qr"></div>
            <div class="aio aip">
                <span class="nU">
                    <a aria-label="gli has menu"
                       class="J-Ke n0"
                       draggable="false"
                       href="https://mail.google.com/mail/u/0/?ui=2#label/_+Open+Source/gli"
                       tabindex="-1"
                       target="_top">
                        gli
                    </a>
                </span>
            </div>
            <div class="nL aig">
                <div aria-haspopup="true"
                     aria-hidden="true"
                     class="pM aj0"
                     data-label-name="_ Open Source/gli"
                     jsaction="ZElhof"
                     style="color: ; background-color:; border-color: "
                     tabindex="-1">
                    <div class="p6" style="background-color: ">
                        <div class="p8">▼</div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
      `;
      document.body.appendChild(nodeRead);
    });

    test("hides read node", () => {
      let nodeReadBefore = nodeRead.outerHTML;
      let nodeUnreadBefore = nodeUnread.outerHTML;
      hideReadCategories();
      expect(nodeReadBefore).not.toEqual(nodeRead.outerHTML);
      const tnDiv = nodeRead.querySelector(".TN");
      expect(tnDiv.style["display"]).toEqual("none");
      expect(nodeUnreadBefore).toEqual(nodeUnread.outerHTML);
    });

    test("toggles read node", () => {
      let nodeReadBefore = nodeRead.outerHTML;
      let nodeUnreadBefore = nodeUnread.outerHTML;
      hideReadCategories();
      hideReadCategories();
      expect(nodeReadBefore).toEqual(nodeRead.outerHTML);
      expect(nodeUnreadBefore).toEqual(nodeUnread.outerHTML);
    });
  });
});
