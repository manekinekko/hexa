import { push } from "../features/hosting/command";
import { Config } from "../lib/utils";

module.exports = async function() {
  const subscription = Config.get("subscription") as AzureSubscription;
  const storage = Config.get("storage") as AzureStorage;

  await push({
    subscriptionId: subscription.id,
    storageAccountName: storage.name
  });
};
