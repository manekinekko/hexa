import inquirer = require("inquirer");
import chalk from "chalk";
import { askForHostingFolder } from "../../core/prompt";
import { az, Config, copyTemplate, saveWorkspace, createDirectoryIfNotExists, readWorkspace } from "../../core/utils";
const debug = require("debug")("hosting");

module.exports = async function() {
  const isForceModeEnabled = !!process.env.HEXA_FORCE_MODE;

  let defaultPublicFolder = "./dist";

  // default values
  let [folder, overrideHtml, override404, overrideError] = [defaultPublicFolder, false, false, false];

  if (isForceModeEnabled) {
    // when the Force mode is enabled, use all defaults
    [folder, overrideHtml, override404, overrideError] = [defaultPublicFolder, true, true, true];
  } else {
    // when either manual or automatic mode are enabled, ask the user for all the details
    ({ folder = defaultPublicFolder, overrideHtml, override404, overrideError } = await askForHostingFolder(defaultPublicFolder));
    debug(`selected hosting folder=${folder}, overrideHtml=${overrideHtml}, override404=${override404}. overrideError=${overrideError}`);
  }

  createDirectoryIfNotExists(defaultPublicFolder);

  if (overrideHtml || typeof overrideHtml === "undefined") {
    // copy index.html
    copyTemplate(`init/hosting/index.html.tpl`, `${folder}/index.html`);
  }
  if (override404 || typeof override404 === "undefined") {
    // copy 404.html
    copyTemplate(`init/hosting/404.html.tpl`, `${folder}/404.html`);
  }
  if (overrideError || typeof overrideError === "undefined") {
    // copy errro.html
    copyTemplate(`init/hosting/error.html.tpl`, `${folder}/error.html`);
  }

  const { storage } = readWorkspace();
  debug(`using storage ${chalk.green(storage.name)}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${chalk.green(subscription.name)}`);

  // https://docs.microsoft.com/en-us/cli/azure/storage/blob/service-properties?view=azure-cli-latest#az-storage-blob-service-properties-update
  await az<string>(
    `storage blob service-properties update --account-name "${storage.name}" --static-website --404-document 404.html --index-document index.html --query "{staticWebsite: staticWebsite}"`,
    `Enabling hosting for storage account ${chalk.cyan(storage.name)}...`
  );

  // TODO: enable CORS
  // https://docs.microsoft.com/en-us/cli/azure/storage/cors?view=azure-cli-latest#az-storage-cors-clear
  // await az(`storage cors clear --services "b" --account-name "${storage.name}" --subscription "${subscription.id}"`);
  // https://docs.microsoft.com/en-us/cli/azure/storage/cors?view=azure-cli-latest#az-storage-cors-add
  //   await az(
  //     `storage cors add --methods GET HEAD MERGE OPTIONS POST PUT --origins "*" --services "b" --account-name "${storage.name}" --subscription "${subscription.id}" --max-age 3600`,
  //     `Enabling CORS...`
  // );

  saveWorkspace({
    hosting: {
      folder
    }
  });
};
