#!/usr/bin/env node

import chalk from "chalk";
import clear from "clear";
import program from "commander";
import figlet from "figlet";
const CFonts = require("cfonts");
const prettyFont = CFonts.render("NITRO", {
  font: '3d',
  colors: ["candy"],
  letterSpacing: 5
});

clear();
console.log(prettyFont.string);

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
    .option("push", "deploy to Azure")
    .option("-d, --debug", "enable debug mode", false)
    .option("-c, --create", "enable resource creation", true)
    .option("-r, --relogin", "force login", false)
    .option("-s, --sas", "use SAS token (only: storage and database)", false)
    .option("-a, --auto", "enable Nitro Auto mode", true)
    .parse(process.argv);

  if (program.debug) {
    process.env.DEBUG = "*";
  }
  if (program.auto) {
    process.env.NITRO_AUTO_MODE = "1";
  }
  if (program.create) {
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
