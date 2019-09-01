import { az, Config, saveWorkspace } from "../../lib/utils";
import { chooseAccountStorage } from "../../lib/prompt";

module.exports = async function() {
  const subscription: AzureSubscription = Config.get("subscription");
  let storageAccountsList = await az<AzureStorage[]>(
    `storage account list --subscription "${subscription.id}" --query '[].{name:name, id:id, location:location}'`,
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
    }
  }
};
