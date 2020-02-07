import { az, Config, saveEnvFile, saveWorkspace, readWorkspace } from "../../core/utils";
import chalk from "chalk";
const debug = require("debug")("storage:token");

module.exports = async function() {
  const { storage } = readWorkspace();
  debug(`using storage ${chalk.green(storage.name)}`);

  const { project } = readWorkspace();
  debug(`using resource group ${chalk.green(project.name)}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${chalk.green(subscription.name)}`);

  if (process.env.HEXA_STORAGE_USE_SAS) {
    // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-generate-sas
    const expiryYear = new Date().getFullYear() + 2;
    let sas = await az<HexaMessageResponse>(
      `storage account generate-sas --account-key 00000000 --account-name "${storage.name}" --expiry ${expiryYear}-01-01 --https-only --permissions acuw --resource-types sco --services b`,
      `Creating a SAS token...`,
      `tsv`
    );
    debug(`got SAS key ${chalk.green(JSON.stringify(sas))}`);

    saveEnvFile("AZURE_STORAGE_SAS", sas.message);
    debug(`saved AZURE_STORAGE_SAS key to ${chalk.green(".env")}`);
  } else {
    // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-show-connection-string
    let connectionString = await az<HexaMessageResponse>(
      `storage account show-connection-string --name "${storage.name}" --resource-group "${project.name}" --subscription "${subscription.name}" --query "connectionString"`,
      `Fetching a connection string for storage account ${chalk.cyan(storage.name)}...`,
      `tsv`
    );
    debug(`got ConnectionString key ${chalk.green(JSON.stringify(connectionString))}`);

    saveEnvFile("AZURE_STORAGE_CONNECTION_STRING", connectionString.message);
    debug(`saved AZURE_STORAGE_CONNECTION_STRING key to ${chalk.green(".env")}`);
  }

  return true;
};
