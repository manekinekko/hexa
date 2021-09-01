import chalk from "chalk";
import Configstore from "configstore";
import crypto from "crypto";
import dbg from "debug";
import merge from "deepmerge";
import dotenv from "dotenv";
import fs, { promises as fsPromises } from "fs";
import ora from "ora";
import path from "path";
import shell from "shelljs";
import { name, version } from '../../package.json';
import jmespath from 'jmespath';
const { readdir } = fsPromises;
const debugCli = dbg(`hexa`);
export const debug = dbg(`utils`);

// generate a Global UUID per execution.
// We wante the UUID to be the same for all entitites.
const guuid = ((lenght = 2) =>
  crypto
    .randomBytes(16)
    .toString("hex")
    .substr(0, lenght))();
export const uuid = () => {
  return process.pid || guuid;
};

export const sanitize = (name: string) =>
  (name || "")
    .replace(/[\W_]+/gim, "")
    .trim()
    .substr(0, 20);

export const pluralize = (str: string) => str + (str.length > 1 ? "s are" : " is");

export const Config = new Configstore(name, {
  version
});

debug(`Cached config stored at ${chalk.green(Config.path)}`);

export const FEATURES = [
  {
    name: "Azure Static Web Apps: Configure and deploy a JAMStack on Azure",
    value: "swa",
    short: "Azure Static Web Apps"
  },
  {
    name: "Hosting: Configure and deploy to Azure Static Website (legacy)",
    value: "hosting",
    short: "Hosting"
  },
  {
    name: "Functions: Configure and deploy an Azure Functions",
    value: "functions",
    short: "Functions"
  },
  {
    name: "Database: Configure and deploy a database on Azure",
    value: "database",
    short: "Database"
  },
  // @todo: this feature needs more testing scenarios before going public
  // {
  //   name: "Kubernetes: Configure a Kubernetes cluster (preview)",
  //   value: "kubernetes",
  //   short: "Kubernetes"
  // }
];

export const WORKSPACE_FILENAME = process.env.HEXA_DRY_RUN ? "hexa.test.json" : "hexa.json";
export const ENV_FILENAME = ".env";

const IS_DEBUG = !!process.env.DEBUG;

export async function runCmd(command: string, loadingMessage: string, options: CommandOptions, isDryRun: boolean): Promise<string> {
  let spinner: ora.Ora;

  if (loadingMessage && IS_DEBUG === false) {
    spinner = ora(loadingMessage).start();
  }

  return new Promise((resolve, reject) => {
    if (options && options.cwd) {
      debug(`cwd=${chalk.cyan(options.cwd)}`);
    }

    debugCli(chalk.cyan(command.replace(/\s+/g, " ")));

    if (isDryRun) {
      try {
        spinner?.succeed();
      } catch (error) {
        // don't catch errors here
      }
      return resolve("HEXA_DRY_RUN");
    }

    shell.exec(
      command,
      {
        ...options
      },
      (_code: number, stdout: string, stderr: string) => {
        if (stderr.length) {
          debug("stderr", chalk.red(stderr));
          // the Azure CLI uses stderr to output debug information,
          // we have to filter and check only for errors
          if (stderr.includes("ERROR")) {
            reject(
              `ERROR DETECTED:\n${stderr}\nPlease run the command with the --debug flag to output more details.\nIf the error persists, open an issue on https://github.com/manekinekko/hexa/issues/new/choose`
            );
          }
        }

        if (stdout.length) {
          debug("stdout", chalk.gray(stdout));
          resolve(stdout);
        }
        else {
          resolve("");
        }

        try {
          spinner?.succeed();
        } catch (error) {
          // don't catch errors here
          reject(error);
        }
      }
    );
  });
}

////////
export async function az<T>(command: string, loadingMessage?: string, output: "json" | "tsv" = `json`) {
  command = `${command} --output ${output} ` + (IS_DEBUG ? "--verbose" : "");
  let message: string = await runCmd(`az ${command}`, loadingMessage || '', {
    silent: !IS_DEBUG
  }, Boolean(process.env.HEXA_DRY_RUN));

  // guess if the output response is a JSON format
  if (message.startsWith("{") || message.startsWith("[")) {
    return JSON.parse(message || "{}") as T;
  } else {
    // for other output formats, ie. TSV
    message = message.trim();
    return ({ message } as unknown) as T;
  }
}

