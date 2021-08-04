import WebSocket from 'ws';

import chalk from 'chalk';
import util from 'util';
import { az } from '../../core/utils';
import createGitHubRepo from '../github/repo';
import { loginWithGitHub } from '../github/login-github';

type AzureBlobStorageItem = {
  name: string,
  contentLength: number,
  contentType: string,
  lastModified: string;
  url: string;
};

type WsRequest = {
  method: 'LOGINAZURE' | 'LOGINGITHUB' | 'GET' | 'POST' | 'DELETE' | 'PUT' | 'STATUS';
  url: string;
  body: { [key: string]: string };
  requestId: string;
}

type WsResponse = {
  requestId: string;
  statusCode: number;
  body: { [key: string]: string };
  time: number;
}

const KeyVault = {
  ConnectionString: {
    Storage: '',
    Database: '' as string | undefined,
  }
};

export function sendWebSocketResponse(ws: WebSocket, requestId: string, body: Object | null, statusCode: number = 200) {
  const response = {
    requestId,
    body,
    statusCode,
    time: Date.now(),
  } as WsResponse;

  ws.send(JSON.stringify(response));

  console.log(``);
  console.log(`Response:`);
  console.log(util.inspect(response, { depth: 4, colors: true }));
}

export async function processWebSocketRequest(ws: WebSocket, message: WebSocket.Data) {
  const request = JSON.parse(String(message));
  let { method, url = '/', requestId, body } = request as WsRequest;

  // /accounts/${subscriptionId}/projects/${resourceId}/storages/${storageId}
  const [_, _subscriptionLabel, subscriptionId, resourceType, resourceId, providerType, storageId] = url.split('/');

  let projectName = (body?.projectName)?.replace(/\s+/g, '');

  // some resources require that name values must be less than 24 characters with no whitespace
  let projectNameUnique = `${projectName}${(Math.random() + 1).toString(36).substring(2)}`.substr(0, 24);

  // if resourceId is provided then use it as project name
  if (resourceId) {
    projectName = resourceId;
  }

  if (storageId) {
    projectNameUnique = storageId;
  }

  const location = 'westeurope';

  console.log(``);
  console.log(`Request:`);
  console.log(request);
  console.log(`Parameters:`);
  console.log({ projectName, projectNameUnique, location, subscriptionId, resourceType, resourceId, providerType });

  switch (method) {
    case 'POST':
      if (resourceType === 'projects') {
        try {

          sendWebSocketResponse(ws, requestId, {
            resource: 'GITHUB'
          }, 202);

          try {

            var { html_url, default_branch } = await createGitHubRepo({
              token: body.gitHubToken,
              projectName,
            })

            sendWebSocketResponse(ws, requestId, {
              resource: 'GITHUB'
            }, 200);

          } catch (error) {
            console.error(chalk.red(error));

            return sendWebSocketResponse(ws, requestId, {
              resource: 'GITHUB',
              error
            }, 500);

          }

          //======

          const resourceGroup = createProject({
            ws,
            requestId,
            projectName,
            projectNameUnique,
            location
          });

          await Promise.all([resourceGroup]);

          //======

          const swa = createSwa({
            ws,
            requestId,
            projectName,
            projectNameUnique,
            location,
            html_url,
            default_branch,
            gitHubToken: body.gitHubToken
          });

          const storage = createStorage({
            ws,
            requestId,
            projectName,
            projectNameUnique,
            subscriptionId,
            location
          });

          const databse = createDatabase({
            ws,
            requestId,
            projectName,
            projectNameUnique,
            subscriptionId
          });

          await Promise.all([swa, storage, databse]);
          console.log(`Database connection string: ${KeyVault.ConnectionString.Database}`);

          if (KeyVault.ConnectionString.Database) {
            await updateSwaWithDatabaseConnectionStrings({
              connectionStrings: KeyVault.ConnectionString.Database,
              projectNameUnique
            });
            console.log('updated SWA with connection string');
          }

          // end operation
          sendWebSocketResponse(ws, requestId, {
            projectName: projectNameUnique
          }, 201);

        } catch (error) {
          console.error(chalk.red(error));

          return sendWebSocketResponse(ws, requestId, {
            error
          }, 500);
        }
      }
      break;

    case 'GET':

      if (resourceType === 'projects') {
        // GET /accounts/${accountId}/projects/${projectId}
        if (resourceId) {
          if (!providerType) {
            // TODO: list all resource groups
          }
          // GET /accounts/${accountId}/projects/${projectId}/storages
          else if (providerType === 'storages') {
            return await listBlobStorage({
              ws,
              requestId,
              projectNameUnique,
              projectName
            });
          }
        }
        // GET /accounts/${accountId}/projects/
        else {
          sendWebSocketResponse(ws, requestId, null, 202);
          let resourceGroupsList = await az<AzureResourceGroup[]>(
            `group list --subscription "${subscriptionId}" --query "[].{name:name, id:id, location:location, tags:tags}"`
          );
          resourceGroupsList = resourceGroupsList.filter((a, _b) => (a.tags && a.tags["x-created-by"] === "hexa"));
          sendWebSocketResponse(ws, requestId, resourceGroupsList);
        }
      }
      else {
        sendWebSocketResponse(ws, requestId, { error: `resorce type not implemented "${resourceType}"` }, 501);
      }

      break;

    case 'LOGINAZURE':

      sendWebSocketResponse(ws, requestId, null, 202);
      const subscriptionsList = await az<AzureSubscription[]>(`login --query "[].{name:name, state:state, id:id, user:user}"`);
      sendWebSocketResponse(ws, requestId, subscriptionsList);

      break;
    case 'LOGINGITHUB':
      let token;
      try {
        token = await loginWithGitHub((oauthCallbaclUrl: string) => {
          sendWebSocketResponse(ws, requestId, { url: oauthCallbaclUrl }, 200);
        });
      } catch (error) {
        sendWebSocketResponse(ws, requestId, null, 500);
        console.error(chalk.red(error));
      }

      if (token) {
        sendWebSocketResponse(ws, requestId, { token }, 200);
      }
      else {
        sendWebSocketResponse(ws, requestId, null, 404);
      }

      break;

    case 'DELETE':
      if (resourceType === 'projects') {
        try {

          sendWebSocketResponse(ws, requestId, null, 202);
          await az<void>(
            `group delete \
            --name "${projectName}" \
            --subscription "${subscriptionId}" \
            --yes`
          );
          sendWebSocketResponse(ws, requestId, null, 200);
        }
        catch (error) {
          sendWebSocketResponse(ws, requestId, {
            error
          }, 500);
        }
      }
      break;

    default:
      sendWebSocketResponse(ws, requestId, { error: 'method not allowed' }, 405);
  }
}

