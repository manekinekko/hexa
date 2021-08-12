import chalk from "chalk";
import { sendWebSocketResponse } from ".";
import { az, IS_DEMO } from "../../core/utils";


export async function createSwa({ ws, requestId, projectName, projectNameUnique, location, html_url, default_branch, gitHubToken, projectRealName }: any) {

  try {
    sendWebSocketResponse(ws, requestId, {
      resource: 'SWA'
    }, 202);

    let swa: AzureStaticWebApps = { id: 'MANUAL', url: '' };

    if (IS_DEMO()) {
      swa = await new Promise(resolve => setTimeout(resolve, 5000, { url: '' }));
    }
    else {

      swa = await az<AzureStaticWebApps>(
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
      --tags "x-created-by=thunderstorm" "x-project-name=${projectRealName}" "x-project-id=${projectName}" "x-resource-name=${projectNameUnique}" \
      --sku "free" \
      --debug \
      --query "{name:name, id:id, url:defaultHostname}"`,
      );
    }

    sendWebSocketResponse(ws, requestId, {
      resource: 'SWA',
      url: swa.url,
    }, 200);

  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'SWA',
      error
    }, 500);
  }
}

export async function updateSwaWithDatabaseConnectionStrings({ projectNameUnique, databaseConnectionString }: { projectNameUnique: string | undefined, databaseConnectionString: string }) {
  console.log(`TODO: az staticwebapp appsettings set doesn not support updating app setting right now!`);
  console.log({ projectNameUnique, databaseConnectionString });
  return Promise.resolve();

  // return await az<void>(
  //   `staticwebapp appsettings set \
  //   --name "${projectNameUnique}" \
  //   --setting-names 'COSMOSDB_CONNECTION_STRING="${databaseConnectionString}"'`
  // );
}

export async function getSWA({ ws, requestId, projectName, projectNameUnique }: any) {
  try {
    sendWebSocketResponse(ws, requestId, {
      resource: 'FUNCTIONS',
    }, 202);

    let swa = await az<Array<any>>(
      `staticwebapp show \
      --name "${projectNameUnique}"
      --resource-group "${projectName}" \
    `);

    return sendWebSocketResponse(ws, requestId, {
      resource: 'FUNCTIONS',
      swa
    }, 200);
  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'FUNCTIONS',
      error
    }, 500);

  }
}


export async function listFunctions({ ws, requestId, projectName, projectNameUnique }: any) {
  try {

    sendWebSocketResponse(ws, requestId, {
      resource: 'FUNCTIONS',
    }, 202);

    let functions = await az<Array<any>>(
      `staticwebapp environment functions \
      --name "${projectNameUnique}"
      --resource-group "${projectName}" \
    `);

    return sendWebSocketResponse(ws, requestId, {
      resource: 'FUNCTIONS',
      functions
    }, 200);


  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'STORAGE',
      error
    }, 500);
  }
}
