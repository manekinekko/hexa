import fs from "fs";
import path from "path";

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

export function saveProjectConfigToDisk(config: object) {
  fs.writeFileSync("nitro.json", JSON.stringify(config, null, 2));
}

export function isProjectFileExists() {
  return fs.existsSync("nitro.json");
}