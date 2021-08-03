import chalk from "chalk";
import debug from "debug";
import { askForAzureStaticWebAppsProjectDetails } from "../../core/prompt";
import { az, Config, copyTemplate, detectAzureStaticWebAppsOutputLocation, getLocalGitBranch, getLocalGitUrl, git, readWorkspace, sanitize, saveWorkspace, uuid } from "../../core/utils";
debug("functions:init");

export default async function (_creationMode: CreationMode) {
  const { project } = readWorkspace();

  // Note: the swa instance name must be globally unique!
  let name = sanitize(project.name) + uuid();
  debug(`using project ${name}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${chalk.green(subscription.name)}`);

  const defaultGitUrl = await getLocalGitUrl();
  const defaultGitBranch = await getLocalGitBranch();
  const defaultOutputLocation = await detectAzureStaticWebAppsOutputLocation('./');
  const defaultGitHubToken = String(process.env.GITHUB_HEXA_DEMO_PAT);
  let { gitBranch, gitUrl, gitHubToken, outputLocation, apiLocation, appLocation } = await askForAzureStaticWebAppsProjectDetails(defaultGitBranch, defaultGitUrl, defaultOutputLocation, defaultGitHubToken) as AzureStaticWebApps;

  // https://docs.microsoft.com/en-us/cli/azure/staticwebapp?view=azure-cli-latest#az_staticwebapp_create
  let swa = await az<AzureStaticWebApps>(
    `staticwebapp create \
      -n "${name}" \
      -g "${project.name}" \
      -s "${gitUrl}" \
      -l "${project.location}" \
      -b "${gitBranch}" \
      --output-location "${outputLocation}" \
      --api-location "${apiLocation}" \
      --app-location "${appLocation}" \
      --token "${gitHubToken}" --tag "x-created-by=hexa" --query "{name:name, id:id, url:defaultHostname}"`,
    `Creating an Azure Static Web Apps instance ${chalk.cyan(name)}...`
  );


  copyTemplate(`init/swa/index.html.tpl`, `${outputLocation?.replace('/', '')}/index.html`, { projectName: name }, { overwrite: false });

  saveWorkspace({
    swa: {
      ...swa,
      url: `https://${swa.url}`,
      location: project.location
    }
  });

  await git(`add .`);
  await git(`commit -m "chore(hexa): new changes"`);
  await git(`pull origin ${gitBranch} --rebase`);
  await git(`push origin ${gitBranch}`, `Synchronizing changes...`);

  console.log(`${chalk.yellow("➜")} Preview URL: ${chalk.green('https://' + swa.url)}`);

  return true;
};
