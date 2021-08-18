import chalk from "chalk";
import { sendWebSocketResponse } from ".";
import { getDatabaseConnectionString } from "./database";
import { getStorageConnectionString } from "./storage";

export async function listEnvironmentVariables({ ws, requestId, projectNameUnique, projectName }: any) {

  try {

    sendWebSocketResponse(ws, requestId, {
      resource: 'ENV',
    }, 202);

    const databaseConnectionStrings = await getDatabaseConnectionString({
      projectNameUnique,
      projectName,
    });

    const storageConnectionString = await getStorageConnectionString({
      projectNameUnique
    });

    sendWebSocketResponse(ws, requestId, {
      env: {
        database: databaseConnectionStrings.connectionStrings.pop()?.connectionString,
        storage: storageConnectionString.connectionString
      }
    }, 200);

  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'ENV',
      error
    }, 500);
  }

}
