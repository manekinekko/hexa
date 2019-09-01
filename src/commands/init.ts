import { isProjectFileExists, saveProjectConfigToDisk } from "../lib/utils";
import {
  askIfOverrideProjectFile,
  askForProjectDetails,
  askForFeatures
} from "../lib/prompt";
import chalk from "chalk";

module.exports = async function() {
  if (isProjectFileExists()) {
    const shouldOverrideConfigFile = await askIfOverrideProjectFile();
    if (shouldOverrideConfigFile.override === false) {
      process.exit(0);
    }
  }

  const project = await askForProjectDetails();
  const { features } = await askForFeatures();
  const featuresConfiguration: any = {};

  for await (let feature of features) {
    console.log(`Configuring ${chalk.green(feature)}:`);
    try {
      const featureImplementation = require(`./lib/features/${feature}/index`);
      const config = await featureImplementation();
      featuresConfiguration[feature] = config;
    } catch (error) {
      console.error(error.toString());
    }
  }

  saveProjectConfigToDisk({
    project,
    ...featuresConfiguration
  });
};
