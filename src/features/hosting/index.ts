import chalk from "chalk";
import { askForHostingFolder } from "../../core/prompt";
import { az, Config, createDirectoryIfNotExists, readWorkspace, saveWorkspace } from "../../core/utils";
import dbg from "debug";
const debug = dbg("hosting");

export default async function () {
  const isForceModeEnabled = !!process.env.HEXA_FORCE_MODE;

  let defaultPublicFolder = "./dist";

  // default values
  let [folder] = [defaultPublicFolder];

  if (isForceModeEnabled) {
    // when the Force mode is enabled, use all defaults
    [folder] = [defaultPublicFolder, true, true, true];
  } else {
    // when either manual or automatic mode are enabled, ask the user for all the details
    ({ folder = defaultPublicFolder } = await askForHostingFolder(defaultPublicFolder));
    debug(`selected hosting folder=${folder}`);
  }

  createDirectoryIfNotExists(defaultPublicFolder);

  const { storage } = readWorkspace();
  debug(`using storage ${chalk.green(storage.name)}`);

  const subscription: AzureSubscription = Config.get("subscription");
  debug(`using subscription ${chalk.green(subscription.name)}`);

  // https://docs.microsoft.com/en-us/cli/azure/storage/blob/service-properties?view=azure-cli-latest#az-storage-blob-service-properties-update
  await az<string>(
    `storage blob service-properties update --account-name "${storage.name}" --static-website --404-document index.html --index-document index.html --query "{staticWebsite: staticWebsite}"`,
    `Enabling hosting for storage account ${chalk.cyan(storage.name)}...`
  );

  // TODO: enable CORS
  // https://docs.microsoft.com/en-us/cli/azure/storage/cors?view=azure-cli-latest#az-storage-cors-clear
  // await az(`storage cors clear --services "b" --account-name "${storage.name}" --subscription "${subscription.id}"`);
  // https://docs.microsoft.com/en-us/cli/azure/storage/cors?view=azure-cli-latest#az-storage-cors-add
  //   await az(
  //     `storage cors add --methods GET HEAD MERGE OPTIONS POST PUT --origins "*" --services "b" --account-name "${storage.name}" --subscription "${subscription.id}" --max-age 3600`,
  //     `Enabling CORS...`
  // );

  saveWorkspace({
    hosting: {
      folder
    }
  });
};
