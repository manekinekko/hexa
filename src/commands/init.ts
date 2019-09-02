import chalk from "chalk";
import { askForFeatures, askForProjectDetails, askIfOverrideProjectFile } from "../core/prompt";
import { Config, isProjectFileExists, saveWorkspace } from "../core/utils";
const debug = require("debug")("nitro");

module.exports = async function() {
  if (isProjectFileExists()) {
    const shouldOverrideConfigFile = await askIfOverrideProjectFile();
    if (shouldOverrideConfigFile.override === false) {
      process.exit(0);
    }
  }

  const project = await askForProjectDetails();
  const subscriptions: AzureSubscription[] = Config.get("subscriptions");

  if (subscriptions.length === 0 || process.env.NITRO_FORCE_LOGIN) {
    await require(`./login`)();
  }
  else {
    debug(`found previous subscriptions`);
  }

  const { features } = await askForFeatures();
  const featuresConfiguration: any = {};

  for await (let feature of ["resource-group", ...features]) {
    debug(`Configuring ${chalk.green(feature)}:`);
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
