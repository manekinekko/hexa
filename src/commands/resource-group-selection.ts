import { chooseResourceGroup } from "../lib/prompt";
import { az, Config, saveWorkspace } from "../lib/utils";

module.exports = async function() {
  let resourceGroupsList = await az<AzureResourceGroup[]>(
    `group list --query '[].{name:name, id:id, location:location}'`,
    `Loading your resource groups...`
  );

  if (resourceGroupsList.length) {
    let selectedResourceId = (await chooseResourceGroup(resourceGroupsList)).resourceGroup as string;

    if (selectedResourceId === "") {
      // create a new resource group
      return (await require(`./resource-group-create`))();
    } else {
      const { id, name, location } = resourceGroupsList.find(
        (resourceGroup: AzureResourceGroup) => resourceGroup.id === selectedResourceId
      ) as AzureResourceGroup;

      saveWorkspace({
        resourceGroup: {
          id,
          location,
          name
        }
      });
    }
  }
};
