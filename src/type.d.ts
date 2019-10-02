declare interface ProcessEnv {
  DEBUG: string;
  HEXA_AUTO_MODE: "1";
  HEXA_FORCE_MODE: "1";
  NITRO_ENABLE_ADDING_NEW_RESOURCE: "1";
  NITRO_FORCE_LOGIN: "1";
  NITRO_STORAGE_USE_SAS: "1";
  HEXA_YOLO_MODE: "1";
}

declare interface NitroInitOptions {
  requetedServices?: string[];
}


declare interface NitroWorkspace {
  [key: string]: any;

  project: string;
  storage: AzureStorage;
  resourceGroup: AzureResourceGroup;
  subscription: AzureSubscription;
  hosting?: {
    folder: string;
  };
  functionApp?: AzureFunctionApp & {
    folder?: string;
  };
  database?: DatabaseInstance;
}
declare interface AzureEntity {
  id: string & CreationMode;
  name: string;
  tags?: { "x-created-by": "hexa" } | { [key: string]: string };
}

declare interface AzureCosmosDBInstance {}

declare interface AzureTableStorageInstance {}

declare interface DatabaseInstance extends AzureCosmosDBInstance, AzureTableStorageInstance, AzureEntity {
  kind: "TABLE_STORAGE" | "COSMOSDB";
  created?: boolean;
  endpoint: string;
}

declare interface AzureFunctionApp extends AzureEntity {
  appServicePlanId?: string;
  hostName?: string;
  state?: boolean;
}

declare interface AzureRegion extends AzureEntity {
  displayName: string;
}

declare interface AzureSubscription extends AzureEntity {
  state?: "Enabled";
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
  async?: boolean; // Asynchronous execution. If a callback is provided, it will be set to true, regardless of the passed value (default: false).
  silent?: boolean; //Do not echo program output to console (default: false).

  cwd?: string | null; // Current working directory of the child process. Default: null.
  env?: { [key: string]: string }; // Environment key-value pairs. Default: process.env.
  encoding?: string;
  shell?: string; // Shell to execute the command with. See Shell Requirements and Default Windows Shell. Default: '/bin/sh' on Unix, process.env.ComSpec on Windows.
  timeout?: number;
  maxBuffer?: number; // Largest amount of data in bytes allowed on stdout or stderr. If exceeded, the child process is terminated and any output is truncated. See caveat at maxBuffer and Unicode. Default: 1024 * 1024.
  killSignal?: string | number;
  uid?: number; //Sets the user identity of the process (see setuid(2)).
  gid?: number; //Sets the group identity of the process (see setgid(2)).
  windowsHide?: boolean;
}

declare type CreationMode = "MANUAL" | "AUTOMATIC";
