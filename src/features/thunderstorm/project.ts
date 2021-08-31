import chalk from "chalk";
import { sendWebSocketResponse } from ".";
import { az } from "../../core/utils";



function generateTags({ projectRealName, projectName, projectNameUnique }: any) {
  return `"x-created-by=thunderstorm" "x-project-name=${projectRealName}" "x-project-id=${projectName}" "x-resource-name=${projectNameUnique}"`;
}

export async function listProjects({ ws, requestId, accountId }: any) {

  try {

    sendWebSocketResponse(ws, requestId, {
      resource: 'PROJECT',
    }, 202);

    let staticWebApps = await az<AzureResourceGroup[]>(
      `staticwebapp list --subscription "${accountId}"`
    );
    staticWebApps = staticWebApps.filter((a, _b) => (a.tags && a.tags["x-created-by"] === "thunderstorm" && a.tags["x-thundr-status"] !== "deleted"));
    sendWebSocketResponse(ws, requestId, {
      projects: staticWebApps.map((swa: any) => {
        return { swa };
      })
    }, 200);
  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'PROJECT',
      error
    }, 500);
  }

}

export async function deleteProject({ ws, requestId, projectName, projectRealName, accountId, projectNameUnique }: any) {
  try {

    sendWebSocketResponse(ws, requestId, null, 202);

    await az<void>(
      `staticwebapp update \
      --name "${projectNameUnique}"
      --tags ${generateTags({ projectRealName, projectName, projectNameUnique })} "x-thundr-status=deleted"`
    );
    await az<void>(
      `group update \
      --resource-group "${projectName}" \
      --subscription "${accountId}"
      --set "tags.x-thundr-status=deleted"`
    );
    await az<void>(
      `group delete \
      --name "${projectName}" \
      --subscription "${accountId}" \
      --no-wait \
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
