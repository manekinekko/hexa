import { az, saveWorkspace, Config } from "../../lib/utils";
import { askForStorageAccountDetails } from "../../lib/prompt";
import chalk from "chalk";

module.exports = async function() {
  let regionsList = await az<AzureRegion[]>(
    `account list-locations --query '[].{name:name, id:id, displayName:displayName}'`,
    `Loading your regions (this may take few minutes)...`
  );

  const { name } = await askForStorageAccountDetails(regionsList);
  const subscription: AzureSubscription = Config.get("subscription");
  const resourceGroup: AzureResourceGroup = Config.get("resourceGroup");

  let storage = await az<AzureStorage>(
    `storage account create -l "${resourceGroup.location}" -n "${name}" -s "${subscription.id}" -g "${resourceGroup.id}" --tag cli=nitro --query '[].{name:name, id:id, location:location}'`,
    `Creating storage account: ${chalk.green(name)}`
  );

  console.log(storage);
  

  saveWorkspace({
    storage
  });
};
