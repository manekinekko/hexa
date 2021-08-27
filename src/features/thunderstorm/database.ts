
import chalk from "chalk";
import { MongoClient } from "mongodb";
import { sendWebSocketResponse } from ".";
import { az, IS_DEMO } from "../../core/utils";

export async function createDatabase({ ws, requestId, projectName, projectNameUnique }: any) {
  try {

    sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
    }, 202);

    if (IS_DEMO()) {
      await new Promise(resolve => setTimeout(resolve, 5000, {}));
    }
    else {


      // TODO: enable free tier for non-Internal subscriptions
      // --enable-free-tier \

      await az<DatabaseInstance>(
        `cosmosdb create \
      --name "${projectNameUnique}" \
      --resource-group "${projectName}" \
      --kind "MongoDB" \
      --server-version "4.0" \
      --default-consistency-level "Eventual" \
      --tags "x-created-by=thunderstorm" \
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

    }

  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
      error
    }, 500);

  }

}

export async function getDatabaseConnectionString({ projectNameUnique, projectName }: { projectNameUnique: string, projectName: string }) {
  return await az<{ connectionStrings: Array<{ connectionString: string, description: string }> }>(
    `cosmosdb keys list \
    --name "${projectNameUnique}" \
    --resource-group "${projectName}" \
    --type "connection-strings"`
  );
}

export async function createCollection({ ws, requestId, projectName, projectNameUnique, collectionName }: any) {
  try {
    sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
    }, 202);

    if (IS_DEMO()) {
      await new Promise(resolve => setTimeout(resolve, 5000, {}));
    }
    else {
      const cosmosdbConnectionString = await getDatabaseConnectionString({
        projectName,
        projectNameUnique
      });

      const client = await MongoClient.connect(cosmosdbConnectionString.connectionStrings[0].connectionString);
      const database = client.db(projectNameUnique);

      const collections = (await database.listCollections().toArray() as any).map((collection: any) => collection.name);

      if (!collections.includes(collectionName)) {
        console.log(`collection ${collectionName} does not exist`);
        await database.createCollection(collectionName);
      } else {
        console.log(`collection ${collectionName} already exists`);
      }
    }
    return getDatabase({
      ws,
      requestId,
      projectName,
      projectNameUnique,
    });

  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
      error
    }, 500);
  }
}

export async function getDatabase({ ws, requestId, projectName, projectNameUnique }: any) {
  try {
    sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
    }, 202);

    const cosmosdbConnectionString = await getDatabaseConnectionString({
      projectName,
      projectNameUnique
    });

    const client = await MongoClient.connect(cosmosdbConnectionString.connectionStrings[0].connectionString);
    const database = client.db(projectNameUnique);

    const collections = await database.listCollections().toArray() as any;

    for (const collection of collections) {
      collection.documents = await database.collection(collection.name).find().toArray();
    }

    return sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
      collections
    }, 200);

  } catch (error) {
    console.error(chalk.red(error));

    return sendWebSocketResponse(ws, requestId, {
      resource: 'DATABASE',
      error
    }, 500);
  }
}
