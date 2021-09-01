import chalk from "chalk";
import { sendWebSocketResponse } from ".";
import { az } from "../../core/utils";

type AzureBlobStorageItem = {
  name: string,
  contentLength: number,
  contentType: string,
  lastModified: string;
  url: string;
};

export async function getStorageConnectionString({ projectNameUnique }: any) {
  return await az<{ connectionString: string }>(
    `storage account show-connection-string \
    --name "${projectNameUnique}"
    `
  );
}

export async function listStorage({ ws, requestId, projectName, projectNameUnique }: any) {
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
