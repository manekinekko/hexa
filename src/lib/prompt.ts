import inquirer, { Answers, QuestionCollection } from "inquirer";
import { getCurrentDirectoryBase } from "./utils";

export function chooseSubscription(subscriptionsList: any[]): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "list",
      name: "subscription",
      message: "Choose your subscription:",
      choices: subscriptionsList.map((sub: AzureSubscription) => {
        return {
          name: `${sub.name}`,
          disabled: sub.state !== "Enabled"
        };
      }),
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

export function askForFeatures(): Promise<Answers> {
  const questions: QuestionCollection = [
    {
      type: "checkbox",
      name: "features",
      message: "Choose the features you want to enable",
      choices: [
        {
          name: "storage",
          checked: true,
          required: true
        },
        {
          name: "hosting"
        },
        {
          name: "functions (coming soon)",
          disabled: true
        },
        {
          name: "database (coming soon)",
          disabled: true
        },
        {
          name: "cdn (coming soon)",
          disabled: true
        },
        {
          name: "auth (coming soon)",
          disabled: true
        }
      ],
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
  const questions: QuestionCollection = [
    {
      type: "input",
      name: "name",
      message: "Enter a name for the project:",
      default: getCurrentDirectoryBase(),
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
      message: "Configuration file found. Do you want to override it?",
      default: false
    }
  ];

  return inquirer.prompt(questions);
}
