import fs from "fs";
import chalk from "chalk";
import { askForFeatures, askIfOverrideProjectFile } from "../core/prompt";
import { absolutePath, Config, deleteFile, isProjectFileExists, pluralize, FEATURES } from "../core/utils";
import dbg from "debug";
const debug = dbg("init");

export default async function (options?: HexaInitOptions) {
  const isForceModeEnabled = !!process.env.HEXA_FORCE_MODE;
  if (isForceModeEnabled) {
    debug(chalk.bold(chalk.yellow(`Warning: Flag --force has been set. Hexa won't ask for any confirmation!`)));
  }

  let selectedFeatures: string[] = [];
  const requetedServices = (options && options.requestedServices) || [];

  // if the user requested a subset of services, use that choice...
  if (requetedServices.length) {
    selectedFeatures = requetedServices.filter(feature => {
      const item = FEATURES.find(f => f.value === feature || f.value === feature) as typeof FEATURES[0];
      return item ? item.value : false;
    });
  } else {
    if (process.env.HEXA_YOLO_MODE) {
      console.log(chalk.yellow(`⭐ YOLO mode enabled. Go grab a coffee, we will take care of the rest!`));

      selectedFeatures = FEATURES.map(feat => feat.value);
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
    const { default: login } = await import('./login');
    return await login();

  } else {
    debug(`found subscriptions ${chalk.green(JSON.stringify(subscriptions))}`);
  }

  // check if there was a selected set of features, otherwise ask the user
  selectedFeatures = selectedFeatures.length ? selectedFeatures : ((await askForFeatures(FEATURES))).features as string[];

  let requiredFeatures = ["resource-group", "service-principal", "storage"];
  if (selectedFeatures.includes('swa')) {
    // Azure static web apps only requires a valid subscription and rg 
    requiredFeatures = ["resource-group"];
  }

  // we need to confiure a resource group and storage before creating all other features
  for await (let feature of [...requiredFeatures, ...selectedFeatures]) {
    debug(`Configuring ${chalk.green(feature)}:`);
    try {
      const { default: featureImplementation } = await import(`../features/${feature}/index`);
      await featureImplementation();
    } catch (error) {
      if (error.toString().includes(`Credentials have expired due to inactivity`)) {
        console.log(chalk.red(`✗ Credentials have expired due to inactivity. Please run 'hexa login'`));
        break;
      }
      else {
        console.log(chalk.red(`✗ ${error.stack || error}`));
        console.log(chalk.red(`✗ Abort.`));
      }
      if (!!process.env.HEXA_DRY_RUN) {
        process.exit(1);
      }
    }
  }

  if (process.env.HEXA_STORAGE_GENERATE_TOKEN) {
    console.log(`${chalk.green("✔")} Tokens saved to ${chalk.cyan(".env")}`);
  }

  const configFile = absolutePath("hexa.json");
  if (fs.existsSync(configFile)) {
    console.log(`${chalk.green("✔")} Configuration saved to ${chalk.cyan(configFile)}`);
  }

  return;
};
