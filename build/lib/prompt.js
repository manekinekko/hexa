"use strict";
var __spreadArrays = (this && this.__spreadArrays) || function () {
    for (var s = 0, i = 0, il = arguments.length; i < il; i++) s += arguments[i].length;
    for (var r = Array(s), k = 0, i = 0; i < il; i++)
        for (var a = arguments[i], j = 0, jl = a.length; j < jl; j++, k++)
            r[k] = a[j];
    return r;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
var inquirer_1 = __importDefault(require("inquirer"));
var utils_1 = require("./utils");
var uuid = require("uuid");
function chooseSubscription(subscriptionsList) {
    var questions = [
        {
            type: "list",
            name: "subscription",
            message: "Choose your subscription:",
            choices: subscriptionsList.map(function (subscription) {
                return {
                    name: "" + subscription.name,
                    disabled: subscription.state !== "Enabled",
                    value: subscription.id
                };
            }),
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please choose a subscription.";
                }
            }
        }
    ];
    return inquirer_1.default.prompt(questions);
}
exports.chooseSubscription = chooseSubscription;
function chooseResourceGroup(resourceGroups) {
    var extraChoice = {
        id: "",
        location: "",
        name: "<Create a new resource group>"
    };
    var questions = [
        {
            type: "list",
            name: "resourceGroup",
            message: "Choose your resource group:",
            choices: __spreadArrays([extraChoice], resourceGroups).map(function (resourceGroup) {
                return {
                    name: "" + resourceGroup.name,
                    value: resourceGroup.id
                };
            }),
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please enter a resource group.";
                }
            }
        }
    ];
    return inquirer_1.default.prompt(questions);
}
exports.chooseResourceGroup = chooseResourceGroup;
function chooseAccountStorageName() {
    var questions = [
        {
            type: "input",
            name: "name",
            message: "Enter your storage account name:",
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please enter a valid name.";
                }
            }
        }
    ];
    return inquirer_1.default.prompt(questions);
}
exports.chooseAccountStorageName = chooseAccountStorageName;
function askForFeatures() {
    var questions = [
        {
            type: "checkbox",
            name: "features",
            message: "Choose the features you want to enable",
            choices: [
                {
                    name: "storage",
                    checked: true
                },
                {
                    name: "hosting"
                },
                {
                    name: "functions (coming soon)"
                },
                {
                    name: "database (coming soon)"
                },
                {
                    name: "cdn (coming soon)"
                },
                {
                    name: "auth (coming soon)"
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
function askForResourceGroupDetails(regions) {
    var questions = [
        {
            type: "input",
            name: "resource",
            message: "Enter a name for the resource group:",
            default: "nitro-" + uuid(),
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please enter a name for the resource group.";
                }
            }
        },
        {
            type: "list",
            name: "region",
            message: "Choose a region:",
            choices: regions.map(function (region) {
                return {
                    name: region.name + " (" + region.displayName + ")",
                    value: region.name,
                    short: region.displayName
                };
            }),
            validate: function (value) {
                if (value.length) {
                    return true;
                }
                else {
                    return "Please choose a region.";
                }
            }
        }
    ];
    return inquirer_1.default.prompt(questions);
}
exports.askForResourceGroupDetails = askForResourceGroupDetails;
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
