declare interface AzureEntity {
  id: string;
  name: string;
}

declare interface AzureRegion extends AzureEntity {
  displayName: string;
}

declare interface AzureSubscription extends AzureEntity {
  state: "Enabled";
}

declare interface AzureResourceGroup extends AzureEntity {
  location: string;
}

declare interface AzureStorage extends AzureEntity {}

declare interface CommandOptions {
  silent: boolean;
}
