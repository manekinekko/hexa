import { chooseAccountStorage } from "../../core/prompt";
import { az, Config, saveWorkspace } from "../../core/utils";
const debug = require("debug")("storage");

module.exports = async function() {
  const subscription: AzureSubscription = Config.get("subscription");
  debug(`Using subscription ${JSON.stringify(subscription)}`);
  
  const resourceGroup: AzureResourceGroup = Config.get("resourceGroup");
  debug(`Using resource group ${JSON.stringify(resourceGroup)}`);

  // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-list
  let storageAccountsList = await az<AzureStorage[]>(
    `storage account list --resource-group "${resourceGroup.name}" --subscription "${subscription.id}" --query '[].{name:name, id:id, location:location}'`,
    `Loading storage accounts...`
  );

  if (storageAccountsList.length) {
    let selectedStorageAccountId = (await chooseAccountStorage(storageAccountsList)).storage as (string & CreationMode);

    if (selectedStorageAccountId === "MANUAL" || selectedStorageAccountId === "AUTOMATIC") {
      // create a new storage account
      // and get back here to generate a token
      (await require(`./create`))(selectedStorageAccountId);
    } else {
      const { id, name } = storageAccountsList.find(
        (accountStorage: AzureStorage) => accountStorage.id === selectedStorageAccountId
      ) as AzureStorage;

      const storage = {
        id,
        name
      };
      
      Config.set("storage", storage);

      saveWorkspace({
        storage
      });
    }
  } else {
    // no storage account found
    // create a new one
    // and get back here to generate a token
    (await require(`./create`))("AUTOMATIC");
  }

  return (await require("./tokens"))();
};
