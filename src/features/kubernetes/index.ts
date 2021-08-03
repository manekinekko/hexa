import chalk from "chalk";
import { chooseKubernetesCluster } from "../../core/prompt";
import { az, Config, copyTemplate, saveWorkspace, updateFile, readWorkspace } from "../../core/utils";
import dbg from "debug";
const debug = dbg("k8s");

import createK8sClutster from './create';
import acr from '../container-registry/index';

export default async function() {
  // check ACR dependencies before
  await acr();

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`Using subscription ${chalk.green(subscription.name)}`);

  const workspace = readWorkspace();
  const resourceGroup: AzureResourceGroup = workspace.project;
  debug(`Using resource group ${chalk.green(resourceGroup.name)}`);

  const registry: AzureContainerRegistry = workspace.registry;
  debug(`using registry ${chalk.green(registry.name)}`);

  let k8s: AzureKubernetesCluster = {
    id: null as any,
    name: "",
    hostname: "",
    nodeResourceGroup: "",
    publicIp: null as any
  };

  // https://docs.microsoft.com/en-us/cli/azure/aks?view=azure-cli-latest#az-aks-list
  const kubeClustersList = await az<AzureKubernetesCluster[]>(
    `aks list --resource-group="${resourceGroup.name}" --subscription="${subscription.id}" --query "[].{name:name, id:id, hostname:fqdn, tags:tags}"`,
    `Checking Kubernetes cluster for project ${chalk.cyan(resourceGroup.name)}...`
  );

  // In case we dont find any cluster that had been created by Hexa,
  // fallback to either a MANUAL or AUTOMATIC creation, depending on the global config
  let creationMode: CreationMode = process.env.HEXA_AUTO_MODE ? "AUTOMATIC" : "MANUAL";

  if (Array.isArray(kubeClustersList) && kubeClustersList.length === 0) {
    // no cluster found, create one using the selected creation mode
    await createK8sClutster(creationMode);
    k8s = Config.get("k8s") as AzureKubernetesCluster;
  } else if (Array.isArray(kubeClustersList) && kubeClustersList.length === 1) {
    const cluster = kubeClustersList[0];
    debug(`found one cluster ${chalk.green(cluster.name)}`);

    // has this cluster been created with Hexa?
    if (creationMode === "AUTOMATIC" && (cluster && cluster.tags && cluster.tags["x-created-by"] === "hexa")) {
      debug(`using cluster ${chalk.green(cluster.name)}`);

      // use this cluster
      k8s = cluster;
    } else {
      // we are either in manual mode or we could not find a valid cluster
      // let the user choose
      // note: the user may wanna create a new clustor
      k8s.id = (await chooseKubernetesCluster(kubeClustersList)).cluster as (string & CreationMode);
    }
  } else if (Array.isArray(kubeClustersList)) {
    // we found many clusters, let the user choose the right one
    // note: the user may wanna create a new clustor
    k8s.id = (await chooseKubernetesCluster(kubeClustersList)).cluster as (string & CreationMode);
  }

  // the user choose to create a new cluster
  if (k8s.id === "MANUAL") {
    await createK8sClutster("MANUAL");
    k8s = Config.get("k8s");
  }

  debug(`setting cluster ${chalk.green(k8s.name)}`);

  copyTemplate("init/kubernetes/k8s.yaml.tpl", "./k8s.yaml", {
    containerImage: `${registry.hostname}/hexa/${resourceGroup.name}:latest`,
    projectName: resourceGroup.name
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

  saveWorkspace({
    k8s
  });

  return true;
};
