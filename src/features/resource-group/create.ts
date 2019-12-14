import chalk from "chalk";
import { askForResourceGroupDetails, askForProjectDetails } from "../../core/prompt";
import { az, Config, sanitize, saveWorkspace, getCurrentDirectoryBase } from "../../core/utils";
const debug = require("debug")("project");

module.exports = async function(creationMode: CreationMode) {
  const isForceModeEnabled = !!process.env.HEXA_FORCE_MODE;

  let name = sanitize(getCurrentDirectoryBase());
  if (isForceModeEnabled === false) {
    ({ name } = await askForProjectDetails(name));
  }

  debug(`saving project ${name}`);

  let region = "westeurope";
  let isProjectExists = {message: "false"};
  let project: AzureResourceGroup;

  if (creationMode === "MANUAL") {
    // https://docs.microsoft.com/en-us/cli/azure/account?view=azure-cli-latest#az-account-list-locations
    let regionsList = await az<AzureRegion[]>(`account list-locations --query "[].{name:name, id:id, displayName:displayName}"`, `Loading regions (this may take few minutes)...`);
    ({ name, region } = await askForResourceGroupDetails(regionsList, name, region));
  } else {
    isProjectExists = await az(`group exists --name ${name}`, `Checking for existing project ${chalk.cyan(name)}...`);
  }

  debug(`isProjectExists=${chalk.green(JSON.stringify(isProjectExists))}`);

  if (isProjectExists?.message.includes("true")) {
    // https://docs.microsoft.com/en-us/cli/azure/group?view=azure-cli-latest#az-group-show
    project = await az<AzureResourceGroup>(`group show -n ${name} --query "{name:name, id:id, location:location}"`, `Bootstrapping project ${chalk.cyan(name)}...`);
  } else {
    // https://docs.microsoft.com/en-us/cli/azure/group?view=azure-cli-latest#az-group-create
    project = await az<AzureResourceGroup>(
      `group create -l ${region} -n ${name} --tag "x-created-by=hexa" --query "{name:name, id:id, location:location}"`,
      `Bootstrapping project ${chalk.cyan(name)}...`
    );
  }

  saveWorkspace({
    project
  });
};
