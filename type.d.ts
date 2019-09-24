declare interface NitroWorkspace {
  project: string;
  storage: AzureStorage;
  hosting: {
    public: string;
  };
  ressourceGroupe: AzureResourceGroup;
}
declare interface AzureEntity {
  id: string & CreationMode;
  name: string;
  tags: { 'x-created-by': 'nitro' } | { [key: string]: string };
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

declare interface AzureStorage extends AzureEntity {
  sas?: string;
  connectionString?: string;
}
declare interface AzureStorageToken extends AzureStorage {
  sas?: string;
  connectionString?: string;
}

declare interface CommandOptions {
  silent: boolean;
}

declare type CreationMode = 'MANUAL' | 'AUTOMATIC';