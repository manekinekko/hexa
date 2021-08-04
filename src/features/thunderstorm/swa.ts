import chalk from "chalk";
import { sendWebSocketResponse } from ".";
import { az } from "../../core/utils";


export async function createSwa({ ws, requestId, projectName, projectNameUnique, location, html_url, default_branch, gitHubToken }: any) {

  try {
    sendWebSocketResponse(ws, requestId, {
      resource: 'SWA'
    }, 202);

    const swa = await az<AzureStaticWebApps>(
      `staticwebapp create \
      --name "${projectNameUnique}" \
      --resource-group "${projectName}" \
      --source "${html_url}" \
      --location "${location}" \
      --branch "${default_branch}" \
      --output-location "./" \
      --api-location "api" \
      --app-location "./" \
      --token "${gitHubToken}" \
      --tag "x-created-by=hexa" \
      --sku "free" \
      --debug \
      --query "{name:name, id:id, url:defaultHostname}"`,
    );

    sendWebSocketResponse(ws, requestId, {
      resource: 'SWA',
      url: swa.url
    }, 200);

  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'SWA',
      error
    }, 500);
  }
}

export async function updateSwaWithDatabaseConnectionStrings({ projectNameUnique, databaseConnectionString }: any) {
  console.log(`TODO: az staticwebapp appsettings set doesn not support updating app setting right now!`);
  console.log({ projectNameUnique, databaseConnectionString });
  return Promise.resolve();

  // return await az<void>(
  //   `staticwebapp appsettings set \
  //   --name "${projectNameUnique}" \
  //   --setting-names 'COSMOSDB_CONNECTION_STRING="${databaseConnectionString}"'`
  // );
}
