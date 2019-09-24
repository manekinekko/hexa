import inquirer = require("inquirer");
import { askForHostingFolder } from "../../core/prompt";
import { az, Config, copyTemplate, saveWorkspace } from "../../core/utils";
import chalk from "chalk";
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
    // copy 404.html
    copyTemplate(`init/error.html`, `${folder}/error.html`);
  }

  const storage: AzureStorage = Config.get("storage");
  debug(`using storage ${chalk.green(JSON.stringify(storage))}`);

  await az(
    `storage blob service-properties update --account-name ${storage.name} --static-website --404-document 404.html --index-document index.html`
  );

  saveWorkspace({
    hosting: {
      public: folder
    }
  });
};