async function createProject({ ws, requestId, projectName, projectNameUnique, location }: any) {

  try {
    sendWebSocketResponse(ws, requestId, {
      resource: 'PROJECT'
    }, 202);

    await az<AzureResourceGroup>(
      `group create \
      --location "${location}" \
      --name "${projectName}" \
      --tag "x-created-by=hexa" \
      --tag "x-project-name="${projectNameUnique}" \
      --query "{name:name, id:id, location:location}"`
    );

    sendWebSocketResponse(ws, requestId, {
      resource: 'PROJECT',
    }, 200);

  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'PROJECT',
      error
    }, 500);
  }
}

async function createSwa({ ws, requestId, projectName, projectNameUnique, location, html_url, default_branch, gitHubToken }: any) {

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

async function getStorageConnectionString({ projectNameUnique }: any) {
  return await az<{ connectionString: string }>(
    `storage account show-connection-string \
    --name ${projectNameUnique}
    `
  );
}

async function createStorage({ ws, location, requestId, projectName, projectNameUnique, subscriptionId }: any) {

  try {
    sendWebSocketResponse(ws, requestId, {
      resource: 'STORAGE',
    }, 202);

    await az<AzureStorage>(
      `storage account create \
      --location "${location}" \
      --name "${projectNameUnique}" \
      --subscription "${subscriptionId}" \
      --resource-group "${projectName}" \
      --kind "StorageV2" \
      --tag "x-created-by=hexa" \
      --query "{name:name, id:id, location:location}"`
    );

    const storageConnectionString = await getStorageConnectionString({
      projectNameUnique
    });

    KeyVault.ConnectionString.Storage = storageConnectionString.connectionString;

    await az<AzureStorage>(
      `storage container create \
      --resource-group ${projectName} \
      --name ${projectNameUnique} \
      --public-access blob \
      --connection-string "${storageConnectionString.connectionString}"`
    );

    sendWebSocketResponse(ws, requestId, {
      resource: 'STORAGE',
    }, 200);

  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'STORAGE',
      error
    }, 500);

  }
}

