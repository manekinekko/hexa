import chalk from "chalk";
import { az, directoryExists, FEATURES, func, isProjectFileExists, joinPath, kubectl, npm, readEnvFile, readWorkspace, updateFile, readFileFromDisk } from "../core/utils";
import dbg from "debug";
const debug = dbg("deploy");

export default async function(options: HexaInitOptions) {
  if (isProjectFileExists() === false) {
    console.log(chalk.red(`✗ The ${chalk.cyan("hexa deploy")} command can only be run inside a Hexa project.`));
    console.log(chalk.red(`✗ Run ${chalk.cyan("hexa init")} first.`));
    console.log(chalk.red(`✗ Abort.`));
    process.exit(1);
  }

  // Get all other required configs from the current workspace
  const workspace: HexaWorkspace = readWorkspace();

  const validFeatures = FEATURES.map(feat => feat.value);

  // validate the services that need to be deployed
  let requestedServices = (options.requestedServices || []) as string[];
  if (requestedServices.length) {
    const workspaceKeys = Object.keys(workspace);
    workspaceKeys
      .filter(service => validFeatures.includes(service))
      .map(service => {
        // don't deploy services that are not requested by the user
        // project and storage are required entries!
        if (["project", "storage"].includes(service) === false && requestedServices.includes(service) === false) {
          (workspace as any)[service] = null;
        }
      });
  }

  const envFile = readEnvFile();

  if (workspace.storage && envFile) {
    process.env.AZURE_STORAGE_CONNECTION_STRING = envFile.AZURE_STORAGE_CONNECTION_STRING;
    debug(`settting AZURE_STORAGE_CONNECTION_STRING=${chalk.green(process.env.AZURE_STORAGE_CONNECTION_STRING as string)}`);
  }

  let deployStatus = false;
  let hostingUrl: { message: string } = { message: "" };
  let functionUrls: { name: string; url: string }[] = [];
  let registryPath = "";
  let serviceUrl = "";

  if (requestedServices.length) {
    console.log(`Deploying services: ${chalk.green(requestedServices.join(","))}`);
  }

  // Deploy hosting config
  if (workspace.hosting) {
    if (directoryExists(workspace.hosting.folder)) {
      deployStatus = true;

      const currentDeployTime = `${new Date().toISOString().substr(0, 16)}Z`;
      const lastDeployMetadataFile = ".hexalastdeploy";
      const deployTimeMetadaFile = `${workspace.hosting.folder}/${lastDeployMetadataFile}`;
      const lastDeployTimeFromFile = readFileFromDisk(deployTimeMetadaFile);
      let lastDeployTime: string = "";

      // validate the deploy time
      if (lastDeployTimeFromFile && lastDeployTimeFromFile.length === 17 && /(\d{4}\-\d{2}\-\d{2}\T\d{2}:\d{2}Z)/.test(lastDeployTimeFromFile)) {
        lastDeployTime = lastDeployTimeFromFile;
      } else {
        lastDeployTime = currentDeployTime;
      }

      debug(`deploying hosting if-modified-since "${chalk.green(lastDeployTime)}"`);
      // https://docs.microsoft.com/en-us/cli/azure/storage/blob?view=azure-cli-latest#az-storage-blob-upload-batch
      const uploadedFiles = await az<any[]>(
        `storage blob upload-batch --source "${workspace.hosting.folder}" --destination "\\$web" --account-name "${workspace.storage.name}" --no-progress --max-connections "5" --validate-content --content-cache-control "no-cache"`,
        `Deploying hosting for ${chalk.cyan(workspace.project.name)}...`
      );

      if (uploadedFiles.length > 0) {
        updateFile({
          filepath: deployTimeMetadaFile,
          search: "*",
          replace: currentDeployTime
        });
      }

      // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-show
      hostingUrl = await az(`storage account show --name ${workspace.storage.name} --query "primaryEndpoints.web"`, `Fetching URL for ${chalk.cyan(workspace.project.name)}...`);

    } else {
      console.log(`${chalk.yellow("✗")} Skipping hosting: the ${workspace.hosting.folder} folder is missing!`);
    }
  }

  // Deploy functions config
  if (workspace.functions) {
    if (directoryExists(workspace.functions.folder as string)) {
      deployStatus = true;

      debug(`deploying functions`);

      const functionApp = workspace.functions;

      await npm(`run build:production`, joinPath(process.cwd(), functionApp.folder as string, functionApp.name), `Building Function app ${chalk.cyan(functionApp.name)}...`);
      const functionAppPublishResult = await func(
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
    } else {
      console.log(`${chalk.yellow("✗")} Skipping functions: the ${workspace.functions.folder} folder is missing!`);
    }
  }

  // Deploy k8s config
  if (workspace.k8s) {
    deployStatus = true;

    debug(`deploying container`);
    const containerRegistry = workspace.registry;
    const image = `${containerRegistry.hostname}/hexa/${workspace.project.name}:latest`;
    await az(`acr build --image ${image} --registry "${containerRegistry.name}" --file Dockerfile .`, `Deploying image ${chalk.cyan(image)}....`);

    registryPath = image;

    debug(`deploying cluster`);
    (await kubectl(`apply -f k8s.yaml -o json`, `Deploying cluster ${chalk.cyan(workspace.k8s.name)}...`)) as any;

    // k8s FQDN or loadbalancer public IP address
    serviceUrl = workspace.k8s.hostname;
    debug(`fetching service address=${chalk.green(serviceUrl)}`);
  }

  /////

  if (hostingUrl.message) {
    console.log(`${chalk.yellow("➜")} Hosting: ${chalk.green(hostingUrl.message.replace(/"/g, ""))}`);
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
    if (serviceUrl) {
      console.log(` - URL: ${chalk.green(serviceUrl)}`);
    }
    console.log(` - Container: ${chalk.green(registryPath)}`);
  }

  if (deployStatus) {
    console.log(`${chalk.green("✔")} Application ${chalk.green(workspace.project.name)} deployed successfully!\n`);
  } else {
    console.log(chalk.yellow(`✗ No resources deployed. Run hexa init and try again!`));
  }
  return true;
};
