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
    `aks create --location "${project.location}" --name "${name}" --subscription "${subscription.id}" --resource-group "${project.name}" ` +
      `--attach-acr "${registry.id}" --skip-subnet-role-assignment --node-count 1 --node-vm-size "Standard_B2s" ` +
      `--dns-name-prefix="${name}" --generate-ssh-keys --nodepool-name="hexa" --tags "x-created-by=hexa" ` +
      `--query "{name:name, id:id, hostname:fqdn, nodeResourceGroup:nodeResourceGroup, tags:tags}"`,
    `Creating Kubernetes cluster ${chalk.cyan(name)} (this may take up to 10 minutes)...`
  );

  debug(`created resource group ${chalk.green(JSON.stringify(k8s))}`);

  // https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-get-credentials
  await az<string>(`aks get-credentials --resource-group "${project.name}" --name "${name}"`, `Checking credentials for cluster ${chalk.cyan(name)}...`);

  // https://docs.microsoft.com/en-us/cli/azure/network/public-ip?view=azure-cli-latest#az-network-public-ip-list
  const k8sIPAdressDetails = await az<AzurePublicIpAddress[]>(
    `network public-ip list --resource-group ${k8s.nodeResourceGroup} --query "[?tags.service == 'default/${name}'].{ip:ipAddress, id:id, name:name}"`,
    `Checking DNS records for pods project ${chalk.cyan(k8s.nodeResourceGroup)}...`
  );

  if (k8sIPAdressDetails.length) {
    const ip = k8sIPAdressDetails[0];

    // https://docs.microsoft.com/en-us/cli/azure/network/public-ip?view=azure-cli-latest#az-network-public-ip-update
    k8s.publicIp = await az<AzurePublicIpAddress>(
      `network public-ip update --resource-group ${k8s.nodeResourceGroup} --name ${ip.name} --dns-name ${name} --query {ip:ipAddress, id:id, name:name}`,
      `Updating DNS for pods project ${chalk.cyan(k8s.nodeResourceGroup)}...`
    );
  }

  Config.set("k8s", k8s);
  debug(`k8s ${JSON.stringify(Config.get("k8s"))}`);

  saveWorkspace({
    k8s: {
      name: k8s.name,
      hostname: k8s.publicIp.dns.fqdn || k8s.publicIp.ip
    }
  });

  return true;
};
