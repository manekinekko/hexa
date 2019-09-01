import { az, saveWorkspace, Config } from "../lib/utils";
import { chooseSubscription } from "../lib/prompt";

module.exports = async function() {
  let subscriptionsList = await az<AzureSubscription[]>(
    `login --query '[].{name:name, state:state, id:id}'`,
    `Loading subscriptions...`
  );

  Config.set("subscriptions", subscriptionsList);

  if (subscriptionsList.length) {
    let selectedSubscriptionId = (await chooseSubscription(subscriptionsList))
      .subscription as string;
    const { id, name } = subscriptionsList.find(
      (subscription: AzureSubscription) =>
        subscription.id === selectedSubscriptionId
    ) as AzureSubscription;

    Config.set("subscription", { id, name });

    saveWorkspace({
      subscription: {
        id,
        name
      }
    });
  }
};
