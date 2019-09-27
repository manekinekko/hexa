#!/usr/bin/env node

import chalk from "chalk";
import clear from "clear";
import program from "commander";
const CFonts = require("cfonts");
const prettyFont = CFonts.render("Hexa", {
  font: "block",
  colors: ["cyan", 'yellow'],
  letterSpacing: 1
});

clear();
console.log(prettyFont.string);

(async () => {
  const start = process.hrtime();

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
    .name("hexa")
    .usage("<command>")
    .version(require("../package.json").version)
    .option("login", "connect to your Azure")
    .option("init", "initialize a new workspace")
    .option("deploy", "deploy to Azure")
    .option("-f, --force", "override all confirmations", false)
    .option("-r, --relogin", "force login", false)
    .option("-c, --create", "enable resource creation", true)
    .option("-s, --sas", "use SAS token (only: storage and database)", false)
    .option("-m, --manual", "enable Manual mode", false)
    .option("-d, --debug", "enable debug mode", false)
    .parse(process.argv);

  if (program.debug) {
    process.env.DEBUG = "*";
  }
  if (program.force) {
    process.env.HEXA_FORCE_MODE = "1";
  }
  if (program.manual === false) {
    process.env.HEXA_AUTO_MODE = "1";
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

  const end = process.hrtime(start);
  console.info(chalk.green("✔ Done in %d seconds."), end[0]);
})();
