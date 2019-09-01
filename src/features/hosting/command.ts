import { az } from "../../core/utils";

export async function push({ subscriptionId, storageAccountName }: { subscriptionId: string, storageAccountName: string }) {
  await az(
    `storage blob service-properties update --account-name ${storageAccountName} --static-website --404-document 404.html --index-document index.html`
  );
  // await az(
  //   `storage blob upload-batch -s <source-path> -d \$web --account-name <storage-account-name>`
  // );
  // await az(
  //   `storage account show -n <storage-account-name> -g <resource-group-name> --query "primaryEndpoints.web"`
  // );
}
