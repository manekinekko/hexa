import chalk from "chalk";
import { az, readWorkspace, sanitize, saveWorkspace, uuid } from "../../core/utils";
import debug from "debug";
debug("container");

export default async function (creationMode: CreationMode) {
  const workspace = readWorkspace();
  const project: AzureResourceGroup = workspace.project;

  // must be globally unique
  let name = sanitize(project.name) + uuid();
  debug(`using project ${chalk.green(name)}`);

  if (creationMode === "AUTOMATIC") {
    // https://docs.microsoft.com/en-us/cli/azure/acr?view=azure-cli-latest#az-acr-create
    // https://docs.microsoft.com/en-us/azure/container-registry/container-registry-skus
    const registry = await az<AzureContainerRegistry>(
      `acr create --resource-group ${project.name} --name ${name} --sku Standard --location ${project.location} --tags "x-created-by=hexa" --query "{name:name, id:id, hostname:loginServer}"`,
      `Creating a Container Registry for project ${chalk.cyan(project.name)}...`
    );

    saveWorkspace({
      registry
    });
  }

  return true;
};
