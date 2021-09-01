param resourcegroup_name string
param location string = 'West Europe'
param tags object = {
  'x-created-by': 'thunderstorm'
  'x-project-name': project_name
  'x-project-id': resourcegroup_name
  'x-resource-name': resource_unique_name
}

param project_name string
param resource_unique_name string
param github_repo string
param github_token string
param default_branch string
// param location string = resourceGroup().location


resource storage 'Microsoft.Storage/storageAccounts@2021-04-01' = {
  name: resource_unique_name
  location: location
  tags: tags
  sku: {
    name: 'Standard_RAGRS'
  }
  kind: 'StorageV2'
  properties: {
    networkAcls: {
      bypass: 'AzureServices'
      virtualNetworkRules: []
      ipRules: []
      defaultAction: 'Allow'
    }
    supportsHttpsTrafficOnly: true
    encryption: {
      services: {
        file: {
          keyType: 'Account'
          enabled: true
        }
        blob: {
          keyType: 'Account'
          enabled: true
        }
      }
      keySource: 'Microsoft.Storage'
    }
    accessTier: 'Hot'
  }
}

resource container 'Microsoft.Storage/storageAccounts/blobServices/containers@2019-06-01' = {
  name: '${resource_unique_name}/default/${resource_unique_name}'
  properties: {
    defaultEncryptionScope: '$account-encryption-key'
    denyEncryptionScopeOverride: false
    publicAccess: 'Blob'
  }
  dependsOn: [
    storage
  ]
}

resource cosmosdb 'Microsoft.DocumentDB/databaseAccounts@2021-06-15' = {
  name: resource_unique_name
  location: location
  tags: tags
  kind: 'MongoDB'
  identity: {
    type: 'None'
  }
  properties: {
    publicNetworkAccess: 'Enabled'
    enableAutomaticFailover: false
    enableMultipleWriteLocations: false
    isVirtualNetworkFilterEnabled: false
    virtualNetworkRules: []
    disableKeyBasedMetadataWriteAccess: false
    enableFreeTier: false
    enableAnalyticalStorage: false
    analyticalStorageConfiguration: {
      schemaType: 'FullFidelity'
    }
    databaseAccountOfferType: 'Standard'
    defaultIdentity: 'FirstPartyIdentity'
    networkAclBypass: 'None'
    disableLocalAuth: false
    consistencyPolicy: {
      defaultConsistencyLevel: 'Eventual'
      maxIntervalInSeconds: 5
      maxStalenessPrefix: 100
    }
    apiProperties: {
      serverVersion: '4.0'
    }
    locations: [
      {
        locationName: location
        failoverPriority: 0
        isZoneRedundant: false
      }
    ]
    cors: []
    capabilities: [
      {
        name: 'EnableMongo'
      }
    ]
    ipRules: []
    backupPolicy: {
      type: 'Periodic'
      periodicModeProperties: {
        backupIntervalInMinutes: 240
        backupRetentionIntervalInHours: 8
      }
    }
    networkAclBypassResourceIds: []
  }
}

resource database 'Microsoft.DocumentDB/databaseAccounts/mongodbDatabases@2021-04-15' = {
  name: resource_unique_name
  parent: cosmosdb
  properties: {
    resource: {
      id: resource_unique_name
    }
  }
  dependsOn: [
    cosmosdb
  ]
}

var storageConnectionString = storage.listKeys().keys[0].value
var cosmosdbConnectionString = listConnectionStrings(cosmosdb.id, cosmosdb.apiVersion).connectionStrings[0].connectionString

resource swa 'Microsoft.Web/staticSites@2021-01-15' = {
  name: resource_unique_name
  location: location
  tags: tags
  sku: {
    name: 'Free'
    tier: 'Free'
  }
  properties: {
      buildProperties: {
        apiLocation: 'api'
        appLocation: 'public'
        appArtifactLocation: 'public'
        outputLocation: 'public'
    }
    repositoryUrl: github_repo
    branch: default_branch
    repositoryToken: github_token
    stagingEnvironmentPolicy: 'Enabled'
    allowConfigFileUpdates: true
  }
}

resource swaAppSettings 'Microsoft.Web/staticSites/config@2020-12-01' = {
  name: '${resource_unique_name}/appsettings'
  properties: {
      STORAGE_CONNECTION_STRING:  storageConnectionString
      COSMOSDB_CONNECTION_STRING: cosmosdbConnectionString
  }
  dependsOn:[
      cosmosdb
      swa
  ]
}

// output cosmosdbConnectionString string = cosmosdbConnectionString
// output storageConnectionString string = storageConnectionString
