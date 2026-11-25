import {
  IntrideaChangelog,
  ReleaseWorkflow,
  ZipArchive,
} from "npm-package-release";

export default new ReleaseWorkflow({
  changelog: new IntrideaChangelog("CHANGELOG.md", {
    placeholder: "* Your contribution here.",
  }),
  project: new ZipArchive({
    build: ["npm", "run", "build"],
    directory: "build",
    name: "gmail-toggle",
  }),
  publisher: null,
  versionReferences: {
    "public/manifest.json": [/"version": "(?<version>\d+\.\d+\.\d+)"/u],
  },
});
