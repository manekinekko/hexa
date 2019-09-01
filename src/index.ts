#!/usr/bin/env node

import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import { saveProjectConfigToDisk, isProjectFileExists } from "./lib/files";
import {
  askForProjectDetails,
  askIfOverrideProjectFile,
  askForFeatures
} from "./lib/prompt";
import { Answers } from "inquirer";

const files = require("./lib/files");

clear();
console.log(
  chalk.red(figlet.textSync("NITRO", { horizontalLayout: "fitted" }))
);

(async () => {
  if (isProjectFileExists()) {
    const shouldOverrideConfigFile = await askIfOverrideProjectFile();
    if (shouldOverrideConfigFile.override === false) {
      process.exit(0);
    }
  }

  const project = await askForProjectDetails();
  const { features } = await askForFeatures();

  saveProjectConfigToDisk({
    project,
    features
  });
})();
