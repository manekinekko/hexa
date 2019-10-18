#!/usr/bin/env node

import chalk from "chalk";
import clear from "clear";
import program from "commander";
const CFonts = require("cfonts");
const prettyFont = CFonts.render("HEXA", {
  font: "block",
  colors: ["cyan", "yellow"],
  letterSpacing: 1
});

clear();
console.log(prettyFont.string);

(async () => {
  const start = process.hrtime();

  const runCommand = async (commandName: string, requetedServices: string | undefined) => {
    try {
      const options: NitroInitOptions = {};

      if (requetedServices) {
        options.requetedServices = requetedServices.split(",").filter(feat => feat);
      }

      return (await require(`./commands/${commandName}`))(options);
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
    .option("-y, --yes", "answer yes to all confirmations", false)
    .option("-r, --relogin", "force login", false)
    .option("-c, --create", "enable resource creation", false)
    .option("-m, --manual", "enable Manual mode", false)
    .option("-d, --debug", "enable debug mode", false)
    .option("-s, --sas", "use SAS token (only: storage and database)", false)
    .option("-t, --token", "generate a Storage token into a .env file", false)
    .option("-j, --just <services>", "setup or deploy only the selected services (e.g. --just functions,hosting)", false)
    .option("--yolo", "enable all modes and all services", false)
    .parse(process.argv);

  // set confiuration
  // WARNING: order matters
  if (program.yolo) {
    program.yes = true;
    program.auto = true;
    program.token = true;
    process.env.HEXA_YOLO_MODE = "1";
  }

  if (program.debug) {
    process.env.DEBUG = "*";
  }
  if (program.yes) {
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
    program.token = true;
  }
  if (program.token) {
    process.env.NITRO_STORAGE_GENERATE_TOKEN = "1";
  }

  // use process.argv not program.argv
  const commandName = process.argv[2];

  if (!process.argv.slice(2).length || !commandName) {
    program.outputHelp();
    process.exit(0);
  }
  await runCommand(commandName.replace("--", ""), program.just);

  const end = process.hrtime(start);
  console.info(chalk.green("✔ Done in %d seconds."), end[0]);
})();
