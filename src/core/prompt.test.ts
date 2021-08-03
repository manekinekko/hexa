import * as promptModule from "./prompt";

jest.mock("inquirer");
const { expectPrompts } = require("inquirer");

describe.skip("prompt", () => {
  it("should chooseSubscription", () => {
    expectPrompts([
      {
        message: "Choose a subscription:",
        type: "list",
        choices: [
          {
            name: "test1",
            value: "AUTOMATIC",
            disabled: false,
          },
          {
            name: "test2",
            value: "AUTOMATIC",
            disabled: true,
          },
        ],
      },
    ]);

    promptModule.chooseSubscription([
      {
        id: "AUTOMATIC",
        name: "test1",
        state: "Enabled",
      },
      {
        id: "AUTOMATIC",
        name: "test2",
      },
    ]);
  });

  it("should chooseResourceGroup", () => {
    expectPrompts([
      {
        message: "Choose resource group:",
        type: "list",
        choices: [
          {
            name: "test1 (hexa)",
            value: "AUTOMATIC",
            short: "test1",
          },
          {
            name: "test2 ",
            value: "AUTOMATIC",
            short: "test2",
          },
        ],
      },
    ]);

    promptModule.chooseResourceGroup([
      {
        id: "AUTOMATIC",
        name: "test1",
        location: "test location",
        tags: {
          "x-created-by": "hexa",
        },
      },
      {
        id: "AUTOMATIC",
        name: "test2",
        location: "test location",
      },
    ]);
  });

  it("should chooseAccountStorage", () => {
    expectPrompts([
      {
        message: "Choose a storage account:",
        type: "list",
        choices: [
          {
            name: "test1",
            value: "AUTOMATIC",
          },
          {
            name: "test2",
            value: "AUTOMATIC",
          },
        ],
      },
    ]);

    promptModule.chooseAccountStorage([
      {
        id: "AUTOMATIC",
        name: "test1",
        location: "test location",
      },
      {
        id: "AUTOMATIC",
        name: "test2",
        location: "test location",
      },
    ]);
  });

  it("should askForFeatures", async () => {
    const choices = [{name: "feature1", short:'', value:''}, {name: "feature2", short:'', value:''}];
    expectPrompts([
      {
        message: "Choose features you want to setup:",
        type: "checkbox",
        choices,
      },
    ]);

    await promptModule.askForFeatures(choices);
  });

  it("should askForResourceGroupDetails", () => {
    expectPrompts([
      {
        message: "Enter a name for the resource group:",
        type: "input",
        default: "defaultResourceGroupName",
      },
      {
        message: "Choose a region:",
        type: "list",
        default: "defaultRegion",
        choices: [
          {
            name: "test (displayName)",
            value: "test",
            short: "displayName",
          },
        ],
      },
    ]);

    promptModule.askForResourceGroupDetails(
      [
        {
          id: "AUTOMATIC",
          name: "test",
          displayName: "displayName",
        },
      ],
      "defaultResourceGroupName",
      "defaultRegion"
    );
  });

  it("should askForStorageAccountDetails", () => {
    expectPrompts([
      {
        message: "Enter a name for the storage account:",
        type: "input",
        default: "defaultStorageName",
      },
    ]);

    promptModule.askForStorageAccountDetails(
      [
        {
          id: "AUTOMATIC",
          name: "test",
          displayName: "displayName",
        },
      ],
      "defaultStorageName"
    );
  });

  it("should askForDatabaseDetails", () => {
    expectPrompts([
      {
        message: "Enter a name for the database:",
        type: "input",
        default: "defaultDatabaseName",
      },
      {
        message: "Choose a database type:",
        type: "list",
        default: 0,
        choices: [
          {
            name: `Azure Table Storage`,
            value: "TABLE_STORAGE",
            short: `Table Storage`,
          },
          {
            name: `Azure Cosmos DB`,
            value: "COSMOSDB",
            short: `CosmosDB`,
          },
        ],
      },
    ]);

    promptModule.askForDatabaseDetails("defaultDatabaseName");
  });

  it("should askForProjectDetails", async () => {
    expectPrompts([
      {
        message: "Enter the project's name:",
        type: "input",
        default: "defaultProjectName",
      },
    ]);

    await promptModule.askForProjectDetails("defaultProjectName");
  });

  it("should askIfOverrideProjectFile", async () => {
    expectPrompts([
      {
        type: "confirm",
        name: "override",
        message: "Configuration file found. Do you want to override it? false",
        default: false,
      },
    ]);

    await promptModule.askIfOverrideProjectFile();
  });

  it("should askForHostingFolder", async () => {
    expectPrompts([
      {
        type: "input",
        name: "folder",
        message: "Enter public folder (will be created if not present):",
        default: "defaultPublicFolderName",
      },
    ]);

    await promptModule.askForHostingFolder("defaultPublicFolderName");
  });

  it("should askForFunctionsAppFolder", async () => {
    expectPrompts([
      {
        type: "input",
        name: "folder",
        message: "Choose the functions folder (will be created if not present):",
        default: "functions",
      },
    ]);

    await promptModule.askForFunctionsAppFolder();
  });

  it("should askForFunctionNameFolder", async () => {
    const functionFolderName = "functionFolderName";
    expectPrompts([
      {
        type: "confirm",
        name: "override",
        message: `Function ${functionFolderName} found. Do you want to override it?`,
        default: false,
      },
    ]);

    await promptModule.askForFunctionNameFolder(functionFolderName);
  });

  it("should askForKubernetesClusterDetails", async () => {
    const defaultClusterName = "defaultClusterName";
    expectPrompts([
      {
        type: "input",
        name: "name",
        message: "Enter a name for the Kubernetes cluster:",
        default: defaultClusterName,
      },
    ]);

    await promptModule.askForKubernetesClusterDetails(defaultClusterName);
  });

  it("should chooseKubernetesCluster", async () => {
    await promptModule.chooseKubernetesCluster([
      {
        name: "Cluster name",
        id: "AUTOMATIC",
        hostname: "hostname",
        nodeResourceGroup: "nodeResourceGroup",
        publicIp: {
          id: "AUTOMATIC",
          name: "name",
          ip: "publicIp id",
          dns: {
            domainNameLabel: "domainNameLabel",
            fqdn: "fqdn",
          },
        },
      },
    ]);

    expectPrompts([
      {
        message: "Choose a cluster:",
        type: "list",
        choices: [
          {
            name: "Cluster name",
            value: "AUTOMATIC",
          },
        ],
      },
    ]);
  });

  it("should chooseAcrAccount", async () => {
    expectPrompts([
      {
        message: "Choose a container registry:",
        type: "list",
        choices: [
          {
            name: "Name 2",
            value: "AUTOMATIC",
          },
          {
            name: "Name 1",
            value: "AUTOMATIC",
          },
        ],
      },
    ]);

    await promptModule.chooseAcrAccount([
      {
        name: "Name 1",
        id: "AUTOMATIC",
        hostname: "hostname",
      },
      {
        name: "Name 2",
        id: "AUTOMATIC",
        hostname: "hostname",
        tags: {
          "x-created-by": "hexa",
        },
      },
    ]);
  });
});
