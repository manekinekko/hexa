import chalk from "chalk";
import { askForResourceGroupDetails } from "../../core/prompt";
import { az, Config, sanitize, saveWorkspace } from "../../core/utils";

module.exports = async function(creationMode: CreationMode) {
  // default values
  const projectName = Config.get("project");
  let name = sanitize(projectName);
  let region = "westeurope";

  if (creationMode === "MANUAL") {
    // https://docs.microsoft.com/en-us/cli/azure/account?view=azure-cli-latest#az-account-list-locations
    let regionsList = await az<AzureRegion[]>(
      `account list-locations --query '[].{name:name, id:id, displayName:displayName}'`,
      `Loading Azure regions (this may take few minutes)...`
    );
    ({ name, region } = await askForResourceGroupDetails(regionsList, name, region));
  }

  // https://docs.microsoft.com/en-us/cli/azure/group?view=azure-cli-latest#az-group-create
  let resourceGroup = await az<AzureResourceGroup>(
    `group create -l ${region} -n ${name} --tag 'x-created-by=hexa' --query '{name:name, id:id, location:location}'`,
    `Setting resource group ${chalk.green(name)}`
  );

  Config.set("resourceGroup", resourceGroup);

  saveWorkspace({
    resourceGroup
  });
};
