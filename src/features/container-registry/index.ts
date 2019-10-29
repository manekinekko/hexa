import { Config, az, saveWorkspace } from "../../core/utils";
import chalk from "chalk";
import { chooseAcrAccount } from "../../core/prompt";

const debug = require("debug")("container");

module.exports = async function() {
  const subscription: AzureSubscription = Config.get("subscription");
  debug(`Using subscription ${chalk.green(subscription.name)}`);

  const resourceGroup: AzureResourceGroup = Config.get("project");
  debug(`Using resource group ${chalk.green(resourceGroup.name)}`);

  // https://docs.microsoft.com/en-us/cli/azure/acr?view=azure-cli-latest#az-acr-list
  const acrList = await az<AzureContainerRegistry[]>(
    `acr list --resource-group "${resourceGroup.name}" --subscription "${subscription.id}" --query "[].{id:id, name:name, hostname:loginServer, tags:tags}"`,
    `Checking container registry for project ${chalk.cyan(resourceGroup.name)}`
  );

  let creationMode = process.env.HEXA_AUTO_MODE ? "AUTOMATIC" : "MANUAL";
  let selectedAcrId: string | null = null;

  if (acrList.length === 0) {
    // no ACR accout found, create one
    return await require(`./create`)("AUTOMATIC");
  }

  if (creationMode === "AUTOMATIC") {
    if (acrList.length === 1) {
      const acr = acrList[0];
      debug(`found one container registry ${chalk.green(acr.name)}`);

      // had the ACR account been created with Hexa?
      if (acr && acr.tags && acr.tags["x-created-by"] === "hexa") {
        debug(`using container registry ${chalk.green(acr.name)}`);

        // take its ID
        selectedAcrId = acr.id;
      } else {
        // we founf one cluster but it was not created by Hexa, go ahead and automatically create one
        return (await require(`./create`))("AUTOMATIC");
      }
    } else {
      // we found many ACR accounts, let the user choose the right one
      selectedAcrId = (await chooseAcrAccount(acrList)).registry as (string & CreationMode);
    }
  } else {
    selectedAcrId = (await chooseAcrAccount(acrList)).registry as (string & CreationMode);
  }

  if (selectedAcrId === "MANUAL") {
    // the user expliticitly chooses to manually create a ACR account
    return (await require(`./create`))("MANUAL");
  }

  const { id, name, hostname } = acrList.find((acr: AzureContainerRegistry) => acr.id === selectedAcrId) as AzureContainerRegistry;

  debug(`using container registry ${chalk.green(name)}`);

  const servicePrincipal: AzureServicePrincipal = Config.get("servicePrincipal");
  debug(`using servicePrincipal ${chalk.green(servicePrincipal.name)}`);

  await az<AzureEntity>(`role assignment create --assignee "${servicePrincipal.appId}" --scope "${id}" --role owner`, `Checking roles for registry ${chalk.cyan(hostname)}...`);

  const registry = {
    id,
    name,
    hostname
  };
  Config.set("registry", registry);

  saveWorkspace({
    registry
  });
  return true;
};
