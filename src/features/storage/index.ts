import { QuestionCollection } from "inquirer";
import inquirer = require("inquirer");

// Note: use commonJs exports
module.exports = async function(): Promise<inquirer.Answers> {
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "name",
      message: "Enter your storage account name:",
      validate: function(value: string) {
        if (value.length) {
          return true;
        } else {
          return "Please enter a valid name.";
        }
      }
    }
  ];
  return inquirer.prompt(questions);
};
