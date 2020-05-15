<h1 align="center">
  <a href="https://www.hexa.run">Welcome to 𝖧𝖤𝖷△</a>
</h1>

<p align="center">Hexa – The ultimate companion for the Azure CLI. Setup and deploy in seconds.</p>
<p align="center">
  <img width="200" align="center" src="https://raw.githubusercontent.com/manekinekko/hexa/master/docs/hexa-title.png"/>
</p>

<p align="center" >
   <a href="https://www.hexa.run">
    <img src="https://img.shields.io/website-up-down-5abdca-ff69b4/http/shields.io.svg?label=hexa.run"/>
  </a>
  
  <img alt="GitHub" src="https://img.shields.io/github/license/manekinekko/hexa">
</p>

<p align="center" >
  
  <a href="https://github.com/manekinekko/hexa/issues">
    <img src="http://isitmaintained.com/badge/resolution/manekinekko/hexa.svg"/>
  </a>

  <a href="https://www.npmjs.com/package/@manekinekko/hexa">
    <img alt="npm" src="https://img.shields.io/npm/dm/@manekinekko/hexa?color=%235abdca">
  </a>
 
  <img alt="npm (scoped with tag)" src="https://img.shields.io/npm/v/@manekinekko/hexa/latest?color=5abdca">
  
  <br/>
  
  <img alt="GitHub contributors" src="https://img.shields.io/github/contributors/manekinekko/hexa?color=5abdca">
  <img alt="GitHub last commit" src="https://img.shields.io/github/last-commit/manekinekko/hexa?color=5abdca">
  <img alt="GitHub commit activity" src="https://img.shields.io/github/commit-activity/w/manekinekko/hexa?color=5abdca">
  <br/>
  
  <a href="https://twitter.com/manekinekko">
    <img src="https://img.shields.io/badge/say-thanks-ff69b4.svg"/>
  </a>

  <a href="https://twitter.com/manekinekko">  
    <img alt="Twitter Follow" src="https://img.shields.io/twitter/follow/manekinekko?style=social">
  </a>
  
</p>

## What is Hexa?

[Hexa](https://www.hexa.run) is a open source command line tool to easily setup and deploy your applications to Microsoft Azure. It takes full advantage of the Azure CLI, the Azure Function Core Tools CLI and the NPM CLI.

Hexa allows you to seamlessly configure, setup and deploy to different Azure services such as Resource Groups, Storage accounts, Hosting, Azure Functions and Databases (CosmosDB and Table Storage).

Hexa is driven by community contributions. Please send us your Pull Requests and feedback!

## Get started

### Required tools

In order to use Hexa, you will need to install both the Azure CLI and Functions Core Tools:
- Follow the official guide to install the [Azure CLI](http://bit.ly/2mgwpYr).
- Follow the official guide to install the [Azure Functions Core Tools](http://bit.ly/2ow8C7y).
- NPM and Node.js.

Once these tools are installed and available on your system, you are ready to install and use the Hexa CLI.

### Installing the Hexa CLI

You can install the Hexa CLI using `npm` or `yarn`:

```bash
$ npm install --global @manekinekko/hexa
```

To make sure the Hexa CLI has been installed correctly, you can execute the `hexa` command from anywhere in your system and you should see the default usage output:

```bash
Usage: hexa <command>

Options:
  -V, --version          output the version number
  login                  connect to your Azure
  init                   initialize a new workspace
  deploy                 deploy to Azure
  -c, --create           enable manual resource creation (default: false)
  -d, --debug            enable debug mode (default: false)
  -j, --just <services>  setup or deploy only the selected services (e.g. --just functions,hosting) (default: false)
  -l, --login            force login (default: false)
  -m, --manual           enter Manual mode (default: false)
  -r, --reset            reset (delete) local configuration (default: false)
  -s, --sas              use SAS token (only: storage and database) (default: false)
  -t, --token            generate a Storage token into a .env file (default: false)
  -u, --use <builder>    use a specific build system (e.g. tsc,bazel) (default: "tsc")
  -v, --verbose          enable verbose mode (default: false)
  -y, --yes              answer yes to all confirmations (default: false)
  --dry-run              do not execute real commands. (default: false)
  --yolo                 enable all modes and all services (default: false)
  -h, --help             output usage information
```

## Usage

In order to use the Hexa CLI to configure and set up your Azure services, run the `hexa init` command inside one of your projects that you want to set up for Azure. The Hexa CLI will guide you through the setup process.

For example, if you want to set up your project `Foo` that lives inside the `./foo` folder, here are the steps:

1. `$ cd foo`
1. `$ hexa init`

Once your project is setup and configured, you will see a newly created file called `hexa.json`. This file contains the configuration for your project `Foo`. 

Whenever your project Foo is ready to be deployed to Azure, you can use the `hexa deploy` command inside the `./foo` folder and let Hexa take care of the deploy process.

### Examples

- `$ hexa init --just=hosting,functions`: Hexa will setup and configure just the requested services. Current supported services are `hosting`, `functions` and `database`. Please note that a Resource Group and a Storage Accout will automatically be setup as these are required by the other services.

- `$ hexa init --token`: Hexa will also create a `.env` file which contains the Connection String token for your storage account. Hexa does not use this token! It is meant for you to use.

- `$ hexa init --token --sas`: Hexa will generate a SAS token for your storage account (instead of a Connection String).

- `$ hexa init --manual`: Hexa will enter Manual Mode and will ask you to make a choice for each step.

- `$ hexa init --manual --create`: In manual mode, by default, Hexa would only let you choose a resource from your existing ones. The `--create` flag allows you to manually create a new resource/service at your convenience.

- `$ hexa init --yolo`: Hexa will enter Auto Mode and will setup all supported services (except if you use the `--just` flag) without asking you any question.

### Running on CI

### Notes

If you want to run Hexa on a Continuous Integration enviroment, you will need to make sure that the required dependencies ([see above](#Required-tools)) are installed.

#### Set up Hexa for CI

1. On your local machine, make sure you are logged in to your Azure account from the CLI by running `hexa login`.
1. Then run `hexa ci` to create a Service Principal account. You should have a similar output:

```
{
  appId: 'xx4362xx-aaxx-40xx-8bxx-xx6ea0c351xx',
  displayName: 'appname',
  name: 'http://appname',
  password: 'xxce72xx-1axx-44xx-81xx-35xxb15xxa1e',
  tenant: 'xxf988xx-86xx-41xx-91xx-2d7cd011dbxx'
}
```

1. Configure your CI with the following environment variables (secrets):
  - `AZURE_SERVICE_PRINCIPAL_ID`: the `appId` from the service principal config.
  - `AZURE_SERVICE_PRINCIPAL_PASSWORD`: the `password` from the service principal config.
  - `AZURE_SERVICE_PRINCIPAL_TENANT`: The `tenant` from the service principal config.

1. On your CI environment, before deploying with Hexa, run `hexa login`. Hexa will attempt to login to your Azure account using these service principal credentials. Hexa will automatically detect and use the environment variables if they are set.

1. Then, simply run the usual `hexa deploy` command.

Enjoy!

## Want to help? [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/manekinekko/hexa/issues)
Want to file a bug, contribute some code, or improve the documentation? Excellent! Read up on our guidelines for [contributing](https://github.com/manekinekko/hexa/blob/master/CONTRIBUTING.md) and then check out one of our issues in the hotlist: [community-help](https://github.com/manekinekko/hexa/issues).
