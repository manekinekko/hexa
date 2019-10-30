import { az, Config, saveWorkspace, sanitize } from "../../core/utils";
import chalk from "chalk";
const debug = require("debug")("rbac");

module.exports = async function() {
  const project: AzureResourceGroup = Config.get("project");
  let name = sanitize(project.name);
  debug(`using project ${name}`);

  // https://docs.microsoft.com/en-us/cli/azure/ad/sp?view=azure-cli-latest#az-ad-sp-create-for-rbac
  const servicePrincipal = await az<AzureServicePrincipal>(
    `ad sp create-for-rbac --name="${name}" --scopes "${project.id}" --skip-assignment`,
    `Checking authorizations for project ${chalk.cyan(project.name)}...`
  );

  Config.set("servicePrincipal", servicePrincipal);

  return servicePrincipal;
};
