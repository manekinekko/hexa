"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = __importDefault(require("fs"));
var path_1 = __importDefault(require("path"));
var shell = require("shelljs");
exports.WORKSPACE_FILENAME = "nitro.json";
function runCmd(command) {
    var stdout = shell.exec(command + " --output json", {
        silent: true
    }).stdout;
    return stdout;
}
exports.runCmd = runCmd;
function az(command) {
    return runCmd("az " + command);
}
exports.az = az;
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
function createDirectoryIfNotExists(filePath) {
    if (directoryExists(filePath) === false) {
        fs_1.default.mkdirSync(filePath);
    }
    return true;
}
exports.createDirectoryIfNotExists = createDirectoryIfNotExists;
function fileExists(filePath) {
    try {
        return fs_1.default.existsSync(filePath);
    }
    catch (err) {
        return false;
    }
}
exports.fileExists = fileExists;
function readFileFromDisk(filePath) {
    if (fileExists(filePath)) {
        return fs_1.default.readFileSync(filePath).toString("utf-8");
    }
    return null;
}
exports.readFileFromDisk = readFileFromDisk;
function saveWorkspace(config) {
    var oldConfig = {};
    if (fileExists(exports.WORKSPACE_FILENAME)) {
        oldConfig = JSON.parse(readFileFromDisk(exports.WORKSPACE_FILENAME) || "{}");
    }
    fs_1.default.writeFileSync(exports.WORKSPACE_FILENAME, JSON.stringify(__assign(__assign({}, oldConfig), config), null, 2));
}
exports.saveWorkspace = saveWorkspace;
function isProjectFileExists() {
    return fileExists(exports.WORKSPACE_FILENAME);
}
exports.isProjectFileExists = isProjectFileExists;
