import chalk from "chalk";
import { sendWebSocketResponse } from ".";
import { az } from "../../core/utils";

export async function createProject({ ws, requestId, projectName, projectNameUnique, location }: any) {

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

export async function listProjects({ ws, requestId, accountId }: any) {

  try {

    sendWebSocketResponse(ws, requestId, {
      resource: 'PROJECT',
    }, 202);

    let resourceGroupsList = await az<AzureResourceGroup[]>(
      `group list --subscription "${accountId}" --query "[].{name:name, id:id, location:location, tags:tags}"`
    );
    resourceGroupsList = resourceGroupsList.filter((a, _b) => (a.tags && a.tags["x-created-by"] === "hexa"));
    sendWebSocketResponse(ws, requestId, {
      projects: resourceGroupsList
    }, 200);
  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'PROJECT',
      error
    }, 500);
  }

}
