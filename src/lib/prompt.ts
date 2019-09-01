import inquirer, { Answers, QuestionCollection } from "inquirer";
import { getCurrentDirectoryBase } from "./utils";
const uuid = require("uuid");
export function chooseSubscription(subscriptionsList: AzureSubscription[]): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "list",
      name: "subscription",
      message: "Choose your subscription:",
      choices: subscriptionsList.map((subscription: AzureSubscription) => {
        return {
          name: `${subscription.name}`,
          disabled: subscription.state !== "Enabled",
          value: subscription.id
        };
      }),
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please choose a subscription.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function chooseResourceGroup(resourceGroups: AzureResourceGroup[]): Promise<Answers> {
  const extraChoice: AzureResourceGroup = {
    id: "",
    location: "",
    name: "<Create a new resource group>"
  };
  const questions: QuestionCollection = [
    {
      type: "list",
      name: "resourceGroup",
      message: "Choose your resource group:",
      choices: [...[extraChoice], ...resourceGroups].map((resourceGroup: AzureResourceGroup) => {
        return {
          name: `${resourceGroup.name}`,
          value: resourceGroup.id
        };
      }),
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a resource group.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function chooseAccountStorageName(): Promise<inquirer.Answers> {
    const questions: QuestionCollection = [
      {
        type: "input",
        name: "name",
        message: "Enter your storage account name:",
        validate: function(value: string) {
          if (value.length) {
            return true;
          } else {
            return "Please enter a valid name.";
          }
        }
      }
    ];
    return inquirer.prompt(questions); 
}

export function askForFeatures(): Promise<Answers> {
  const questions: QuestionCollection = [
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
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please choose at least one feature.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function askForResourceGroupDetails(regions: AzureRegion[]): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "resource",
      message: "Enter a name for the resource group:",
      default: `nitro-${uuid()}`,
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a name for the resource group.";
        }
      }
    },
    {
      type: "list",
      name: "region",
      message: "Choose a region:",
      choices: regions.map((region: AzureRegion) => {
        return {
          name: `${region.name} (${region.displayName})`,
          value: region.name,
          short: region.displayName
        };
      }),
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please choose a region.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}
export function askForProjectDetails(): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "name",
      message: "Enter a name for the project:",
      default: getCurrentDirectoryBase(),
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a name for the project.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function askIfOverrideProjectFile(): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "confirm",
      name: "override",
      message: "Configuration file found. Do you want to override it?",
      default: false
    }
  ];

  return inquirer.prompt(questions);
}
