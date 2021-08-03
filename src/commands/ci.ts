import { az, readWorkspace, sanitize } from "../core/utils";
import chalk from "chalk";
import dbg from "debug";
const debug = dbg("ci");

export default async function() {
  const { project } = readWorkspace();
  let name = sanitize(project.name);
  debug(`using project ${chalk.green(name)}`);

  // https://docs.microsoft.com/en-us/cli/azure/ad/sp?view=azure-cli-latest#az-ad-sp-create-for-rbac
  const servicePrincipal = await az<AzureServicePrincipal>(`ad sp create-for-rbac --name="${name}" --role Contributor`, `Creating a Service Principal for CI...`);

  console.log(servicePrincipal);
};
