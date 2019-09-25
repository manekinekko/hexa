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
    `storage account list --resource-group "${resourceGroup.name}" --subscription "${subscription.id}" --query '[].{name:name, id:id, location:location, tags:tags}'`,
    `Checking storage accounts...`
  );

  if (storageAccountsList.length) {
    let selectedStorageAccountId = "";

    // if there is only 1 storage account that had been created with Hexa,
    // go ahead and use it.
    if (storageAccountsList.length === 1) {
      const storageAccount = storageAccountsList[0];
      if (storageAccount.tags && storageAccount.tags["x-created-by"] === "hexa") {
        selectedStorageAccountId = storageAccountsList[0].id;
      }
    } else {
      // move storage accounts created with Hexa to the top
      storageAccountsList = storageAccountsList.sort((a, b) => (a.tags && a.tags["x-created-by"] === "hexa" ? -1 : 1));
      selectedStorageAccountId = (await chooseAccountStorage(storageAccountsList)).storage as (string & CreationMode);
    }

    if (selectedStorageAccountId === "MANUAL") {
      // create a new storage account
      return (await require(`./create`))(selectedStorageAccountId);
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

      return (await require("./tokens"))();
    }
  } else {
    // no storage account found
    // create a new one
    return (await require(`./create`))("AUTOMATIC");
  }
};
