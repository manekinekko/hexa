import { Config, az, readWorkspace, isProjectFileExists, npm, func, getFullPath, joinPath } from "../core/utils";
import chalk from "chalk";
const debug = require("debug")("push");

module.exports = async function() {
  if (isProjectFileExists() === false) {
    console.log(chalk.red(`✗ The ${chalk.cyan("hexa deploy")} command can only be run inside a Hexa project.`));
    console.log(chalk.red(`✗ Run ${chalk.cyan("hexa init")} first.`));
    console.log(chalk.red(`✗ Abort.`));
    process.exit(1);
  }

  const subscription: AzureSubscription = Config.get("subscription");
  const storage: AzureStorage = Config.get("storage");
  const workspace: NitroWorkspace = readWorkspace();

  if (workspace.storage.connectionString) {
    process.env.AZURE_STORAGE_CONNECTION_STRING = workspace.storage.connectionString;
    debug(`set env variable AZURE_STORAGE_CONNECTION_STRING`);
  }

  let hostingUrl = "";
  let functionUrls: { name: string; url: string }[] = [];
  if (workspace.hosting) {
    debug(`deploying hosting`);
    // https://docs.microsoft.com/en-us/cli/azure/storage/blob?view=azure-cli-latest#az-storage-blob-upload-batch
    await az(
      `storage blob upload-batch --source '${workspace.hosting.folder}' --destination '\$web' --account-name ${workspace.storage.name} --no-progress`,
      `Deploying hosting ${chalk.cyan(workspace.project)}...`
    );

    // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-show
    hostingUrl = await az(
      `storage account show --name ${workspace.storage.name} --query "primaryEndpoints.web"`,
      `Fetching URL for ${chalk.cyan(workspace.project)}...`
    );
  }

  if (workspace.functionApp) {
    debug(`deploying functions`);

    const functionApp = workspace.functionApp;

    await npm<void>(
      `run build:production`,
      joinPath(process.cwd(), functionApp.folder as string, functionApp.name),
      `Building Function app ${chalk.cyan(functionApp.name)}...`
    );
    const functionAppPublishResult = await func<void>(
      `azure functionapp publish ${functionApp.name}`,
      joinPath(process.cwd(), functionApp.folder as string, functionApp.name),
      `Deploying Function app ${chalk.cyan(functionApp.name)}....`
    );

    const matchedFunctionUrls = functionAppPublishResult.match(/(https:\/\/[\w-_.\/?=]+)/gm) as string[];

    functionUrls = matchedFunctionUrls.map(url => {
      return {
        name: url
          .split("?")[0]
          .split("/")
          .pop() as string,
        url
      };
    });
  }

  console.log(`${chalk.green("✔")} Application ${chalk.green(workspace.project)} deployed successfully!\n`);

  if (hostingUrl) {
    console.log(`${chalk.yellow('➜')} Hosting: ${chalk.green(hostingUrl)}`);
  }
  
  if (workspace.database) {
    console.log(`${chalk.yellow('➜')} Database: ${chalk.green(workspace.database.endpoint)}`);
  }
  
  if (functionUrls.length) {
    console.log(`${chalk.yellow('➜')} Functions:`);
    functionUrls.forEach(func => {
      console.log(` - ${func.name}: ${chalk.green(func.url)}`);
    });
  }
  

  return true;
};
