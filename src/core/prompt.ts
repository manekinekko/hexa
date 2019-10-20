import inquirer, { Answers, QuestionCollection } from "inquirer";
import { createDirectoryIfNotExists, fileExists, getCurrentDirectoryBase } from "./utils";

export function chooseSubscription(subscriptionsList: AzureSubscription[]): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "list",
      name: "subscription",
      message: "Choose a subscription:",
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
  // move resource groups created with Hexa to the top
  resourceGroups = resourceGroups.sort((a, b) => (a.tags && a.tags["x-created-by"] === "hexa" ? -1 : 1));

  if (process.env.HEXA_ENABLE_ADDING_NEW_RESOURCE) {
    resourceGroups = [
      ...resourceGroups,
      {
        id: "MANUAL",
        location: "",
        tags: {},
        name: "<Create a Resource Group>"
      }
    ];
  }
  const questions: QuestionCollection = [
    {
      type: "list",
      name: "resourceGroup",
      message: "Choose resource group:",
      choices: resourceGroups.map((resourceGroup: AzureResourceGroup) => {
        return {
          suffix: resourceGroup.tags && resourceGroup.tags["x-created-by"],
          name: resourceGroup.name,
          value: resourceGroup.id,
          short: resourceGroup.name
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

export function chooseAccountStorage(storageAccounts: AzureStorage[]): Promise<inquirer.Answers> {
  // move storage accounts created with Hexa to the top
  storageAccounts = storageAccounts.sort((a, b) => (a.tags && a.tags["x-created-by"] === "hexa" ? -1 : 1));

  if (process.env.HEXA_ENABLE_ADDING_NEW_RESOURCE) {
    storageAccounts = [
      ...storageAccounts,
      {
        id: "MANUAL",
        tags: {},
        name: "<Create Storage Account>"
      }
    ];
  }
  const questions: QuestionCollection = [
    {
      type: "list",
      name: "storage",
      message: "Choose a storage account:",
      choices: storageAccounts.map((storageAccount: AzureStorage) => {
        return {
          name: storageAccount.name,
          value: storageAccount.id
        };
      }),
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a storage account.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}
export function askForFeatures(features: any[]): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "checkbox",
      name: "features",
      message: "Choose features you want to setup:",
      choices: features,
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

export function askForResourceGroupDetails(
  regions: AzureRegion[],
  defaultResourceGroupName: string,
  defaultRegion: string
): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "name",
      message: "Enter a name for the resource group:",
      default: defaultResourceGroupName,
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
      default: defaultRegion,
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
export function askForStorageAccountDetails(regions: AzureRegion[], defaultStorageName: string): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "name",
      message: "Enter a name for the storage account:",
      default: defaultStorageName,
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a name for the storage account.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function askForDatabaseDetails(defaultDatabaseName: string): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "databaseName",
      message: "Enter a name for the database:",
      default: defaultDatabaseName,
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a name for the database.";
        }
      }
    },
    {
      type: "list",
      name: "databaseType",
      message: "Choose a database type:",
      default: 0,
      choices: [
        {
          name: `Azure Table Storage`,
          value: "TABLE_STORAGE",
          short: `Table Storage`
        },
        {
          name: `Azure Cosmos DB`,
          value: "COSMOSDB",
          short: `CosmosDB`
        }
      ],
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please choose a Database type.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function askForProjectDetails(defaultProjectName: string): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "name",
      message: "Enter a name for the project:",
      default: defaultProjectName,
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

export function askForHostingFolder(defaultPublicFolderName: string): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "folder",
      message: "Enter public folder (will be created if not present):",
      default: defaultPublicFolderName,
      validate: function(value: string) {
        if (value && value.length) {
          return createDirectoryIfNotExists(value);
        } else {
          return "Please enter a public folder.";
        }
      }
    },
    {
      type: "confirm",
      name: "overrideHtml",
      message: ({ folder }) => `Override ${folder}/index.html?`,
      when: ({ folder }) => fileExists(`${folder}/index.html`)
    },
    {
      type: "confirm",
      name: "override404",
      message: ({ folder }) => `Override ${folder}/404.html?`,
      when: ({ folder }) => fileExists(`${folder}/404.html`)
    },
    {
      type: "confirm",
      name: "overrideError",
      message: ({ folder }) => `Override ${folder}/error.html?`,
      when: ({ folder }) => fileExists(`${folder}/error.html`)
    }
  ];
  return inquirer.prompt(questions);
}

export function askForFunctionsAppFolder(): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "folder",
      message: "Choose the functions folder (will be created if not present):",
      default: "functions",
      validate: function(value: string) {
        if (value && value.length) {
          return createDirectoryIfNotExists(value);
        } else {
          return "Please enter a folder for your Functions.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function askForFunctionNameFolder(functionFolderName: string): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "confirm",
      name: "override",
      message: `Function ${functionFolderName} found. Do you want to override it?`,
      default: false
    }
  ];

  return inquirer.prompt(questions);
}
