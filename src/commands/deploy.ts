import chalk from "chalk";
import { az, Config, func, isProjectFileExists, joinPath, npm, readWorkspace, runCmd, kubectl } from "../core/utils";
const debug = require("debug")("push");

module.exports = async function() {
  if (isProjectFileExists() === false) {
    console.log(chalk.red(`✗ The ${chalk.cyan("hexa deploy")} command can only be run inside a Hexa project.`));
    console.log(chalk.red(`✗ Run ${chalk.cyan("hexa init")} first.`));
    console.log(chalk.red(`✗ Abort.`));
    process.exit(1);
  }

  // DON'T READ GLOBAL CONFIG, EXCEPT FOR SUBSCRIPTIO ID
  const subscription: AzureSubscription = Config.get("subscription");

  // Get all other required configs from the current workspace
  const workspace: NitroWorkspace = readWorkspace();

  if (workspace.storage.connectionString) {
    process.env.AZURE_STORAGE_CONNECTION_STRING = workspace.storage.connectionString;
    debug(`set env variable AZURE_STORAGE_CONNECTION_STRING`);
  }

  let hostingUrl = "";
  let functionUrls: { name: string; url: string }[] = [];
  let registryPath = "";
  let serviceUrl = "";

  // Deploy hosting config
  if (workspace.hosting) {
    debug(`deploying hosting`);
    // https://docs.microsoft.com/en-us/cli/azure/storage/blob?view=azure-cli-latest#az-storage-blob-upload-batch
    await az(
      `storage blob upload-batch --source '${workspace.hosting.folder}' --destination '\$web' --account-name ${workspace.storage.name} --no-progress`,
      `Deploying hosting ${chalk.cyan(workspace.project.name)}...`
    );

    // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-show
    hostingUrl = await az(`storage account show --name ${workspace.storage.name} --query "primaryEndpoints.web"`, `Fetching URL for ${chalk.cyan(workspace.project.name)}...`);
  }

  // Deploy functions config
  if (workspace.functionApp) {
    debug(`deploying functions`);

    const functionApp = workspace.functionApp;

    await npm<void>(`run build:production`, joinPath(process.cwd(), functionApp.folder as string, functionApp.name), `Building Function app ${chalk.cyan(functionApp.name)}...`);
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

  // Deploy k8s config
  if (workspace.k8s) {
    debug(`deploying container`);
    const containerRegistry = workspace.registry;
    const image = `${containerRegistry.hostname}/hexa/${workspace.project.name}:latest`;
    await az(`acr build --image ${image} --registry "${containerRegistry.name}" --file Dockerfile .`, `Deploying image ${chalk.cyan(image)}....`);

    registryPath = image;

    debug(`deploying cluster`);
    await kubectl(`apply -f k8s.yaml -o json`, `Deploying cluster ${chalk.cyan(workspace.k8s.name)}...`) as any;

    serviceUrl = await kubectl(`get service ${workspace.k8s.name} -o jsonpath='{.status.loadBalancer.ingress[].ip}{":"}{.spec.ports[].targetPort}'`, `Fetching service adrress...`);

    debug(`fetching service address=${chalk.green(serviceUrl)}`);
  }

  /////

  console.log(`${chalk.green("✔")} Application ${chalk.green(workspace.project.name)} deployed successfully!\n`);

  if (hostingUrl) {
    console.log(`${chalk.yellow("➜")} Hosting: ${chalk.green(hostingUrl)}`);
  }

  if (workspace.database) {
    console.log(`${chalk.yellow("➜")} Database: ${chalk.green(workspace.database.endpoint)}`);
  }

  if (functionUrls.length) {
    console.log(`${chalk.yellow("➜")} Functions:`);
    functionUrls.forEach(func => {
      console.log(` - ${func.name}: ${chalk.green(func.url)}`);
    });
  }

  if (registryPath) {
    console.log(`${chalk.yellow("➜")} Kubernetes:`);
    console.log(` - URL: ${chalk.green(serviceUrl)}`);
    console.log(` - Container: ${chalk.green(registryPath)}`);
  }

  console.log(`\n`);
  return true;
};
