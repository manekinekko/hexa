import * as utils from "../core/utils";
import * as prompt from "../core/prompt";

describe("login", () => {
  jest.spyOn(utils, "az").mockImplementationOnce(() =>
    Promise.resolve([
      {
        id: "test_id",
        name: "name",
        location: "location",
      },
    ])
  );

  jest.spyOn(prompt, "chooseSubscription").mockImplementationOnce(() =>
    Promise.resolve({
      subscription: "test_id",
    })
  );

  jest.spyOn(utils, "saveWorkspace").mockImplementationOnce((arg) => {
    expect(arg?.subscription?.id).toBe("test_id");
    expect(arg?.subscription?.name).toBe("name");
    return false;
  });

  it("should log principal service", async () => {
    const login = require("./login");
    await login();
  });
});
