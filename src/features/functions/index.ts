import chalk from "chalk";
import { az, Config, sanitize, saveWorkspace, uuid, readWorkspace } from "../../core/utils";
import dbg from "debug";
const debug = dbg("functions");

export default async function() {
  const workspace = readWorkspace();
  const project: AzureResourceGroup = workspace.project;
  debug(`using project ${chalk.green(project.name)}`);

  const storage: AzureStorage = workspace.storage;
  debug(`using storage ${chalk.green(storage.name)}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${chalk.green(subscription.name)}`);

  const functionAppName = `${sanitize(project.name)}-${uuid()}`;

  // https://docs.microsoft.com/en-us/cli/azure/functionapp?view=azure-cli-latest#az-functionapp-list
  let functionAppsList = await az<AzureFunctionApp[]>(
    `functionapp list --resource-group "${project.name}" --subscription "${subscription.id}" --query "[].{id: id, name: name, appServicePlanId: appServicePlanId, hostName: defaultHostName, state: state, tags: tags}"`,
    `Checking existing functions for project ${chalk.cyan(project.name)}...`
  );
  functionAppsList = functionAppsList.sort((a, _b) => (a.tags && a.tags["x-created-by"] === "hexa" ? -1 : 1));

  let functionApp: AzureFunctionApp | null = null;

  if (functionAppsList.length) {
    functionApp = functionAppsList[0];
    debug(`using functionApp ${chalk.green(functionApp.name)}`);
  } else {
    // https://docs.microsoft.com/en-us/cli/azure/functionapp?view=azure-cli-latest#az-functionapp-create
    functionApp = await az<AzureFunctionApp>(
      `functionapp create --resource-group ${project.name} --consumption-plan-location ${project.location} --name ${functionAppName} --storage-account ${storage.name} --runtime node --disable-app-insights --tag 'x-created-by=hexa' --query "{id: id, name: name, appServicePlanId: appServicePlanId, hostName: defaultHostName, state: state, tags: tags}"`,
      `Enabling Functions (this may take few minutes)...`
    );
    debug(`created functionApp ${chalk.green(functionApp.name)}`);
  }

  saveWorkspace({
    functions: {
      hostName: functionApp.hostName,
      id: functionApp.id,
      name: functionApp.name || functionAppName
    }
  });

  // init functions projects
  const { default: init } = await import('./init');
  return await init();
};