export async function kubectl(command: string, loadingMessage: string) {
  const message: string = await runCmd(`kubectl ${command}`, loadingMessage || '', {
    silent: !IS_DEBUG
  }, Boolean(process.env.HEXA_DRY_RUN));
  return message;
}

export async function func(command: string, cwd: string, loadingMessage: string) {
  if (!directoryExists(cwd)) {
    console.log(chalk.red(`✗ Folder ${chalk.cyan(cwd)} does not exists. Please create this folder and try again.`));
    process.exit(1);
  }

  const output: string = await runCmd(`func ${command}`, loadingMessage || '', {
    silent: !IS_DEBUG,
    cwd
  }, Boolean(process.env.HEXA_DRY_RUN));
  return output;
}

export async function npm(command: string, cwd: string, loadingMessage?: string) {
  const output: string = await runCmd(`npm ${command}`, loadingMessage || '', {
    silent: !IS_DEBUG,
    cwd
  }, Boolean(process.env.HEXA_DRY_RUN));
  return output;
}

export async function git(command: string, loadingMessage?: string, cwd?: string) {
  const output: string = await runCmd(`git ${command}`, loadingMessage || '', {
    silent: !IS_DEBUG,
    cwd
  }, false);
  return output;
}


////////

export function getCurrentDirectoryBase() {
  return path.basename(process.cwd());
}

export function directoryExists(filePath: string) {
  try {
    return fs.statSync(filePath).isDirectory();
  } catch (err) {
    return false;
  }
}

export function createDirectoryIfNotExists(filePath: string) {
  if (directoryExists(filePath) === false) {
    fs.mkdirSync(filePath);
    shell.mkdir("-p", filePath);
    debug(`created directory ${chalk.green(filePath)}`);
  } else {
    debug(`directory already created ${chalk.green(filePath)}`);
  }

  return true;
}

export function fileExists(filePath: string) {
  try {
    return fs.existsSync(filePath);
  } catch (err) {
    return false;
  }
}

export function readFileFromDisk(filePath: string) {
  debug(`reading file ${chalk.green(filePath)}`);

  if (fileExists(filePath)) {
    return fs.readFileSync(filePath).toString("utf-8");
  }

  debug(`file not found ${chalk.red(filePath)}`);
  return null;
}

export function saveWorkspace(config: Partial<HexaWorkspace>) {
  debug(`updating workspace with ${chalk.green(JSON.stringify(config))}`);

  if (!config || Object.keys(config).length === 0) {
    debug(`skipping saving workspace because config option is empty!`);
    return false;
  }

  if (config) {
    // we don't want to store IDs in the workspace file
    for (var key in config) {
      delete (config as any)[key].id;
      delete (config as any)[key].tags;
    }
  }

  let oldConfig = {};
  if (fileExists(WORKSPACE_FILENAME)) {
    oldConfig = JSON.parse(readFileFromDisk(WORKSPACE_FILENAME) || "{}") as HexaWorkspace;
  }

  config = merge(oldConfig, config);

  debug(`saving workspace with ${chalk.green(JSON.stringify(config))}`);
  fs.writeFileSync(WORKSPACE_FILENAME, JSON.stringify(config, null, 2));

  return true;
}

export function readWorkspace() {
  return JSON.parse(readFileFromDisk(WORKSPACE_FILENAME) || "{}") as HexaWorkspace;
}

export function readEnvFile() {
  debug(`reading env file`);

  let oldEnv = "";
  if (fileExists(ENV_FILENAME)) {
    oldEnv = readFileFromDisk(ENV_FILENAME) || "";
  }
  const buf = Buffer.from(oldEnv);
  return dotenv.parse(buf);
}

