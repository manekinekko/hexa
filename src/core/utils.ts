import fs from "fs";
import path from "path";
const shell = require("shelljs");
const ora = require("ora");
const Configstore = require("configstore");
const packageJson = require("../../package.json");
const debug = require("debug")("nitro");

export const Config = new Configstore(packageJson.name, {
  version: packageJson.version
});
export const WORKSPACE_FILENAME = "nitro.json";

export async function runCmd(command: string, loadingMessage?: string, options?: CommandOptions): Promise<string> {
  let spinner: typeof ora = null;
  if (loadingMessage && debug.enabled === false) {
    spinner = ora(loadingMessage).start();
  }

  return new Promise((resolve, reject) => {
    command = `${command} --output json ` + (debug.enabled ? "--verbose" : "");

    debug(command);

    shell.exec(
      command,
      {
        ...options
      },
      (code: number, stdout: string, stderr: string) => {
        if (stderr.length) {
          debug("stderr", stderr);
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
    silent: !debug.enabled
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
  if (fileExists(filePath)) {
    return fs.readFileSync(filePath).toString("utf-8");
  }
  return null;
}

export function saveWorkspace(config: object) {
  let oldConfig = {};
  if (fileExists(WORKSPACE_FILENAME)) {
    oldConfig = JSON.parse(readFileFromDisk(WORKSPACE_FILENAME) || "{}");
  }
  fs.writeFileSync(
    WORKSPACE_FILENAME,
    JSON.stringify(
      {
        ...oldConfig,
        ...config
      },
      null,
      2
    )
  );
}

export function isProjectFileExists() {
  return fileExists(WORKSPACE_FILENAME);
}
