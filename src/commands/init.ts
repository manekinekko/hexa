import { isProjectFileExists, saveWorkspace, Config } from "../lib/utils";
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


  await (require(`./login`)());
  await (require(`./resource-group-selection`)());

  const { features } = await askForFeatures();
  const featuresConfiguration: any = {};

  for await (let feature of features) {
    console.log(`Configuring ${chalk.green(feature)}:`);
    try {
      const featureImplementation = require(`../features/${feature}/index`);
      const config = await featureImplementation();
      featuresConfiguration[feature] = config;
      Config.get(feature, config);
    } catch (error) {
      console.error(error.toString());
    }
  }

  saveWorkspace({
    project,
    ...featuresConfiguration
  });
};
