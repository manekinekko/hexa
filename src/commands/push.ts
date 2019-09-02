import { Config } from "../core/utils";
import { push } from "../features/hosting/command";

module.exports = async function() {
  const subscription = Config.get("subscription") as AzureSubscription;
  const storage = Config.get("storage") as AzureStorage;

  await push({
    storageAccountName: storage.name
  });
};
