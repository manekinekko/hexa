import chalk from 'chalk';
import util from 'util';
import WebSocket from 'ws';
import { az } from '../../core/utils';
import { loginWithGitHub } from '../github/login-github';
import createGitHubRepo from '../github/repo';
import { createDatabase, createCollection, getDatabase } from './database';
import { listEnvironmentVariables } from './env';
import { createProject, listProjects } from './project';
import { createStorage, listStorage } from './storage';
import { createSwa, getSWA, listFunctions, updateSwaWithDatabaseConnectionStrings } from './swa';

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

  // get project name from body (only sent when creating a project)
  let projectName = (body?.projectName)?.replace(/\s+/g, '');
  let projectRealName = body?.projectName;
  let projectNameUnique: undefined | string = undefined;

  // extract request metadata from URL
  // /accounts/{accountId}/projects/{projectId}/{storage,function,env,swa,database}/{providerId}
  const [
    _,
    _accountsLabel,
    accountId,
    projectType,
    projectId,
    providerType,
    providerId
  ] = url.split('/');

  // if projectId is provided then use it as project name (this means the project alreadt exists)
  if (projectId) {
    projectName = projectId;
  }

  if (projectName) {
    // some resources require that name values must be less than 24 characters with no whitespace
    projectNameUnique = `${projectName + (Math.random() + 1).toString(36).substring(2)}`.substr(0, 24).replace(/\-/g, '');
  }

  if (providerType && providerId) {
    projectNameUnique = providerId;
  }

  const location = 'westeurope';

  console.log(``);
  console.log(`Request:`);
  console.log(request);
  console.log(`Parameters:`);
  console.log({
    projectName,
    projectNameUnique,
    location,
    accountId,
    projectType,
    projectId,
    providerType,
    providerId
  });

  switch (method) {
    case 'POST':
      if (projectType === 'projects') {
        try {

          if (providerType === 'databases') {

            return await createCollection({
              ws,
              requestId,
              projectName,
              projectNameUnique,
              collectionName: body.collectionName
            });

          } else {
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
              location,
              projectRealName
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
              accountId,
              location
            });

            const database = createDatabase({
              ws,
              requestId,
              projectName,
              projectNameUnique,
              accountId
            });

          await Promise.all([swa, storage, database])
            .then(async _ => {

              console.log(`Database connection string: ${KeyVault.ConnectionString.Database}`);

              if (KeyVault.ConnectionString.Database) {
                await updateSwaWithDatabaseConnectionStrings({
                  databaseConnectionString: KeyVault.ConnectionString.Database,
                  projectNameUnique
                });
                console.log('updated SWA with connection string');
              }

              // end operation
              sendWebSocketResponse(ws, requestId, {
                projectName: projectNameUnique
              }, 201);
            }).catch(error => {
              sendWebSocketResponse(ws, requestId, {
                error
              }, 500);
            });

            if (KeyVault.ConnectionString.Database) {
              await updateSwaWithDatabaseConnectionStrings({
                databaseConnectionString: KeyVault.ConnectionString.Database,
                projectNameUnique
              });
              console.log('updated SWA with connection string');
            }

            // end operation
            sendWebSocketResponse(ws, requestId, {
              projectName: projectNameUnique
            }, 201);
          }
        } catch (error) {
          console.error(chalk.red(error));

          return sendWebSocketResponse(ws, requestId, {
            error
          }, 500);
        }
      }
      break;

    case 'GET':
      if (projectType === 'projects') {

        // GET /accounts/{accountId}/projects/{projectId}
        if (projectId) {
          if (!providerType) {
            // TODO: list all resource groups
          }
          // GET /accounts/{accountId}/projects/{projectId}/storages/{providerId}
          else if (providerType === 'storages') {
            return await listStorage({
              ws,
              requestId,
              projectName,
              projectNameUnique,
            });
            // GET /accounts/{accountId}/projects/{projectId}/databases/{providerId}
          } else if (providerType === 'databases') {
            return await getDatabase({
              ws,
              requestId,
              projectName,
              projectNameUnique
            });
          }
          // GET /accounts/{accountId}/projects/{projectId}/functions/{providerId}
          else if (providerType === 'functions') {
            return await listFunctions({
              ws, requestId, projectName, projectNameUnique
            });
          }
          // GET /accounts/{accountId}/projects/{projectId}/swa/{providerId}
          else if (providerType === 'swa') {
            return await getSWA({
              ws, requestId, projectName, projectNameUnique
            });
          }
          // GET /accounts/{accountId}/projects/{projectId}/env/{providerId}
          else if (providerType === 'env') {
            return await listEnvironmentVariables({
              ws, requestId, projectNameUnique, projectName
            });
          }
        }
        // GET /accounts/{accountId}/projects/
        else {
          await listProjects({
            ws,
            requestId,
            accountId
          });
        }
      }
      else {
        sendWebSocketResponse(ws, requestId, { error: `resorce type not implemented "${projectType}"` }, 501);
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
      if (projectType === 'projects') {
        try {

          sendWebSocketResponse(ws, requestId, null, 202);
          await az<void>(
            `group delete \
            --name "${projectName}" \
            --subscription "${accountId}" \
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
      sendWebSocketResponse(ws, requestId, { error: `method "${method}" not allowed` }, 405);
  }
}
