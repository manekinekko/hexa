#!/usr/bin/env node

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
  program
    .name("nitro")
    .usage("<command>")
    .version(require("../package.json").version)
    .option("--init", "initialise a new workspace")
    .option("--login", "connect to your Azure")
    .parse(process.argv);

  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }

  const commandName = program.args[0];

  (await require(`./commands/${commandName}`))();
})();
