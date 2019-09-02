import { chooseAccountStorage } from "../../core/prompt";
import { az, Config, saveWorkspace } from "../../core/utils";

module.exports = async function() {
  const subscription: AzureSubscription = Config.get("subscription");
  const resourceGroup: AzureResourceGroup = Config.get("resourceGroup");

  // https://docs.microsoft.com/en-us/cli/azure/storage/account?view=azure-cli-latest#az-storage-account-list
  let storageAccountsList = await az<AzureStorage[]>(
    `storage account list --resource-group "${resourceGroup.name}" --subscription "${subscription.id}" --query '[].{name:name, id:id, location:location}'`,
    `Loading your storage accounts...`
  );

  if (storageAccountsList.length) {
    let selectedStorageAccountId = (await chooseAccountStorage(storageAccountsList)).storage as string;

    if (selectedStorageAccountId === "") {
      // create a new storage account
      return (await require(`./create`))();
    } else {
      const { id, name } = storageAccountsList.find(
        (accountStorage: AzureStorage) => accountStorage.id === selectedStorageAccountId
      ) as AzureStorage;

      const storage = {
        id,
        name
      };
      Config.set("storage", storage);
      saveWorkspace({
        storage
      });

      await require("./tokens")();
    }
  }
};
