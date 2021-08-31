import chalk from "chalk";
import { sendWebSocketResponse } from ".";
import { az } from "../../core/utils";

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
