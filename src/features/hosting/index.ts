import { QuestionCollection } from "inquirer";
import { createDirectoryIfNotExists } from "../../lib/utils";
import inquirer = require("inquirer");

// Note: use commonJs exports
module.exports = async function(): Promise<inquirer.Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "folder",
      message: "Enter public folder (will be created if not present):",
      default: "public",
      validate: function(value: string) {
        if (value && value.length) {
          // TODO: copy template files if new created folder
          return createDirectoryIfNotExists(value);
        } else {
          return "Please enter a public folder.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
};
