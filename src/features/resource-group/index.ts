import { chooseResourceGroup } from "../../core/prompt";
import { az, Config, saveWorkspace } from "../../core/utils";

module.exports = async function() {
  let resourceGroupsList = await az<AzureResourceGroup[]>(
    `group list --query '[].{name:name, id:id, location:location}'`,
    `Loading resource groups...`
  );

  if (resourceGroupsList.length) {
    let selectedResourceId = (await chooseResourceGroup(resourceGroupsList)).resourceGroup as string;

    if (selectedResourceId === "") {
      // create a new resource group
      return (await require(`./create`))();
    } else {
      const { id, name, location } = resourceGroupsList.find(
        (resourceGroup: AzureResourceGroup) => resourceGroup.id === selectedResourceId
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
  }
};
