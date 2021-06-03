import * as utils from "../core/utils";
import * as prompt from "../core/prompt";
import login from './login';

describe("login", () => {
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

  it("should save workspace", async () => {
    jest.spyOn(utils, "az").mockImplementationOnce(() =>
      Promise.resolve([
        {
          id: "test_id",
          name: "name",
          location: "location",
        },
      ])
    );
    const result = await login();
    expect(result).toBe(undefined);
  });

  it("should not save workspace", async () => {
    process.env = {
      AZURE_SERVICE_PRINCIPAL_ID: "AZURE_SERVICE_PRINCIPAL_ID",
      AZURE_SERVICE_PRINCIPAL_PASSWORD: "AZURE_SERVICE_PRINCIPAL_PASSWORD",
      AZURE_SERVICE_PRINCIPAL_TENANT: "AZURE_SERVICE_PRINCIPAL_TENANT",
    };
    jest.spyOn(utils, "az").mockImplementationOnce(() => Promise.resolve());
    const result = await login();
    expect(result).toBe(true);
  });
});
