import chalk from "chalk";
import { az, Config, sanitize, saveWorkspace, uuid } from "../../core/utils";
const debug = require("debug")("functions");

module.exports = async function() {
  const project: string = Config.get("project");
  debug(`using project ${chalk.green(project)}`);

  const storage: AzureStorage = Config.get("storage");
  debug(`using storage ${chalk.green(storage.name)}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${chalk.green(subscription.name)}`);

  const resourceGroup: AzureResourceGroup = Config.get("resourceGroup");
  debug(`using resourceGroup ${chalk.green(resourceGroup.name)}`);

  const functionAppName = `${sanitize(project)}-${uuid()}`;

  // https://docs.microsoft.com/en-us/cli/azure/functionapp?view=azure-cli-latest#az-functionapp-list
  let functionAppsList = await az<AzureFunctionApp[]>(
    `functionapp list --resource-group "${resourceGroup.name}" --subscription "${subscription.id}" --query '[].{id: id, name: name, appServicePlanId: appServicePlanId, hostName: defaultHostName, state: state, tags: tags}'`,
    `Checking storage accounts...`
  );
  functionAppsList = functionAppsList.sort((a, b) => (a.tags && a.tags["x-created-by"] === "hexa" ? -1 : 1));

  let functionApp = null;

  if (functionAppsList.length) {
    functionApp = functionAppsList[0];
    debug(`using functionApp ${chalk.green(functionApp.name)}`);
  } else {
    // https://docs.microsoft.com/en-us/cli/azure/functionapp?view=azure-cli-latest#az-functionapp-create
    functionApp = await az<AzureFunctionApp>(
      `functionapp create --resource-group ${resourceGroup.name} --consumption-plan-location ${resourceGroup.location} --name ${functionAppName} --storage-account ${storage.name} --runtime node --tag 'x-created-by=hexa' --query '{id: id, name: name, appServicePlanId: appServicePlanId, hostName: defaultHostName, state: state, tags: tags}'`,
      `Enabling Functions...`
    );
    debug(`created functionApp ${chalk.green(functionApp.name)}`);
  }

  functionApp = {
    ...functionApp,
    hostName: functionApp.hostName,
    id: functionApp.id,
    name: functionApp.name || functionAppName
  };

  Config.set("functionApp", functionApp);

  saveWorkspace({ functionApp });

  // init functions projects
  return (await require("./init"))();
};
