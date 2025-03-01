"use strict";

const GmailFactory = require("gmail-js");
import $ from "jquery";

if ("trustedTypes" in window) {
  const trustedHTMLpolicy = trustedTypes.createPolicy("default", {
    createHTML: (to_escape) => to_escape,
  });

  $.extend({
    htmlPrefilter: trustedHTMLpolicy.createHTML,
  });
}

window._gmailjs = window._gmailjs || new GmailFactory.Gmail($);
