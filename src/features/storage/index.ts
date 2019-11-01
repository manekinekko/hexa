import chalk from "chalk";
import { chooseAccountStorage } from "../../core/prompt";
import { az, Config, saveWorkspace } from "../../core/utils";
const debug = require("debug")("storage");
const storageCreation = require(`./create`);

module.exports = async function() {
  const subscription: AzureSubscription = Config.get("subscription");
  debug(`Using subscription ${chalk.green(subscription.name)}`);

  const resourceGroup: AzureResourceGroup = Config.get("project");
  debug(`Using resource group ${chalk.green(resourceGroup.name)}`);

  let storage: AzureStorage = {
    id: "" as any,
    name: "",
    location: ""
  };

  // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-list
  let storageAccountsList = await az<AzureStorage[]>(
    `storage account list --resource-group "${resourceGroup.name}" --subscription "${subscription.id}" --query "[].{name:name, id:id, location:location, tags:tags}"`,
    `Checking storage for project ${chalk.cyan(resourceGroup.name)}...`
  );

  // In case we dont find any storage account that had been created by Hexa,
  // fallback to either a MANUAL or AUTOMATIC creation, depending on the global config
  let creationMode = process.env.HEXA_AUTO_MODE ? "AUTOMATIC" : "MANUAL";

  if (storageAccountsList.length === 0) {
    // no storage account found, create one using the selected creation mode
    await storageCreation(creationMode);
    storage = Config.get("storage") as AzureStorage;
  } else if (storageAccountsList.length === 1) {
    const storageAccount = storageAccountsList[0];
    debug(`found one storage account ${chalk.green(storageAccount.name)}`);

    // has the account been created with Hexa?
    if (creationMode === "AUTOMATIC" && storageAccount && storageAccount.tags && storageAccount.tags["x-created-by"] === "hexa") {
      debug(`using storage account ${chalk.green(storageAccount.name)}`);

      // use this storage account
      storage = storageAccount;
    } else {
      // we are either in manual mode or we could not find a valid storage account
      // let the user choose
      // note: the user may wanna create a new storage account
      storage.id = (await chooseAccountStorage(storageAccountsList)).storage as (string & CreationMode);
    }
  } else {
    // we found many storage accounts, let the user choose the right one
    // note: the user may wanna create a new storage account
    storage.id = (await chooseAccountStorage(storageAccountsList)).storage as (string & CreationMode);
  }

  // the user choose to create a new storage account
  if (storage.id === "MANUAL") {
    await storageCreation(creationMode);
    storage = Config.get("storage") as AzureStorage;
  }

  // const { id, name } = storageAccountsList.find((accountStorage: AzureStorage) => accountStorage.id === storage.id) as AzureStorage;

  debug(`setting storage account ${chalk.green(storage.name)}`);

  Config.set("storage", storage);

  saveWorkspace({
    storage
  });

  if (process.env.HEXA_STORAGE_GENERATE_TOKEN) {
    return (await require("./tokens"))();
  }
  return true;
};
