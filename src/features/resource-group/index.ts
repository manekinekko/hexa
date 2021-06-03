import { chooseResourceGroup } from "../../core/prompt";
import { az, saveWorkspace } from "../../core/utils";

export default async function () {
  if (process.env.HEXA_AUTO_MODE) {
    const { default: create } = await import('./create');
    return await create('AUTOMATIC');
  }

  // https://docs.microsoft.com/en-us/cli/azure/group?view=azure-cli-latest#az-group-list
  let resourceGroupsList = await az<AzureResourceGroup[]>(
    `group list --query "[].{name:name, id:id, location:location, tags:tags}"`,
    `Loading resource groups...`
  );

  if (resourceGroupsList.length) {
    let selectedResourceId = (await chooseResourceGroup(resourceGroupsList)).resourceGroup as (string & CreationMode);

    if (selectedResourceId === "MANUAL") {
      // create a new resource group
      const { default: create } = await import('./create');
      return await create(selectedResourceId);
    } else {
      const { id, name, location } = resourceGroupsList.find(
        (resourceGroup: AzureResourceGroup) => resourceGroup.id === (selectedResourceId as string)
      ) as AzureResourceGroup;

      const project = {
        id,
        location,
        name
      };

      saveWorkspace({
        project
      });
    }
  } else {
    // no resource found
    // create a new resource group
    const { default: create } = await import('./create');
    return await create("AUTOMATIC");
  }
};
