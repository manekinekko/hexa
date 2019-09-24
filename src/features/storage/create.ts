import chalk from "chalk";
import { askForStorageAccountDetails } from "../../core/prompt";
import { az, Config, sanitize, saveWorkspace, uuid } from "../../core/utils";
const debug = require("debug")("storage:create");

module.exports = async function(creationMode: CreationMode) {
  // default values
  const projectName: string = Config.get("project");

  // Note: the storage account name must be globally unique!
  let name = sanitize(projectName) + uuid();
  debug(`using project ${name}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${JSON.stringify(subscription)}`);

  const resourceGroup: AzureResourceGroup = Config.get("resourceGroup");
  debug(`using resource group ${JSON.stringify(resourceGroup)}`);

  if (creationMode === "MANUAL") {
    let regionsList = await az<AzureRegion[]>(
      `account list-locations --query '[].{name:name, id:id, displayName:displayName}'`,
      `Loading your regions (this may take few minutes)...`
    );
    ({ name } = await askForStorageAccountDetails(regionsList, name));
  }

  let storage = await az<AzureStorage>(
    `storage account create --location "${resourceGroup.location}" --name "${name}" --subscription "${subscription.id}" --resource-group "${resourceGroup.name}" --tag x-created-by=nitro --query '{name:name, id:id, location:location}'`,
    `Creating storage account ${chalk.green(name)} (this may take few minutes)...`
  );

  Config.set("storage", storage);
  debug(`storage ${JSON.stringify(Config.get("storage"))}`);

  saveWorkspace({
    storage
  });

  return (await require("./tokens"))();
};
