import { askForResourceGroupDetails } from "../lib/prompt";
import { az, saveWorkspace } from "../lib/utils";

module.exports = async function() {
  let regionsList = await az<AzureRegion[]>(
    `account list-locations --query '[].{name:name, id:id, displayName:displayName}'`,
    `Loading your regions (this may take few minutes)...`
  );

  const { resource, region } = await askForResourceGroupDetails(regionsList);

  let resourceGroup = await az<AzureResourceGroup>(
    `group create -l ${region} -n ${resource} --tag cli=nitro --query '[].{name:name, id:id, location:location}'`,
    `Creating your resource group...`
  );

  console.log("asdasdsdasdasd");

  saveWorkspace({
    resourceGroup
  });
};
