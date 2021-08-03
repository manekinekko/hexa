import inquirer, { Answers, InputQuestionOptions, QuestionCollection } from "inquirer";
import { createDirectoryIfNotExists, FEATURES } from "./utils";

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
      validate: function (value: string) {
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
  resourceGroups = resourceGroups.sort((a, _b) => (a.tags && a.tags["x-created-by"] === "hexa" ? -1 : 1));

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
        const isCreatedByHexa = resourceGroup.tags && resourceGroup.tags["x-created-by"] === "hexa";
        return {
          name: `${resourceGroup.name} ${isCreatedByHexa ? "(hexa)" : ""}`,
          value: resourceGroup.id,
          short: resourceGroup.name
        };
      }),
      validate: function (value: string) {
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
  storageAccounts = storageAccounts.sort((a, _b) => (a.tags && a.tags["x-created-by"] === "hexa" ? -1 : 1));

  if (process.env.HEXA_ENABLE_ADDING_NEW_RESOURCE) {
    storageAccounts = [
      ...storageAccounts,
      {
        id: "MANUAL",
        tags: {},
        location: "",
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
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please choose a storage account.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function askForFeatures(features: typeof FEATURES): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "checkbox",
      name: "features",
      message: "Choose features you want to setup:",
      choices: features,
      validate: function (value: string) {
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

export function askForResourceGroupDetails(regions: AzureRegion[], defaultResourceGroupName: string, defaultRegion: string): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "name",
      message: "Enter a name for the resource group:",
      default: defaultResourceGroupName,
      validate: function (value: string) {
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
      validate: function (value: string) {
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
export function askForStorageAccountDetails(_regions: AzureRegion[], defaultStorageName: string): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "name",
      message: "Enter a name for the storage account:",
      default: defaultStorageName,
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a name for the storage account.";
        }
      }
    },
  ];
  return inquirer.prompt(questions);
}

export async function askForAzureStaticWebAppsProjectDetails(defaultGitBranch: string, defaultGitUrl: string, outputLocation: string, gitHubToken: string): Promise<Answers> {

  const gitUrl: InputQuestionOptions = {
    type: "input",
    name: "gitUrl",
    message: "Enter the URL of your GitHub project:",
    validate: function (value: string) {
      if (value.length) {
        return true;
      }
      else {
        return "Please enter an existing GitHub URL of your project";
      }
    }
  };

  if (defaultGitUrl) {
    gitUrl.default = defaultGitUrl;
  }

  const questions: QuestionCollection = [
    gitUrl,
    {
      type: "input",
      name: "gitBranch",
      message: "Enter branch's name to deploy:",
      default: defaultGitBranch,
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a name of the git branch to deploy.";
        }
      }
    },
    {
      type: "input",
      name: "gitHubToken",
      message: "Enter your GitHub Personal Access Token (https://github.com/settings/tokens):",
      default: gitHubToken,
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter your GitHub Personal Access Token.";
        }
      }
    },
    {
      type: "input",
      name: "appLocation",
      message: "Enter the folder your application code.:",
      default: '/',
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter the folder of your application code.";
        }
      }
    },
    {
      type: "input",
      name: "outputLocation",
      message: "Enter the folder of the build output directory to deploy:",
      default: outputLocation,
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter the folder of the build output directory to deploy.";
        }
      }
    },
    {
      type: "input",
      name: "apiLocation",
      message: "Enter the folder of your Azure Functions code (optional):",
      default: 'api',
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter the folder of your Azure Functions code.";
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
      validate: function (value: string) {
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
      validate: function (value: string) {
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
      message: "Enter the project's name:",
      default: defaultProjectName,
      validate: function (value: string) {
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

  const forceDelete = !!process.env.HEXA_RESET_MODE;
  let deletionWarning = "(File will be deleted)";

  const questions: QuestionCollection = [
    {
      type: "confirm",
      name: "override",
      message: `Configuration file found. Do you want to override it? ${forceDelete && deletionWarning}`,
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
      validate: function (value: string) {
        if (value && value.length) {
          return createDirectoryIfNotExists(value);
        } else {
          return "Please enter a public folder.";
        }
      }
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
      validate: function (value: string) {
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

export function askForKubernetesClusterDetails(defaultClusterName: string): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "name",
      message: "Enter a name for the Kubernetes cluster:",
      default: defaultClusterName,
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a name for the Kubernetes cluster.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function chooseKubernetesCluster(kubernetesClusters: AzureKubernetesCluster[]): Promise<inquirer.Answers> {
  // move clusters created with Hexa to the top
  kubernetesClusters = kubernetesClusters.sort((a, _b) => (a.tags && a.tags["x-created-by"] === "hexa" ? -1 : 1));

  if (process.env.HEXA_ENABLE_ADDING_NEW_RESOURCE) {
    kubernetesClusters = [
      ...kubernetesClusters,
      {
        id: "MANUAL",
        tags: {},
        hostname: "",
        publicIp: {} as any,
        nodeResourceGroup: "",
        name: "<Create a Kubernetes Cluster>"
      }
    ];
  }
  const questions: QuestionCollection = [
    {
      type: "list",
      name: "cluster",
      message: "Choose a cluster:",
      choices: kubernetesClusters.map((cluster: AzureKubernetesCluster) => {
        return {
          name: cluster.name,
          value: cluster.id
        };
      }),
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please choose a cluster.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function chooseAcrAccount(AcrList: AzureContainerRegistry[]): Promise<inquirer.Answers> {
  // move ACR accounts created with Hexa to the top
  AcrList = AcrList.sort((a, _b) => (a.tags && a.tags["x-created-by"] === "hexa" ? -1 : 1));

  if (process.env.HEXA_ENABLE_ADDING_NEW_RESOURCE) {
    AcrList = [
      ...AcrList,
      {
        id: "MANUAL",
        tags: {},
        hostname: "",
        name: "<Create a Container Registry>"
      }
    ];
  }
  const questions: QuestionCollection = [
    {
      type: "list",
      name: "registry",
      message: "Choose a container registry:",
      choices: AcrList.map((cluster: AzureContainerRegistry) => {
        return {
          name: cluster.name,
          value: cluster.id
        };
      }),
      validate: function (value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please choose a container registry.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}
