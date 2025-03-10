"use strict";

const { merge } = require("webpack-merge");

const common = require("./webpack.common.js");
const PATHS = require("./paths");

// Merge webpack configuration files
const config = (env, argv) =>
  merge(common, {
    entry: {
      extension: PATHS.src + "/extension.js",
      gmailJsLoader: PATHS.src + "/gmailJsLoader.js",
    },
    devtool: argv.mode === "production" ? false : "source-map",
  });

module.exports = config;