export function saveEnvFile(key: string, value: string) {
  debug(`saving env key ${chalk.green(key)}`);

  let oldEnv = "";
  if (fileExists(ENV_FILENAME)) {
    oldEnv = readFileFromDisk(ENV_FILENAME) || "";
  }
  const buf = Buffer.from(oldEnv);
  const env = dotenv.parse(buf);

  if (env[key]) {
    debug(`overriding env key ${chalk.green(key)}`);
  }

  env[key] = value;

  const envValues = [];
  for (let k in env) {
    envValues.push(`${k}="${env[k]}"`);
  }

  fs.writeFileSync(ENV_FILENAME, envValues.join("\n"));

  const gitIgnoreFilename = `.gitignore`;
  if (fileExists(gitIgnoreFilename)) {
    const gitIgnoreFileContent = readFileFromDisk(gitIgnoreFilename) || "";
    if (gitIgnoreFileContent.includes(".env")) {
      debug(`${ENV_FILENAME} file already in ${gitIgnoreFilename}`);
    } else {
      debug(`add ${ENV_FILENAME} to ${gitIgnoreFilename}`);
      fs.writeFileSync(ENV_FILENAME, [gitIgnoreFileContent, ENV_FILENAME].join("\n"));
    }
  } else {
    debug(`add ${ENV_FILENAME} to ${gitIgnoreFilename}`);
    fs.writeFileSync(gitIgnoreFilename, ENV_FILENAME);
  }
}

export function isProjectFileExists() {
  const isFound = fileExists(WORKSPACE_FILENAME);
  debug(`checking project file ${chalk.green(WORKSPACE_FILENAME)}. Found=${isFound}`);

  return isFound;
}

export function copyTemplate(src: string, destination: string, context?: { [key: string]: string }, options?: { overwrite?: boolean }) {
  const templateDir = getTemplateFullPath();
  src = path.join(templateDir, path.sep, src);
  debug(`copying template ${chalk.green(src)} to ${chalk.green(destination)}`);

  context = {
    ...context,
    date: new Date().toISOString()
  };

  let srcContent = readFileFromDisk(src) || "";
  for (let key in context) {
    srcContent = srcContent.replace(new RegExp(`{{(${key})}}`, "g"), context[key]);
  }

  debug(`copying template file src=${chalk.green(src)}, destination=${chalk.green(destination)}, context=${chalk.green(JSON.stringify(context))}, size=${chalk.green(srcContent.length + "")}`);
  if (options?.overwrite === true) {
    return fs.writeFileSync(destination, srcContent);
  } else {

    if (fileExists(destination)) {
      debug(`${chalk.green(destination)} already exists, skipping`);
      return false;
    }

    return fs.writeFileSync(destination, srcContent);
  }
}

export function getTemplateFullPath() {
  return getFullPath("../templates");
}

export function getFullPath(folder: string) {
  return joinPath(path.dirname(fs.realpathSync(__filename)), folder);
}

export function joinPath(...args: string[]) {
  return path.join(...args);
}

export function updateFile({ filepath, replace, search }: { filepath: string; replace: string; search?: string }) {
  let srcContent = readFileFromDisk(filepath) || "";

  if (search) {
    if (search === '*') {
      srcContent = replace;
    }
    else {
      srcContent = srcContent.replace(search, replace);
    }
  } else {
    srcContent = [srcContent, replace].join(`\n`);
  }

  debug(`updating file ${chalk.green(filepath)}`);
  return fs.writeFileSync(filepath, srcContent);
}

export function absolutePath(file: string) {
  return path.resolve(file);
}

export function deleteFile(file: string) {
  return fs.unlinkSync(file);
}

export async function getLocalGitUrl() {
  let gitUrl = await git(`config --get remote.origin.url`);

  return gitUrl
    .replace('git@github.com:', 'https://github.com/')
    .replace('.git', ' ')
    .trim();
}

export async function getLocalGitBranch() {
  // TODO: handle cases where we are not in a branch
  const gitBrranch = await git(`rev-parse --abbrev-ref HEAD`, undefined);
  return gitBrranch.trim();
}

