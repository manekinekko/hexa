import { chooseSubscription } from "../core/prompt";
import { az, Config, saveWorkspace } from "../core/utils";

export default async function() {
  const { AZURE_SERVICE_PRINCIPAL_ID, AZURE_SERVICE_PRINCIPAL_PASSWORD, AZURE_SERVICE_PRINCIPAL_TENANT } = process.env;

  let subscriptionsList = [];
  if (AZURE_SERVICE_PRINCIPAL_ID && AZURE_SERVICE_PRINCIPAL_PASSWORD && AZURE_SERVICE_PRINCIPAL_TENANT) {
    await az<void>(
      `login --service-principal -u ${AZURE_SERVICE_PRINCIPAL_ID} -p ${AZURE_SERVICE_PRINCIPAL_PASSWORD} --tenant ${AZURE_SERVICE_PRINCIPAL_TENANT} --query "[].{name:name, state:state, id:id}"`,
      `Sign in with a service principal...`
    );

    return true;
  } else {
    subscriptionsList = await az<AzureSubscription[]>(`login --query "[].{name:name, state:state, id:id}"`, `Loading subscriptions...`);
  }

  Config.set("subscriptions", subscriptionsList);

  if (subscriptionsList.length) {
    let selectedSubscriptionId = (await chooseSubscription(subscriptionsList)).subscription as string;
    const { id, name } = subscriptionsList.find((subscription: AzureSubscription) => subscription.id === selectedSubscriptionId) as AzureSubscription;

    Config.set("subscription", { id, name });

    saveWorkspace({
      subscription: {
        id,
        name
      }
    });
  }

  return true;

};
