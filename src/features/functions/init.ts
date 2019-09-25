import chalk from "chalk";
import { Config, func, sanitize, uuid, createDirectoryIfNotExists, npm, directoryExists, saveWorkspace } from "../../core/utils";
import { askForFunctionsAppFolder, askForFunctionNameFolder } from "../../core/prompt";
const debug = require("debug")("functions:init");

module.exports = async function() {
  const project: string = Config.get("project");
  debug(`using project ${chalk.green(project)}`);

  const functionApp: AzureFunctionApp = Config.get("functionApp");
  debug(`using functionApp ${chalk.green(functionApp.name)}`);

  const storage: AzureStorage = Config.get("storage");
  debug(`using storage ${chalk.green(storage.name)}`);

  const functionAppName = sanitize(functionApp.name);

  let functionAppDirectory = `./functions`;

  if (process.env.NITRO_AUTO_MODE) {
    createDirectoryIfNotExists(functionAppDirectory);
  } else {
    functionAppDirectory = (await askForFunctionsAppFolder()).folder;
  }

  // sanity check: if the function name folder exists, set to a different name
  let functionHttpName = "httpTrigger";
  const functionAppPath = `${functionAppDirectory}/${functionAppName}`;
  const functionHttpPath = `${functionAppPath}/${functionHttpName}`;
  if (directoryExists(functionHttpPath)) {
    const newFunctionHttpName = `${functionHttpName}` + uuid();
    debug(`function ${functionHttpName} already exists. New function name is ${newFunctionHttpName}`);

    functionHttpName = newFunctionHttpName;
  }

  debug(`selected functions folder=${functionAppDirectory}`);

  saveWorkspace({
    functionApp: {
      folder: functionAppDirectory
    }
  });

  await func<void>(
    `init ${functionAppName} --worker-runtime node --language typescript`,
    functionAppDirectory,
    `Initilizing a function project...`
  );
  await func<void>(
    `new --template httptrigger --name "${functionHttpName}" --language typescript`,
    `${functionAppPath}`,
    `Scaffolding a function...`
  );
  await npm<void>(
    `install`,
    functionAppPath,
    `Installing npm dependencies for ${chalk.green(functionAppDirectory)}...`
  );

  return true;
};
