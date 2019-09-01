import { az } from "../../lib/utils";

export async function create({ name }: AzureStorage) {
  await az(
    `storage account create -n ${name} -g MyResourceGroup -l westus --sku Standard_LRS`
  );
}
