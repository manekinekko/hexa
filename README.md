<h1 align="center">
  <a href="https://hexa.run">Welcome to HEX△</a>
</h1>

<p align="center">Hexa – The ultimate companion for the Azure CLI. Setup and deploy in seconds.</p>
<p align="center">
  <img width="200" align="center" src="https://github.com/manekinekko/hexa/raw/master/docs/hexa.png?raw=true"/>
</p>

<p align="center" >
   <a href="https://hexa.run">
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

[Hexa](https://hexa.run) is a open source command line tool to easily setup and deploy your applications to Microsoft Azure. It takes full advantage of the Azure CLI, the Azure Function Core Tools CLI and the NPM CLI.

Hexa allows to seamlessly configure, setup and deploy to different Azure services such as Resource Groups, Storage accounts, Hosting, Azure Functions and Databases (CosmosDB and Table Storage).

Hexa is driven by community contributions. Please send us your Pull Requests and feedback!

## Get started

### Required tools

In order to use Hexa, you will need to install both the Azure CLI and Functions Core Tools:
- Follow the official guide to install the [Azure CLI](http://bit.ly/2mgwpYr).
- Follow the official guide to install the [Azure Functions Core Tools](http://bit.ly/2ow8C7y).

Once these tools are installed and available on your system, you are ready to install and use the Hexa CLI.

### Installing the Hexa CLI

You can install the Hexa CLI using `npm` or `yarn`:

```bash
$ npm install --global @manekinekko/hexa
```

To make sure the Hexa CLI has been correctly, you can execute the `hexa` command from anywhere in your system and you should see the default usage output:

```bash
Usage: hexa <command>

Options:
  -V, --version  output the version number
  login          connect to your Azure
  init           initialize a new workspace
  deploy         deploy to Azure
  -f, --force    override all confirmations (default: false)
  -r, --relogin  force login (default: false)
  -c, --create   enable resource creation (default: true)
  -s, --sas      use SAS token (only: storage and database) (default: false)
  -m, --manual   enable Manual mode (default: false)
  -d, --debug    enable debug mode (default: false)
  --yolo         enale all modes and all services (default: false)
  -h, --help     output usage information
```

## Usage

In order to use the Hexa CLI to configure and setup your Azure services, run the `hexa init` command inside one of your project that you want to setup for Azure. The Hexa CLI will guide you through the setup process.

For example, if you want to setup your project `Foo`that lives inside the `./foo` folder, here are the steps:

1. `$ cd foo`
1. `$ hexa init`

Once your project is setup and configured, you will see a newly created file called `hexa.json`. This file contains the configuration for your project `Foo`. 

> Note: Hexa also creates a `.env` file which contains the connection token for your storage account. Hexa does not use this token! It is meant for you to use. You can delete this file if you are not using it.

Whenever your project Foo is ready to be deployed to Azure, you can use the `hexa deploy` inside the `./foo` folder and let Hexa takes care of the deploy process.

Enjoy!

## Want to help? [![contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg?style=flat)](https://github.com/manekinekko/hexa/issues)
Want to file a bug, contribute some code, or improve the documentation? Excellent! Read up on our guidelines for [contributing](https://github.com/manekinekko/hexa/blob/master/CONTRIBUTING.md) and then check out one of our issues in the hotlist: [community-help](https://github.com/manekinekko/hexa/issues).
