import chalk from "chalk";
import { askForFunctionsAppFolder } from "../../core/prompt";
import { Config, createDirectoryIfNotExists, directoryExists, func, npm, saveWorkspace, uuid, copyTemplate, sanitize, updateFile, readWorkspace } from "../../core/utils";
import dbg from "debug";
const debug = dbg("functions:init");

export default async function() {
  const workspace = readWorkspace();
  const project: AzureResourceGroup = workspace.project;
  debug(`using project ${chalk.green(project.name)}`);

  const functionApp: AzureFunctionApp = Config.get("functions");
  debug(`using functionApp ${chalk.green(functionApp.name)}`);

  const storage: AzureStorage = workspace.storage;
  debug(`using storage ${chalk.green(storage.name)}`);

  const functionAppName = functionApp.name;

  let functionAppDirectory = `./functions`;

  if (process.env.HEXA_AUTO_MODE) {
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
    functions: {
      folder: functionAppDirectory,
      id: functionApp.id,
      name: functionApp.name
    }
  });

  await func(
    `init ${functionAppName} --worker-runtime node --language typescript`,
    functionAppDirectory,
    `Setting Function project ${chalk.cyan(functionAppName)}...`
  );
  await func(
    `new --template httptrigger --name "${functionHttpName}" --language typescript`,
    `${functionAppPath}`,
    `Scaffolding function ${chalk.cyan(functionHttpName)}...`
  );

  // override the function index.ts with a simpler example
  copyTemplate(`init/functions/index.ts.tpl`, `${functionAppPath}/${functionHttpName}/index.ts`, {functionHttpName: sanitize(functionHttpName)});

  await npm(`install`, functionAppPath, `Installing dependencies for ${chalk.cyan(functionAppPath)}...`);

  // should be setup Bazel config?
  if (process.env.HEXA_USE_BAZEL) {
    await npm(`install -D @bazel/ibazel@latest @bazel/bazel@latest @bazel/typescript@latest`, functionAppPath, `Adding Bazel configuration for ${chalk.cyan(functionAppPath)}...`);

    // create the WORKSPACE
    copyTemplate(`init/functions/WORKSPACE.tpl`, `${functionAppPath}/WORKSPACE`, {functionAppName: sanitize(functionAppName)});

    // create the root BUILD.bazel file
    copyTemplate(`init/functions/BUILD.root.bazel.tpl`, `${functionAppPath}/BUILD.bazel`);

    // create the BUILD.bazel file for the function
    copyTemplate(`init/functions/BUILD.bazel.tpl`, `${functionAppPath}/${functionHttpName}/BUILD.bazel`, {functionHttpName: sanitize(functionHttpName)});

    // update function.json to use Bazel's ${bazel-bin} file
    updateFile({
      filepath: `${functionAppPath}/${functionHttpName}/function.json`,
      replace: `../bazel-bin/${functionHttpName}/index.js`,
      search: `../dist/${functionHttpName}/index.js`,
    });

    updateFile({
      filepath: `${functionAppPath}/${functionHttpName}/index.ts`,
      replace: `../bazel-bin/${functionHttpName}/index.js`,
      search: `.body: "Hello from Bazel"`,
    });

    updateFile({
      filepath: `${functionAppPath}/package.json`,
      replace: `"build": "bazel build //..."`,
      search: `"build": "tsc"`,
    });

    updateFile({
      filepath: `${functionAppPath}/package.json`,
      replace: `"watch": "ibazel build //..."`,
      search: `"watch": "tsc --w"`,
    });

    updateFile({
      filepath: `${functionAppPath}/.funcignore`,
      replace: `
## Bazel ignored files
node_modules/@bazel/*
BUILD.bazel

# ignore all bazel output folder except the bazel-bin folder
# where the transpiled code lives
bazel-*
!bazel-bin
      `
    });
  }

  return true;
};
