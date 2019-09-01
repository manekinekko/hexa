import inquirer, { QuestionCollection, Answers } from "inquirer";
import { getCurrentDirectoryBase } from "./files";
import PromptUI from "inquirer/lib/ui/prompt";

export function askForFeatures(): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "checkbox",
      name: "features",
      message: "Choose the features you want to enable",
      choices: [{
        name: "hosting",
        checked: true
      }],
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please choose at least one feature.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function askForProjectDetails(): Promise<Answers> {
  const argv = require("minimist")(process.argv.slice(2));

  const questions: QuestionCollection = [
    {
      type: "input",
      name: "name",
      message: "Enter a name for the project:",
      default: argv._[0] || getCurrentDirectoryBase(),
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a name for the project.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
}

export function askIfOverrideProjectFile(): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "confirm",
      name: "override",
      message: "nitro.json found. Do you want to override it?",
      default: false
    }
  ];

  return inquirer.prompt(questions);
}