async function createDatabase({ ws, requestId, projectName, projectNameUnique }: any) {
  try {

    sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
    }, 202);

    // TODO: enable free tier for non-Internal subscriptions
    // --enable-free-tier \

    await az<DatabaseInstance>(
      `cosmosdb create \
      --name "${projectNameUnique}" \
      --resource-group "${projectName}" \
      --kind "MongoDB" \
      --server-version "4.0" \
      --default-consistency-level "Eventual" \
      --tag "x-created-by=hexa" \
      --enable-multiple-write-locations false \
      --enable-automatic-failover false \
      --query "{id: id, name: name, tags: tags, endpoint: documentEndpoint}"`
    );

    await az<void>(
      `cosmosdb mongodb database create \
      --name "${projectNameUnique}" \
      --account-name "${projectNameUnique}" \
      --resource-group "${projectName}"`
    );

    // fetch connection strings
    const connectionStrings = await az<{ connectionStrings: Array<{ connectionString: string, description: string }> }>(
      `cosmosdb keys list \
      --name "${projectNameUnique}" \
      --resource-group "${projectName}" \
      --type "connection-strings"`
    );

    KeyVault.ConnectionString.Database = connectionStrings.connectionStrings.pop()?.connectionString;

    sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
      connectionString: KeyVault.ConnectionString.Database
    }, 200);


  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
      error
    }, 500);

  }

}

async function updateSwaWithDatabaseConnectionStrings({ projectNameUnique, databaseConnectionString }: any) {
  console.log(`az staticwebapp appsettings set doesn not support updating app setting right now!`);
  console.log({ projectNameUnique, databaseConnectionString });
  return Promise.resolve();

  // return await az<void>(
  //   `staticwebapp appsettings set \
  //   --name "${projectNameUnique}" \
  //   --setting-names 'COSMOSDB_CONNECTION_STRING="${databaseConnectionString}"'`
  // );
}

async function listBlobStorage({ ws, requestId, projectName, projectNameUnique }: any) {
  try {

    sendWebSocketResponse(ws, requestId, {
      resource: 'STORAGE',
    }, 202);

    const storageConnectionString = await getStorageConnectionString({
      projectName,
      projectNameUnique
    });

    let blobs = await az<Array<AzureBlobStorageItem>>(
      `storage blob list \
      --account-name "${projectNameUnique}" \
      --container-name "${projectNameUnique}" \
      --connection-string "${storageConnectionString.connectionString}" \
      --query "[].{name: name, contentLength: properties.contentLength, lastModified: properties.lastModified, contentType: properties.contentSettings.contentType}"
    `);

    blobs = blobs.map((blob: AzureBlobStorageItem) => {
      return {
        ...blob,
        url: `https://${projectNameUnique}.blob.core.windows.net/${projectNameUnique}/${blob.name}`
      }
    });

    return sendWebSocketResponse(ws, requestId, {
      resource: 'STORAGE',
      blobs
    }, 200);

  }
  catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'STORAGE',
      error
    }, 500);

  }
}
