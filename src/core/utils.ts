import chalk from "chalk";
import fs from "fs";
import path from "path";
const shell = require("shelljs");
const ora = require("ora");
const Configstore = require("configstore");
const dotenv = require("dotenv");
const packageJson = require("../../package.json");
const debug = require("debug")(`nitro`);

const crypto = require("crypto");
export const uuid = () =>
  crypto
    .randomBytes(16)
    .toString("hex")
    .substr(0, 8);

export const sanitize = (name: string) => name.replace(/[\W_]+/gim, "").trim();

export const Config = new Configstore(packageJson.name, {
  version: packageJson.version
});
export const WORKSPACE_FILENAME = "nitro.json";
export const ENV_FILENAME = ".env";

const IS_DEBUG = !!process.env.DEBUG;

export async function runCmd(command: string, loadingMessage?: string, options?: CommandOptions): Promise<string> {
  let spinner: typeof ora = null;

  if (loadingMessage && IS_DEBUG === false) {
    spinner = ora(loadingMessage).start();
  }

  return new Promise((resolve, reject) => {
    command = `${command} --output json ` + (IS_DEBUG ? "--verbose" : "");

    debug(command);

    shell.exec(
      command,
      {
        ...options
      },
      (code: number, stdout: string, stderr: string) => {
        if (stderr.length) {
          debug("stderr", stderr);
          // the Azure CLI uses stderr to output debug information,
          // we have to filter and check only for errors
          if (stderr.includes("ERROR")) {
            reject(stderr);
          }
        }
        if (stdout.length) {
          debug("stdout", stdout);
          resolve(stdout);
        }
        try {
          spinner.stop();
        } catch (error) {}
      }
    );
  });
}

export async function az<T>(command: string, loadingMessage?: string) {
  const output: string = await runCmd(`az ${command}`, loadingMessage, {
    silent: !IS_DEBUG
  });
  return JSON.parse(output || "{}") as T;
}

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

export function saveWorkspace(config: object) {
  let oldConfig = {};
  if (fileExists(WORKSPACE_FILENAME)) {
    oldConfig = JSON.parse(readFileFromDisk(WORKSPACE_FILENAME) || "{}");
  }
  config = Object.assign(config, oldConfig);

  debug(`saving workspace with keys: ${chalk.green(Object.keys(config).join(", "))}`);
  fs.writeFileSync(WORKSPACE_FILENAME, JSON.stringify(config, null, 2));
}

export function readWorkspace() {
  return JSON.parse(readFileFromDisk(WORKSPACE_FILENAME) || "{}");
}

export function saveEnvFile(key: string, value: string) {
  debug(`saving env key ${chalk.green(key)}`);

  let oldEnv = "";
  if (fileExists(WORKSPACE_FILENAME)) {
    oldEnv = readFileFromDisk(WORKSPACE_FILENAME) || "";
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
}

export function isProjectFileExists() {
  const isFound = fileExists(WORKSPACE_FILENAME);
  debug(`checking project file ${chalk.green(WORKSPACE_FILENAME)}. Found=${isFound}`);

  return isFound;
}

export function copyTemplate(src: string, destination: string) {
  const templateDir = getTemplateFullPath();
  src = templateDir + "/" + src;

  debug(`copying template file src=${chalk.green(src)}, destination=${chalk.green(destination)}`);
  return fs.copyFileSync(src, destination);
}

export function getTemplateFullPath() {
  return path.join(path.dirname(fs.realpathSync(__filename)), "../templates");
}
