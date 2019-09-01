import inquirer, { Answers } from "inquirer";
export declare function chooseSubscription(subscriptionsList: AzureSubscription[]): Promise<Answers>;
export declare function chooseResourceGroup(resourceGroups: AzureResourceGroup[]): Promise<Answers>;
export declare function chooseAccountStorageName(): Promise<inquirer.Answers>;
export declare function askForFeatures(): Promise<Answers>;
export declare function askForResourceGroupDetails(regions: AzureRegion[]): Promise<Answers>;
export declare function askForProjectDetails(): Promise<Answers>;
export declare function askIfOverrideProjectFile(): Promise<Answers>;
