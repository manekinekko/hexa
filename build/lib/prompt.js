"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var inquirer_1 = __importDefault(require("inquirer"));
var files_1 = require("./files");
function askForFeatures() {
    var questions = [
        {
            type: "checkbox",
            name: "features",
            message: "Choose the features you want to enable",
            choices: [{
                    name: "hosting",
                    checked: true
                }],
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please choose at least one feature.";
                }
            }
        }
    ];
    return inquirer_1.default.prompt(questions);
}
exports.askForFeatures = askForFeatures;
function askForProjectDetails() {
    var argv = require("minimist")(process.argv.slice(2));
    var questions = [
        {
            type: "input",
            name: "name",
            message: "Enter a name for the project:",
            default: argv._[0] || files_1.getCurrentDirectoryBase(),
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please enter a name for the project.";
                }
            }
        }
    ];
    return inquirer_1.default.prompt(questions);
}
exports.askForProjectDetails = askForProjectDetails;
function askIfOverrideProjectFile() {
    var questions = [
        {
            type: "confirm",
            name: "override",
            message: "nitro.json found. Do you want to override it?",
            default: false
        }
    ];
    return inquirer_1.default.prompt(questions);
}
exports.askIfOverrideProjectFile = askIfOverrideProjectFile;
