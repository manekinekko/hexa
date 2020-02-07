import chalk from "chalk";
import { az, Config, sanitize, saveWorkspace, uuid, readWorkspace } from "../../core/utils";
import { askForDatabaseDetails } from "../../core/prompt";
const debug = require("debug")("database");

const buildTableStorageDatabaseEndpoint = (storage: AzureStorage, databaseName: string) => `https://${storage.name}.table.core.windows.net/${databaseName}`;

module.exports = async function() {
  const workspace = readWorkspace();
  const project: AzureResourceGroup = workspace.project;
  debug(`using project ${chalk.green(project.name)}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${chalk.green(subscription.name)}`);

  const storage: AzureStorage = workspace.storage;
  debug(`using storage ${chalk.green(storage.name)}`);

  let databaseName = `${sanitize(project.name)}`;
  let creationMode = process.env.HEXA_AUTO_MODE ? "AUTOMATIC" : "MANUAL";

  let databaseType: DatabaseInstance["kind"] = "TABLE_STORAGE";
  if (creationMode === "MANUAL") {
    ({ databaseName, databaseType } = await askForDatabaseDetails(databaseName));
  }

  let databaseInstance: DatabaseInstance | undefined;
  let databaseEndpoint = null;

  if (databaseType === "TABLE_STORAGE") {
    // https://docs.microsoft.com/en-us/cli/azure/storage/table?view=azure-cli-latest#az-storage-table-list
    const databasesInstancesList = await az<DatabaseInstance[]>(
      `storage table list --account-name "${storage.name}" --subscription "${subscription.id}" --query "[].{name: name}"`,
      `Checking Table Storage instances for Storage Account ${chalk.cyan(storage.name)}...`
    );

    if (databasesInstancesList.length) {
      databaseInstance = databasesInstancesList[0];
      databaseInstance.endpoint = buildTableStorageDatabaseEndpoint(storage, databaseName);
      debug(`using table storage instance ${chalk.green(databaseInstance.name)}`);
    } else {
      // https://docs.microsoft.com/en-us/cli/azure/storage/table?view=azure-cli-latest#az-storage-table-create
      databaseInstance = await az<DatabaseInstance>(
        `storage table create --name ${databaseName} --account-name ${storage.name} --query "{created: created}"`,
        `Setting up Table Storage ${chalk.cyan(databaseName)}...`
      );

      if (databaseInstance.created) {
        debug(`created table storage instance ${chalk.green(databaseInstance.name)}`);
        // the creation API does not return the database name and endpoint. Set them manually!
        databaseInstance.endpoint = buildTableStorageDatabaseEndpoint(storage, databaseName);
        databaseInstance.name = databaseName;
      } else {
        debug(`table storage instance ${chalk.green(databaseInstance.name)} failed!`);
        console.log(chalk.red(`✗ Database instance ${chalk.cyan(databaseInstance.name)} (Kind=TableStorage) could not be created.`));
        console.log(chalk.red(`✗ Please enable the --debug option and retry again (${chalk.cyan("hexa init --debug")}).`));
        console.log(chalk.red(`✗ If the issue persist, please open an issue on Github.`));
        process.exit(1);
      }
    }
  } else if (databaseType === "COSMOSDB") {
    // https://docs.microsoft.com/en-us/cli/azure/cosmosdb?view=azure-cli-latest#az-cosmosdb-list
    const databasesInstancesList = await az<DatabaseInstance[]>(
      `cosmosdb list --resource-group "${project.name}" --subscription "${subscription.id}" --query "[].{id: id, name: name, tags: tags, documentEndpoint: documentEndpoint}"`,
      `Checking CosmosDB instances for resource group ${chalk.cyan(project.name)}...`
    );

    if (databasesInstancesList.length) {
      databaseInstance = databasesInstancesList[0];
      debug(`using cosmosdb instance ${chalk.green(databaseInstance.name)}`);
    } else {
      // https://docs.microsoft.com/en-us/cli/azure/cosmosdb?view=azure-cli-latest#az-cosmosdb-create
      databaseInstance = await az<DatabaseInstance>(
        `cosmosdb create --name ${databaseName} --resource-group ${project.name} --tag 'x-created-by=hexa' --query "{id: id, name: name, tags: tags, endpoint: documentEndpoint}"`,
        `Setting up CosmosDB instance ${chalk.cyan(databaseName)} (this may take up to 5 minutes)...`
      );
      debug(`created cosmosdb instance ${chalk.green(databaseInstance.name)}`);
    }
  }

  saveWorkspace({
    database: databaseInstance
  });

  return true;
};
