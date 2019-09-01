"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
function getCurrentDirectoryBase() {
    return path_1.default.basename(process.cwd());
}
exports.getCurrentDirectoryBase = getCurrentDirectoryBase;
function directoryExists(filePath) {
    try {
        return fs_1.default.statSync(filePath).isDirectory();
    }
    catch (err) {
        return false;
    }
}
exports.directoryExists = directoryExists;
function saveProjectConfigToDisk(config) {
    fs_1.default.writeFileSync("nitro.json", JSON.stringify(config, null, 2));
}
exports.saveProjectConfigToDisk = saveProjectConfigToDisk;
function isProjectFileExists() {
    return fs_1.default.existsSync("nitro.json");
}
exports.isProjectFileExists = isProjectFileExists;
