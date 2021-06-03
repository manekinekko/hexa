import { Config, az, saveWorkspace, readWorkspace } from "../../core/utils";
import chalk from "chalk";
import { chooseAcrAccount } from "../../core/prompt";

import debug from "debug";
debug("container");

export default async function () {
  const subscription: AzureSubscription = Config.get("subscription");
  debug(`Using subscription ${chalk.green(subscription.name)}`);

  const workspace = readWorkspace();
  const resourceGroup: AzureResourceGroup = workspace.project;
  debug(`Using resource group ${chalk.green(resourceGroup.name)}`);

  // https://docs.microsoft.com/en-us/cli/azure/acr?view=azure-cli-latest#az-acr-list
  let acrList = await az<AzureContainerRegistry[]>(
    `acr list --resource-group "${resourceGroup.name}" --subscription "${subscription.id}" --query "[].{id:id, name:name, hostname:loginServer, tags:tags}"`,
    `Checking Container Registry for project ${chalk.cyan(resourceGroup.name)}...`
  );

  if (!Array.isArray(acrList)) {
    acrList = [];
  }

  let creationMode = process.env.HEXA_AUTO_MODE ? "AUTOMATIC" : "MANUAL";
  let selectedAcrId: string | null = null;

  if (acrList.length === 0) {
    // no ACR accout found, create one
    const { default: create } = await import('./create');
    return await create("AUTOMATIC");
  }

  if (creationMode === "AUTOMATIC") {
    if (Array.isArray(acrList) && acrList.length === 1) {
      const acr = acrList[0];
      debug(`found one container registry ${chalk.green(acr.name)}`);

      // had the ACR account been created with Hexa?
      if (acr && acr.tags && acr.tags["x-created-by"] === "hexa") {
        debug(`using container registry ${chalk.green(acr.name)}`);

        // take its ID
        selectedAcrId = acr.id;
      } else {
        // we founf one cluster but it was not created by Hexa, go ahead and automatically create one
        const { default: create } = await import('./create');
        return await create("AUTOMATIC");
      }
    } else if (Array.isArray(acrList)) {
      // we found many ACR accounts, let the user choose the right one
      selectedAcrId = (await chooseAcrAccount(acrList)).registry as (string & CreationMode);
    }
  } else if (Array.isArray(acrList)) {
    selectedAcrId = (await chooseAcrAccount(acrList)).registry as (string & CreationMode);
  }

  if (selectedAcrId === "MANUAL") {
    // the user expliticitly chooses to manually create a ACR account
    const { default: create } = await import('./create');
    return await create("MANUAL");
  }

  const { id, name, hostname } = acrList.find((acr: AzureContainerRegistry) => acr.id === selectedAcrId) as AzureContainerRegistry;

  debug(`using container registry ${chalk.green(name)}`);

  const servicePrincipal: AzureServicePrincipal = Config.get("servicePrincipal");
  debug(`using servicePrincipal ${chalk.green(servicePrincipal.name)}`);

  const existingAssignments = await az<AzureEntity[]>(`role assignment list --assignee "${servicePrincipal.appId}" --scope "${id}" --role "acrpull"`, `Checking roles for registry ${chalk.cyan(hostname)}...`);

  // if the exact same assignment already exists
  // skip the new assignment, otherwise this will trigger an error!
  if (existingAssignments.length === 0) {
    await az<AzureEntity>(`role assignment create --assignee "${servicePrincipal.appId}" --scope "${id}" --role "acrpull"`, `Applying roles for registry ${chalk.cyan(hostname)}...`);
  }

  const registry = {
    id,
    name,
    hostname
  };

  saveWorkspace({
    registry
  });
  return true;
};
