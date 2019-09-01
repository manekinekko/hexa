#!/usr/bin/env node

process.env.DEBUG = "*";

import chalk from "chalk";
import clear from "clear";
import figlet from "figlet";
import program from "commander";

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

  runCommand(commandName.replace("--", ""));
})();
