import chalk from "chalk";
import { az, Config, readWorkspace, sanitize } from "../../core/utils";
import debug from "debug";
debug("rbac");

export default async function() {
  const {project} = readWorkspace();
  let name = sanitize(project.name);
  debug(`using project ${chalk.green(name)}`);

  // https://docs.microsoft.com/en-us/cli/azure/ad/sp?view=azure-cli-latest#az-ad-sp-create-for-rbac
  const servicePrincipal = await az<AzureServicePrincipal>(
    `ad sp create-for-rbac --name="http://${name}" --role Contributor`,
    `Checking authorizations for project ${chalk.cyan(project.name)}...`
  );

  Config.set("servicePrincipal", servicePrincipal);

  return servicePrincipal;
};
