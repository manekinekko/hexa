import chalk from "chalk";
import { askForFeatures, askIfOverrideProjectFile } from "../core/prompt";
import { absolutePath, Config, deleteFile, isProjectFileExists, pluralize } from "../core/utils";
const debug = require("debug")("init");

module.exports = async function(options?: NitroInitOptions) {
  const isForceModeEnabled = !!process.env.HEXA_FORCE_MODE;
  if (isForceModeEnabled) {
    debug(chalk.bold(chalk.yellow(`Warning: Flag --force has been set. Hexa won't ask for any confirmation!`)));
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
    },
    {
      name: "Kubernetes: Configure a Kubernetes cluster (preview)",
      value: "kubernetes",
      short: "Kubernetes"
    }
  ];

  let selectedFeatures: any[] = [];
  const requetedServices = (options && options.requetedServices) || [];

  // if the user requested a subset of services, use that choice...
  if (requetedServices.length) {
    selectedFeatures = requetedServices.filter(feature => {
      const item = FEATURES.find(f => f.value === feature || f.short === feature) as typeof FEATURES[0];
      return item ? item.short : false;
    });
  } else {
    if (process.env.HEXA_YOLO_MODE) {
      console.log(chalk.yellow(`⭐ YOLO mode enabled. Go grab a coffee, we will take care of rest!`));

      selectedFeatures = FEATURES.map(feat => feat.short);
    }
  }

  if (requetedServices.length > 0 && selectedFeatures.length === 0) {
    console.log(chalk.red(`✗ The requested ${pluralize("service")} not valid: ${requetedServices}`));
    console.log(chalk.red(`✗ Abort.`));
    process.exit(1);
  }

  ///////

  if (isForceModeEnabled === false && isProjectFileExists()) {
    const shouldOverrideConfigFile = await askIfOverrideProjectFile();
    if (shouldOverrideConfigFile.override === false) {
      process.exit(0);
    } else {
      if (process.env.HEXA_RESET_MODE) {
        deleteFile("./hexa.json");
      }
    }
  }

  const subscriptions: AzureSubscription[] = Config.get("subscriptions");

  if (!subscriptions || (subscriptions && subscriptions.length === 0) || process.env.HEXA_FORCE_LOGIN) {
    await require(`./login`)();
  } else {
    debug(`found subscriptions ${chalk.green(JSON.stringify(subscriptions))}`);
  }

  // check if there was a selected set of features, otherwise ask the user
  selectedFeatures = selectedFeatures.length ? selectedFeatures : (await askForFeatures(FEATURES)).features;

  // we need to confiure a resource group and storage before creating all other features
  for await (let feature of ["resource-group", "service-principal", "storage", ...selectedFeatures]) {
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

  if (process.env.HEXA_STORAGE_GENERATE_TOKEN) {
    console.log(`${chalk.green("✔")} Tokens saved to ${chalk.cyan(".env")}`);
  }
  console.log(`${chalk.green("✔")} Configuration saved to ${chalk.cyan(absolutePath("hexa.json"))}`);
};
