import chalk from "chalk";
import { askForStorageAccountDetails } from "../../core/prompt";
import { az, Config, sanitize, saveWorkspace, uuid, readWorkspace } from "../../core/utils";
const debug = require("debug")("storage:create");

module.exports = async function(creationMode: CreationMode) {
  const {project} = readWorkspace();

  // Note: the storage account name must be globally unique!
  let name = sanitize(project.name) + uuid();
  debug(`using project ${name}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${chalk.green(subscription.name)}`);

  if (creationMode === "MANUAL") {
    let regionsList = await az<AzureRegion[]>(
      `account list-locations --query "[].{name:name, id:id, displayName:displayName}"`,
      `Loading available regions (this may take few minutes)...`
    );
    ({ name } = await askForStorageAccountDetails(regionsList, name));
  }

  // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-create
  // --kind StorageV2 is required for static websites
  let storage = await az<AzureStorage>(
    `storage account create --location "${project.location}" --name "${name}" --subscription "${subscription.id}" --resource-group "${project.name}" --kind StorageV2 --tag "x-created-by=hexa" --query "{name:name, id:id, location:location}"`,
    `Creating storage account ${chalk.cyan(name)} (this may take few minutes)...`
  );

  Config.set("storage", storage);
  debug(`storage ${JSON.stringify(Config.get("storage"))}`);

  saveWorkspace({
    storage
  });

  return (await require("./tokens"))();
};
