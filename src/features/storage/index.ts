import chalk from "chalk";
import { chooseAccountStorage } from "../../core/prompt";
import { az, Config, saveWorkspace } from "../../core/utils";
const debug = require("debug")("storage");

module.exports = async function() {
  const subscription: AzureSubscription = Config.get("subscription");
  debug(`Using subscription ${chalk.green(subscription.name)}`);

  const resourceGroup: AzureResourceGroup = Config.get("resourceGroup");
  debug(`Using resource group ${chalk.green(resourceGroup.name)}`);

  // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-list
  let storageAccountsList = await az<AzureStorage[]>(
    `storage account list --resource-group "${resourceGroup.name}" --subscription "${subscription.id}" --query '[].{name:name, id:id, location:location, tags:tags}'`,
    `Checking storage accounts...`
  );

  // In case we dont find any storage account that had been created by Hexa,
  // fallback to either a MANUAL or AUTOMATIC creation, depending on the global config
  let creationMode = process.env.HEXA_AUTO_MODE ? "AUTOMATIC" : "MANUAL";
  let selectedStorageAccountId: string | null = null;

  if (creationMode === "AUTOMATIC") {
    if (storageAccountsList.length === 0) {
      return (await require(`./create`))("AUTOMATIC");
    } else if (storageAccountsList.length === 1) {
      const storageAccount = storageAccountsList[0];
      debug(`found one storage account ${chalk.green(storageAccount.name)}`);

      // had the account been created with Hexa?
      if (storageAccount && storageAccount.tags && storageAccount.tags["x-created-by"] === "hexa") {
        debug(`using storage account ${chalk.green(storageAccount.name)}`);

        // take its ID
        selectedStorageAccountId = storageAccount.id;
      } else {
        // we founf one storage account but it was not created by Hexa, go ahead and automatically create one
        return (await require(`./create`))("AUTOMATIC");
      }
    } else {
      // we found many storage accounts, let the user choose the right one
      selectedStorageAccountId = null;
    }
  }

  // if we still could not get the storage account, let the user choose
  if (selectedStorageAccountId === null) {
    selectedStorageAccountId = (await chooseAccountStorage(storageAccountsList)).storage as (string & CreationMode);
  }

  const { id, name } = storageAccountsList.find(
    (accountStorage: AzureStorage) => accountStorage.id === selectedStorageAccountId
  ) as AzureStorage;

  debug(`setting storage account ${chalk.green(name)}`);

  const storage = {
    id,
    name
  };

  Config.set("storage", storage);

  saveWorkspace({
    storage
  });

  return (await require("./tokens"))();
};
