targetScope='subscription'

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

resource resource_group 'Microsoft.Resources/resourceGroups@2021-01-01' = {
  name: resourcegroup_name
  location: location
  tags: tags
}


module resources 'resources.bicep' = {
  name: 'resources'
  scope: resource_group
  params: {
    project_name: project_name
    resourcegroup_name: resourcegroup_name
    resource_unique_name: resource_unique_name
    tags: tags
    github_repo: github_repo
    location: location
    github_token: github_token
  }
  dependsOn: [
    resource_group
  ]
}

// output cosmosdbConnectionString string = resources.outputs.cosmosdbConnectionString
// output storageConnectionString string = resources.outputs.storageConnectionString
