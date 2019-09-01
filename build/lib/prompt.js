"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var inquirer_1 = __importDefault(require("inquirer"));
var utils_1 = require("./utils");
function chooseSubscription(subscriptionsList) {
    var questions = [
        {
            type: "list",
            name: "subscription",
            message: "Choose your subscription:",
            choices: subscriptionsList.map(function (sub) {
                return {
                    name: "" + sub.name,
                    disabled: sub.state !== "Enabled"
                };
            }),
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
exports.chooseSubscription = chooseSubscription;
function askForFeatures() {
    var questions = [
        {
            type: "checkbox",
            name: "features",
            message: "Choose the features you want to enable",
            choices: [
                {
                    name: "storage",
                    checked: true,
                    required: true
                },
                {
                    name: "hosting"
                },
                {
                    name: "functions (coming soon)",
                    disabled: true
                },
                {
                    name: "database (coming soon)",
                    disabled: true
                },
                {
                    name: "cdn (coming soon)",
                    disabled: true
                },
                {
                    name: "auth (coming soon)",
                    disabled: true
                }
            ],
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
    var questions = [
        {
            type: "input",
            name: "name",
            message: "Enter a name for the project:",
            default: utils_1.getCurrentDirectoryBase(),
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
            message: "Configuration file found. Do you want to override it?",
            default: false
        }
    ];
    return inquirer_1.default.prompt(questions);
}
exports.askIfOverrideProjectFile = askIfOverrideProjectFile;
