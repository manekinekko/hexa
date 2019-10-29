import inquirer = require("inquirer");
import chalk from "chalk";
import { chooseKubernetesCluster } from "../../core/prompt";
import { az, Config, saveWorkspace, copyTemplate, updateFile } from "../../core/utils";
const debug = require("debug")("k8s");

module.exports = async function() {
  // check ACR dependencies before
  await require(`../container-registry/index`)();

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`Using subscription ${chalk.green(subscription.name)}`);

  const resourceGroup: AzureResourceGroup = Config.get("project");
  debug(`Using resource group ${chalk.green(resourceGroup.name)}`);

  // https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-list
  const kubeClustersList = await az<AzureKubernetesCluster[]>(
    `aks list --resource-group="${resourceGroup.name}" --subscription="${subscription.id}" --query "[].{name:name, id:id, hostname:fqdn, tags:tags}"`,
    `Checking Kubernetes cluster for project ${chalk.cyan(resourceGroup.name)}...`
  );

  // In case we dont find any cluster that had been created by Hexa,
  // fallback to either a MANUAL or AUTOMATIC creation, depending on the global config
  let creationMode = process.env.HEXA_AUTO_MODE ? "AUTOMATIC" : "MANUAL";
  let selectedClusterId: string | null = null;

  if (kubeClustersList.length === 0) {
    // no cluster found, create one
    return (await require(`./create`))(creationMode);
  }

  if (creationMode === "AUTOMATIC") {
    if (kubeClustersList.length === 1) {
      const cluster = kubeClustersList[0];
      debug(`found one cluster ${chalk.green(cluster.name)}`);

      // had the cluster been created with Hexa?
      if (cluster && cluster.tags && cluster.tags["x-created-by"] === "hexa") {
        debug(`using cluster ${chalk.green(cluster.name)}`);

        // take its ID
        selectedClusterId = cluster.id;
      } else {
        // we founf one cluster but it was not created by Hexa, go ahead and automatically create one
        return (await require(`./create`))("AUTOMATIC");
      }
    } else {
      // we found many clusters, let the user choose the right one
      selectedClusterId = (await chooseKubernetesCluster(kubeClustersList)).cluster as (string & CreationMode);
    }
  } else {
    selectedClusterId = (await chooseKubernetesCluster(kubeClustersList)).cluster as (string & CreationMode);
  }

  if (selectedClusterId === "MANUAL") {
    // the user expliticitly chooses to manually create a new cluster
    return (await require(`./create`))("MANUAL");
  }

  const { id, name, hostname } = kubeClustersList.find((cluster: AzureKubernetesCluster) => cluster.id === selectedClusterId) as AzureKubernetesCluster;
  debug(`setting cluster ${chalk.green(name)}`);

  copyTemplate("init/kubernetes/k8s.yaml.tpl", "./k8s.yaml", {
    containerName: name
  });
  copyTemplate("init/kubernetes/Dockerfile.tpl", "Dockerfile");
  updateFile({
    filepath: `./.dockerignore`,
    replace: `
.dockerignore
.env
.git
.gitignore
.vscode
node_modules
npm-debug.log
    `
  });

  const k8s = {
    id,
    name,
    hostname
  };

  Config.set("k8s", k8s);

  saveWorkspace({
    k8s
  });

  return true;
};
