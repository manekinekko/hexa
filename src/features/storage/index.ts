import chalk from "chalk";
import { chooseAccountStorage } from "../../core/prompt";
import { az, Config, saveWorkspace, readWorkspace } from "../../core/utils";
import debug from "debug";
debug("storage");
import storageCreation from './create';

export default async function() {
  const subscription: AzureSubscription = Config.get("subscription");
  debug(`Using subscription ${chalk.green(subscription.name)}`);

  const {project} = readWorkspace();
  debug(`Using resource group ${chalk.green(project.name)}`);

  let storage: AzureStorage = {
    id: "" as any,
    name: "",
    location: ""
  };

  // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-list
  let storageAccountsList = await az<AzureStorage[]>(
    `storage account list --resource-group "${project.name}" --subscription "${subscription.id}" --query "[].{name:name, id:id, location:location, tags:tags}"`,
    `Checking storage for project ${chalk.cyan(project.name)}...`
  );

  debug(`storageAccountsList=${chalk.green(JSON.stringify(storageAccountsList))}`);

  // In case we dont find any storage account that had been created by Hexa,
  // fallback to either a MANUAL or AUTOMATIC creation, depending on the global config
  let creationMode: CreationMode = process.env.HEXA_AUTO_MODE ? "AUTOMATIC" : "MANUAL";

  if (Array.isArray(storageAccountsList) && storageAccountsList.length === 0) {
    // no storage account found, create one using the selected creation mode
    await storageCreation(creationMode);
    ({storage} = readWorkspace());
  } else if (Array.isArray(storageAccountsList) && storageAccountsList.length === 1) {
    const storageAccount = storageAccountsList[0];
    debug(`found one storage account ${chalk.green(storageAccount.name)}`);

    // has the account been created with Hexa?
    if (creationMode === "AUTOMATIC" && storageAccount?.tags?.["x-created-by"] === "hexa") {
      debug(`using storage account ${chalk.green(storageAccount.name)}`);

      // use this storage account
      storage = storageAccount;
    } else {
      // we are either in manual mode or we could not find a valid storage account
      // let the user choose
      // note: the user may wanna create a new storage account
      storage.id = (await chooseAccountStorage(storageAccountsList)).storage as (string & CreationMode);
      debug(`choosen storage account ${chalk.green(JSON.stringify(storage))}`);
    }
  } else if(Array.isArray(storageAccountsList)) {
    // we found many storage accounts, let the user choose the right one
    // note: the user may wanna create a new storage account
    storage.id = (await chooseAccountStorage(storageAccountsList)).storage as (string & CreationMode);
    debug(`choosen storage account ${chalk.green(JSON.stringify(storage))}`);
  }

  // the user choose to create a new storage account
  if (storage.id === "MANUAL") {
    await storageCreation(creationMode);
    ({storage} = readWorkspace());
  }

  // use previously selected storage account ID and get the right storage information from the accounts list
  storage = storageAccountsList.find((accountStorage: AzureStorage) => accountStorage.id === storage.id) as AzureStorage;

  debug(`setting storage account ${chalk.green(JSON.stringify(storage))}`);

  saveWorkspace({
    storage
  });

  const { default: tokens } = await import('./tokens');
  return await tokens();
};
