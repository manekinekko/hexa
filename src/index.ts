#!/usr/bin/env node

import chalk from "chalk";
import program from "commander";
const CFonts = require("cfonts");
const prettyFont = CFonts.render("HEXA", {
  font: "block",
  colors: ["cyan", "yellow"],
  letterSpacing: 1
});

console.log(prettyFont.string);

let debug: Function;

(async () => {
  const start = process.hrtime();

  const runCommand = async (commandName: string, requetedServices: string | undefined) => {
    try {
      const options: HexaInitOptions = {};

      if (requetedServices) {
        options.requestedServices = requetedServices
          .replace("k8s", "kubernetes") // remap aliases
          .split(",")
          .filter(feat => feat);
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
    .option("-c, --create", "enable manual resource creation", false)
    .option("-d, --debug", "enable debug mode", false)
    .option("-j, --just <services>", "setup or deploy only the selected services (e.g. --just functions,hosting)", false)
    .option("-l, --login", "force login", false)
    .option("-m, --manual", "enter Manual mode", false)
    .option("-r, --reset", "reset (delete) local configuration", false)
    .option("-s, --sas", "use SAS token (only: storage and database)", false)
    .option("-t, --token", "generate a Storage token into a .env file", false)
    .option("-u, --use <builder>", "use a specific build system (e.g. tsc,bazel)", "tsc")
    .option("-y, --yes", "answer yes to all confirmations", false)
    .option("--yolo", "enable all modes and all services", false)
    .parse(process.argv);

  // set confiuration
  // WARNING: order matters

  if (program.debug) {
    process.env.DEBUG = "*";
  }

  if (program.yolo) {
    program.yes = true;
    program.auto = true;
    program.token = true;
    process.env.HEXA_YOLO_MODE = "1";
  }

  if (program.reset) {
    process.env.HEXA_RESET_MODE = "1";
  }

  if (program.yes) {
    process.env.HEXA_FORCE_MODE = "1";
  }
  if (program.manual === false) {
    process.env.HEXA_AUTO_MODE = "1";
  }
  if (program.create) {
    process.env.HEXA_ENABLE_ADDING_NEW_RESOURCE = "1";
  }
  if (program.login) {
    process.env.HEXA_FORCE_LOGIN = "1";
  }
  if (program.sas) {
    process.env.HEXA_STORAGE_USE_SAS = "1";
    program.token = true;
  }
  if (program.token) {
    process.env.HEXA_STORAGE_GENERATE_TOKEN = "1";
  }
  if (program.use === "bazel") {
    process.env.HEXA_USE_BAZEL = "1";
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
