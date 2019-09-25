import inquirer = require("inquirer");
import chalk from "chalk";
import { askForHostingFolder } from "../../core/prompt";
import { az, Config, copyTemplate, saveWorkspace } from "../../core/utils";
const debug = require("debug")("hosting");

module.exports = async function() {
  let { folder, overrideHtml, override404, overrideError } = await askForHostingFolder();
  debug(
    `selected hosting folder=${folder}, overrideHtml=${overrideHtml}, override404=${override404}. overrideError=${overrideError}`
  );

  if (overrideHtml || typeof overrideHtml === "undefined") {
    // copy index.html
    copyTemplate(`init/index.html`, `${folder}/index.html`);
  }
  if (override404 || typeof override404 === "undefined") {
    // copy 404.html
    copyTemplate(`init/404.html`, `${folder}/404.html`);
  }
  if (overrideError || typeof overrideError === "undefined") {
    // copy errro.html
    copyTemplate(`init/error.html`, `${folder}/error.html`);
  }

  const storage: AzureStorage = Config.get("storage");
  debug(`using storage ${chalk.green(JSON.stringify(storage))}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${chalk.green(JSON.stringify(subscription))}`);

  // https://docs.microsoft.com/en-us/cli/azure/storage/blob/service-properties?view=azure-cli-latest#az-storage-blob-service-properties-update
  await az<string>(
    `storage blob service-properties update --account-name "${storage.name}" --static-website --404-document 404.html --index-document index.html --query '{staticWebsite: staticWebsite}'`,
    `Enabling hosting service...`
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
