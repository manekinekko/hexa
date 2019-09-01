import chalk from "chalk";
import { askForResourceGroupDetails } from "../../core/prompt";
import { az, Config, saveWorkspace } from "../../core/utils";

module.exports = async function() {
  let regionsList = await az<AzureRegion[]>(
    `account list-locations --query '[].{name:name, id:id, displayName:displayName}'`,
    `Loading Azure regions (this may take few minutes)...`
  );

  const { name, region } = await askForResourceGroupDetails(regionsList);

  let resourceGroup = await az<AzureResourceGroup>(
    `group create -l ${region} -n ${name} --tag cli=nitro --query '[].{name:name, id:id, location:location}'`,
    `Creating resource group: ${chalk.green(name)}`
  );

  console.log(resourceGroup);
  

  Config.set("resourceGroup", resourceGroup);

  saveWorkspace({
    resourceGroup
  });
};
