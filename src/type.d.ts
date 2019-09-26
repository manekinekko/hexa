declare interface NitroWorkspace {
  project: string;
  storage: AzureStorage;
  hosting: {
    folder: string;
  };
  functionApp: AzureFunctionApp & {
    folder?: string;
  };
  resourceGroup: AzureResourceGroup;
  subscription: AzureSubscription;
}
declare interface AzureEntity {
  id: string & CreationMode;
  name: string;
  tags?: { "x-created-by": "hexa" } | { [key: string]: string };
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