export async function detectAzureStaticWebAppsOutputLocation(folder: string) {
  const frameworks = [
    { name: 'angular', dist: 'dist/{values(projects)[0].architect.build.options.outputPath}', files: ['angular.json'] },
    { name: 'angular-universal', dist: 'dist/{values(projects)[0].architect.build.options.outputPath}', files: ['angular.json', 'tsconfig.server.json'] },
    { name: 'aurelia', dist: 'dist', files: [] },
    { name: 'elm', dist: 'public', files: ['elm.json'] },
    { name: 'ember', dist: 'dist', files: ['ember-cli-build.js'] },
    { name: 'flutter', dist: 'build/web', files: ['.dart_tools'] },
    { name: 'gatsby', dist: 'public', files: ['gatsby-config.js'] },
    { name: 'glimmer', dist: 'dist', files: [] },
    { name: 'hugo', dist: 'public', files: ['archetypes', 'config.toml'] },
    { name: 'ionic-angular', dist: 'www', files: [] },
    { name: 'ionic-react', dist: 'build', files: [] },
    { name: 'knockoutjs', dist: 'dist', files: [] },
    { name: 'lit-element', dist: 'dist', files: [] },
    { name: 'marko', dist: 'public', files: [] },
    { name: 'meteor', dist: 'bundle', files: [] },
    { name: 'mithril', dist: 'dist', files: [] },
    { name: 'nextjs', dist: 'out', files: [] },
    { name: 'nuxtjs', dist: 'dist', files: [] },
    { name: 'nuxtjs', dist: 'dist', files: [] },
    { name: 'polymer', dist: 'build/default', files: [] },
    { name: 'preact', dist: 'build', files: [] },
    { name: 'react', dist: 'build', files: [] },
    { name: 'riot', dist: 'dist', files: [] },
    { name: 'scully', dist: 'dist/{values(projects)[0].architect.build.options.outputPath}', files: ['angular.json'] },
    { name: 'stencil', dist: 'www', files: [] },
    { name: 'svelte', dist: 'public', files: [] },
    { name: 'typescript', dist: 'dist', files: [] },
    { name: 'vue', dist: 'dist', files: [] },
    { name: 'vuepress', dist: 'dist', files: [] },
  ];

  for await (const filePath of traverseFolder(folder)) {
    for (const framework of frameworks) {
      const hasConfigFile = framework.files.includes(path.basename(filePath));
      if (hasConfigFile) {

        if (filePath.endsWith('.json') && framework.dist.includes('{')) {
          const startOfExpression = framework.dist.indexOf('{');
          const endOfExpression = framework.dist.indexOf('}');
          const expression = framework.dist.substring(startOfExpression + 1, endOfExpression);
          const jsonContentRaw = readFileFromDisk(filePath) || "{}";
          const jsonContent = JSON.parse(jsonContentRaw);
          const outputPath = jmespath.search(jsonContent, expression) || "./";

          debug(`detected ${framework.name} output location: ${chalk.green(outputPath)}`);
          return outputPath;
        }
        else {
          debug(`detected ${framework.name} output location: ${chalk.green(framework.dist)}`);
          return framework.dist;
        }

      }
    }
  }
  return "./";
}


/**
 * A utility function to recursively traverse a folder and returns its entries.
 * @param folder The folder to traverse.
 * @returns A Generator object that yields entry paths.
 * @example
 * ```
 * for await (const file of traverseFolder(folder)) {
 *    console.log(path):
 * }
 * ```
 */
export async function* traverseFolder(folder: string): AsyncGenerator<string> {
  const folders = (await readdir(folder, { withFileTypes: true })) as fs.Dirent[];
  for (const folderEntry of folders) {
    if (folderEntry.name.includes("node_modules")) {
      // WARNING: ignore node_modules to avoid perf hits!
      continue;
    }
    const entryPath = path.resolve(folder, folderEntry.name);
    if (folderEntry.isDirectory()) {
      yield* traverseFolder(entryPath);
    } else {
      yield entryPath;
    }
  }
}

export function IS_DEMO() {
  return process.env.DEMO_MODE === "hexa";
}
