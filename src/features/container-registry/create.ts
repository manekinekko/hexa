import chalk from "chalk";
import { az, Config, sanitize, saveWorkspace, uuid } from "../../core/utils";
const debug = require("debug")("container");

module.exports = async function(creationMode: CreationMode) {
  const project: AzureResourceGroup = Config.get("project");

  // must be globally unique
  let name = sanitize(project.name) + uuid();
  debug(`using project ${chalk.green(name)}`);

  if (creationMode === "AUTOMATIC") {
    // https://docs.microsoft.com/en-us/cli/azure/acr?view=azure-cli-latest#az-acr-create
    // https://docs.microsoft.com/en-us/azure/container-registry/container-registry-skus
    const registry = await az<AzureContainerRegistry>(
      `acr create --resource-group ${project.name} --name ${name} --sku Basic --location ${project.location} --tags "x-created-by=hexa" --query "{name:name, id:id, hostname:loginServer}"`,
      `Creating registry for ${chalk.cyan(project.name)}`
    );

    Config.set("registry", registry);

    saveWorkspace({
      registry
    });
  }

  return true;
};
