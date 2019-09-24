#!/usr/bin/env node

process.env.DEBUG = "*";
process.env.NITRO_ENABLE_ADDING_NEW_RESOURCE = "1";
// process.env.NITRO_STORAGE_USE_SAS = "1";
// process.env.NITRO_FORCE_LOGIN = "1";

import chalk from "chalk";
import clear from "clear";
import program from "commander";
import figlet from "figlet";

clear();
console.log(
  chalk.red(
    figlet.textSync("  NITRO", {
      font: "ANSI Shadow",
      horizontalLayout: "full"
    })
  )
);

(async () => {
  const runCommand = async (commandName: string) => {
    try {
      return (await require(`./commands/${commandName}`))();
    } catch (error) {
      console.error(chalk.red(`Command "${commandName}" not supported yet.`));
      console.error(chalk.red(error));
      program.outputHelp();
    }
  };
  program
    .name("nitro")
    .usage("<command>")
    .version(require("../package.json").version)
    .option("login, --login", "connect to your Azure")
    .option("init, --init", "initialise a new workspace")
    .option("push, --push", "deploy the app to Azure")
    .parse(process.argv);

  // use process.argv not program.argv
  const commandName = process.argv[2];

  if (!process.argv.slice(2).length || !commandName) {
    program.outputHelp();
    process.exit(0);
  }

  await runCommand(commandName.replace("--", ""));
})();
