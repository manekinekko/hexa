import fs from "fs";
import path from "path";
const shell = require("shelljs");
const ora = require("ora");

export const WORKSPACE_FILENAME = "nitro.json";

export async function runCmd(command: string, loadingMessage?: string): Promise<string> {
  let spinner: typeof ora = null;
  if (loadingMessage) {
    spinner = ora(loadingMessage).start();
  }

  return new Promise((resolve, _reject) => {
    const { stdout } = shell.exec(`${command} --output json`, {
      silent: true,
      async: true
    });
    stdout.on("data", (data: string) => {
      resolve(data);

      if (spinner) {
        spinner.stop();
      }
    });
  });
}

export async function az(command: string, loadingMessage?: string) {
  return await runCmd(`az ${command}`, loadingMessage);
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

export function saveProjectConfigToDisk(config: object) {
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
