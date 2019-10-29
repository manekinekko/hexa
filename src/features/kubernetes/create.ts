import chalk from "chalk";
import { askForKubernetesClusterDetails } from "../../core/prompt";
import { az, Config, sanitize, saveWorkspace, uuid } from "../../core/utils";
const debug = require("debug")("k8s:create");

module.exports = async function(creationMode: CreationMode) {
  const project: AzureResourceGroup = Config.get("project");

  let name = sanitize(project.name) + uuid();
  debug(`using project ${name}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${chalk.green(subscription.name)}`);

  const registry: AzureContainerRegistry = Config.get("registry");
  debug(`using registry ${chalk.green(registry.name)}`);

  if (creationMode === "MANUAL") {
    ({ name } = await askForKubernetesClusterDetails(name));
  }

  // https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-create
  let k8s = await az<AzureKubernetesCluster>(
    `aks create --location "${project.location}" --name "${name}" --subscription "${subscription.id}" --resource-group "${project.name}" --attach-acr "${registry.id}" --skip-subnet-role-assignment --node-count 1 --node-vm-size "Standard_B2s" --dns-name-prefix="hexa" --generate-ssh-keys --nodepool-name="hexa" --tags "x-created-by=hexa" --query "{name:name, id:id}"`,
    `Creating Kubernetes cluster ${chalk.cyan(name)} (this may take up to 10 minutes)...`
  );

  // https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-get-credentials
  await az<string>(`aks get-credentials --resource-group "${project.name}" --name "${name}"`, `Checking credentials for cluster ${chalk.cyan(name)}...`);

  Config.set("k8s", k8s);
  debug(`k8s ${JSON.stringify(Config.get("k8s"))}`);

  saveWorkspace({
    k8s
  });

  return true;
};
