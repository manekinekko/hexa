
import chalk from "chalk";
import { MongoClient } from "mongodb";
import { sendWebSocketResponse } from ".";
import { az } from "../../core/utils";

export async function createDatabase({ ws, requestId, projectName, projectNameUnique }: any) {
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
    const connectionStrings = await getDatabaseConnectionString({
      projectNameUnique,
      projectName,
    });

    sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
      connectionString: connectionStrings.connectionStrings[0].connectionString,
    }, 200);

  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
      error
    }, 500);

  }

}

async function getDatabaseConnectionString({ projectNameUnique, projectName }: { projectNameUnique: string, projectName: string }) {
  return await az<{ connectionStrings: Array<{ connectionString: string, description: string }> }>(
    `cosmosdb keys list \
    --name "${projectNameUnique}" \
    --resource-group "${projectName}" \
    --type "connection-strings"`
  );
}

export async function getDatabaseCollection({ projectNameUnique, cosmosdbConnectionString }: { projectNameUnique: string, cosmosdbConnectionString: string }) {
  const client = await MongoClient.connect(cosmosdbConnectionString);
  const database = client.db(projectNameUnique);
  return database.listCollections();
}

export async function getDatabaseDocument({ projectNameUnique, cosmosdbConnectionString, collectionName }: { projectNameUnique: string, cosmosdbConnectionString: string, collectionName: string }) {
  const client = await MongoClient.connect(cosmosdbConnectionString);
  const database = client.db(projectNameUnique);
  return database.collection(collectionName).find();
}
