import { az, Config, saveEnvFile } from "../../core/utils";
const debug = require("debug")("storage:token");

module.exports = async function() {
  const storage: AzureStorageToken = Config.get("storage");
  debug(`using storage ${JSON.stringify(storage)}`);

  const resourceGroup: AzureResourceGroup = Config.get("resourceGroup");
  debug(`using resource group ${JSON.stringify(resourceGroup)}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${JSON.stringify(subscription)}`);

  if (process.env.NITRO_STORAGE_USE_SAS) {
    // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-generate-sas
    const expiryYear = new Date().getFullYear() + 2;
    let sas = await az<string>(
      `storage account generate-sas --account-key 00000000 --account-name "${storage.name}" --expiry ${expiryYear}-01-01 --https-only --permissions acuw --resource-types sco --services b`,
      `Creating a SAS token...`
    );
    saveEnvFile("AZURE_STORAGE_SAS", sas);
    // Config.set("storage", {
    //   ...storage,
    //   sas
    // });
  } else {
    // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-show-connection-string
    let connectionString = await az<string>(
      `storage account show-connection-string --name "${storage.name}" --resource-group "${resourceGroup.name}" --subscription "${subscription.name}" --query 'connectionString'`,
      `Fetching a connection string...`
    );
    saveEnvFile("AZURE_STORAGE_CONNECTION_STRING", connectionString);
    // Config.set("storage", {
    //   ...storage,
    //   connectionString
    // });
  }
};
