import { chooseResourceGroup } from "../../core/prompt";
import { az, Config, saveWorkspace } from "../../core/utils";

module.exports = async function() {

  if (process.env.HEXA_AUTO_MODE) {
    return (await require(`./create`))("AUTOMATIC");
  }
  

  // https://docs.microsoft.com/en-us/cli/azure/group?view=azure-cli-latest#az-group-list
  let resourceGroupsList = await az<AzureResourceGroup[]>(
    `group list --query '[].{name:name, id:id, location:location, tags:tags}'`,
    `Loading resource groups...`
  );

  if (resourceGroupsList.length) {
    // move resource groups created with Hexa to the top
    resourceGroupsList = resourceGroupsList.sort((a, b) => (a.tags && a.tags["x-created-by"] === "hexa" ? -1 : 1));

    let selectedResourceId = (await chooseResourceGroup(resourceGroupsList)).resourceGroup as (string & CreationMode);

    if (selectedResourceId === "MANUAL") {
      // create a new resource group
      return (await require(`./create`))(selectedResourceId);
    } else {
      const { id, name, location } = resourceGroupsList.find(
        (resourceGroup: AzureResourceGroup) => resourceGroup.id === (selectedResourceId as string)
      ) as AzureResourceGroup;

      const resourceGroup = {
        id,
        location,
        name
      };

      Config.set("resourceGroup", resourceGroup);

      saveWorkspace({
        resourceGroup
      });
    }
  } else {
    // no resource found
    // create a new resource group
    return (await require(`./create`))("AUTOMATIC");
  }
};
