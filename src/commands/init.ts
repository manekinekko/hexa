import chalk from "chalk";
import { askForFeatures, askForProjectDetails, askIfOverrideProjectFile } from "../core/prompt";
import { Config, isProjectFileExists, saveWorkspace, getCurrentDirectoryBase } from "../core/utils";
const debug = require("debug")("init");

module.exports = async function() {
  const isForceModeEnabled = !!process.env.HEXA_FORCE_MODE;
  if (isForceModeEnabled) {
    debug(chalk.bold(chalk.yellow(`Warning: Flag --force has been set. Hexa won't ask for any confirmation!`)));
  }

  if (isForceModeEnabled === false && isProjectFileExists()) {
    const shouldOverrideConfigFile = await askIfOverrideProjectFile();
    if (shouldOverrideConfigFile.override === false) {
      process.exit(0);
    }
  }

  let name = getCurrentDirectoryBase();
  if (isForceModeEnabled === false) {
    ({ name } = await askForProjectDetails(name));
  }
  debug(`saving project name ${name}`);

  saveWorkspace({
    project: name
  });

  Config.set("project", name);
  const subscriptions: AzureSubscription[] = Config.get("subscriptions");

  if (!subscriptions || (subscriptions && subscriptions.length === 0) || process.env.NITRO_FORCE_LOGIN) {
    await require(`./login`)();
  } else {
    debug(`found previous subscriptions ${JSON.stringify(subscriptions)}`);
  }

  const FEATURES = [
    {
      name: "Hosting: Configure and deploy to Azure Static Website",
      value: "hosting",
      short: "Hosting"
    },
    {
      name: "Functions: Configure and deploy an Azure Functions",
      value: "functions",
      short: "Functions"
    },
    {
      name: "Database: Configure and deploy a database on Azure",
      value: "database",
      short: "Database"
    }
  ];

  let selectedFeatures = [];
  if (process.env.HEXA_YOLO_MODE) {

    console.log(chalk.yellow(`⭐ YOLO mode enabled. Go grab a coffee, we will take care of rest!`))

    selectedFeatures = FEATURES.map(feat => feat.short);
  } else {
    selectedFeatures = (await askForFeatures(FEATURES)).features;
  }

  // we need to confiure a resource group and storage before creating all other features
  for await (let feature of ["resource-group", "storage", ...selectedFeatures]) {
    debug(`Configuring ${chalk.green(feature)}:`);
    try {
      const featureImplementation = require(`../features/${feature}/index`);
      await featureImplementation();
    } catch (error) {
      console.log(chalk.red(`✗ ${error}`));
      console.log(chalk.red(`✗ Abort.`));
      process.exit(1);
    }
  }

  console.log(`${chalk.green("✔")} Configuration saved to ${chalk.cyan("hexa.json")}`);
  console.log(`${chalk.green("✔")} Tokens saved to ${chalk.cyan(".env")}`);
};
