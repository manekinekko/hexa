import { az, saveProjectConfigToDisk } from "../lib/utils";
import { chooseSubscription } from "../lib/prompt";

module.exports = async function() {
  // console.log(chalk.green(`Fetching subscriptions...`));
  
  // @todo save these subscriptions globally.
  let subscriptions: string = await az(
    `login --query '[].{name:name, state:state, id:id}'`,
    `Loading your subscriptions...`
  );

  if (subscriptions.length) {
    const subscriptionsList = JSON.parse(subscriptions) as AzureSubscription[];
    let selectedSubscription = (await chooseSubscription(subscriptionsList))
      .subscription as string;
    const { id, name } = subscriptionsList.find(
      (sub: AzureSubscription) => sub.name === selectedSubscription
    ) as AzureSubscription;
    saveProjectConfigToDisk({
      subscription: {
        id,
        name
      }
    });
  }
};
