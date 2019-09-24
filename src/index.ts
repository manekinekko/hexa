#!/usr/bin/env node

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
    .option("login", "connect to your Azure")
    .option("init", "initialise a new workspace")
    .option("push", "deploy the app to Azure")
    .option("-d, --debug", "enable debug mode", false)
    .option("-a, --auto", "enable auto mode", true)
    .option("-r, --relogin", "force login", false)
    .option("-s, --sas", "use SAS token (only: storage and database)", false)
    .parse(process.argv);

  if (program.debug) {
    process.env.DEBUG = "*";
  }
  if (program.auto) {
    process.env.NITRO_ENABLE_ADDING_NEW_RESOURCE = "1";
  }
  if (program.relogin) {
    process.env.NITRO_FORCE_LOGIN = "1";
  }
  if (program.sas) {
    process.env.NITRO_STORAGE_USE_SAS = "1";
  }

  // use process.argv not program.argv
  const commandName = process.argv[2];

  if (!process.argv.slice(2).length || !commandName) {
    program.outputHelp();
    process.exit(0);
  }
  await runCommand(commandName.replace("--", ""));
})();
