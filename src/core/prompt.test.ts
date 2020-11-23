import * as promptModule from "./prompt";

jest.mock("inquirer");
const { expectPrompts } = require("inquirer");

describe("prompt", async () => {
  it("should chooseSubscription", () => {
    expectPrompts([
      {
        message: "Choose a subscription:",
        type: "list",
        choices: ["test1", "test2"],
      },
    ]);

    promptModule.chooseSubscription([
      {
        id: "AUTOMATIC",
        name: "test1",
      },
      {
        id: "AUTOMATIC",
        name: "test2",
      },
    ]);
  });
});
