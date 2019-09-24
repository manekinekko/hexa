import { Config, az, readWorkspace, isProjectFileExists } from "../core/utils";
import chalk from "chalk";
const debug = require("debug")("push");

module.exports = async function() {
  if (isProjectFileExists() === false) {
    console.log(chalk.red(`✗ The ${chalk.cyan("nitro push")} command can only be run inside a Nitro project.`));
    console.log(chalk.red(`✗ Run ${chalk.cyan("nitro init")} first.`));
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
  
  let hostingUrl = null;
  if (workspace.hosting) {
    debug(`deploying hosting configuration`);
    // https://docs.microsoft.com/en-us/cli/azure/storage/blob?view=azure-cli-latest#az-storage-blob-upload-batch
    await az(
      `storage blob upload-batch --source '${workspace.hosting.public}' --destination '\$web' --account-name ${workspace.storage.name} --no-progress`,
      `Deploying hosting ${chalk.green(workspace.project)}...`
    );

    // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-show
    hostingUrl = await az(
      `storage account show --name ${workspace.storage.name} --query "primaryEndpoints.web"`,
      `Getting public URL for ${chalk.green(workspace.project)}...`
    );
  }

  console.log(`${chalk.green("✓")} Application ${chalk.green(workspace.project)} deployed:`);
  console.log(`\t- Hosting: ${hostingUrl}`);
};
