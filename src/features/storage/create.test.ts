import * as prompt from "../../core/prompt";
import * as utils from "../../core/utils";
import create from "./create";

const debugCalls: string[] = [];

jest.mock("./tokens", () => () => Promise.resolve(true));

describe("create", () => {
  let spyOnDebug: jest.MockInstance<any, any>;

  beforeEach(() => {

    jest.spyOn(prompt, "askForStorageAccountDetails").mockImplementationOnce(() =>
      Promise.resolve([
        {
          id: "test_id",
          name: "name",
          location: "location",
        },
      ])
    );

    jest.spyOn(utils, "az").mockImplementationOnce(() =>
      Promise.resolve({
        id: "test_id",
        name: "name",
        location: "location",
      })
    );

    jest.spyOn(utils, "uuid").mockImplementationOnce(() => "123");

    jest.spyOn(utils, "readWorkspace").mockImplementation(() => ({
      storage: {
        id: "AUTOMATIC",
        name: "name",
        location: "location",
      },
      project: {
        id: "AUTOMATIC",
        name: "name",
        location: "location",
      },
      subscription: {
        id: "AUTOMATIC",
        name: "name",
        state: "Enabled",
      },
      registry: {
        id: "AUTOMATIC",
        name: "name",
        hostname: "hostname",
      },
    }));

    jest.spyOn(utils, "saveWorkspace").mockImplementationOnce((arg) => {
      expect(arg?.storage?.id).toBe("test_id");
      expect(arg?.storage?.name).toBe("name");
      expect(arg?.storage?.location).toBe("location");
      return false;
    });
    spyOnDebug = jest.spyOn(utils, "debug").mockImplementation((arg) => {
      debugCalls.push(arg);
    });
  });

  it("should create a workspace", async () => {
    const result = await create("AUTOMATIC");
    expect(spyOnDebug.mock.calls.length).toBe(1);
    expect(debugCalls.length).toBe(3);
    expect(debugCalls[0]).toEqual("using project name123");
    expect(debugCalls[1]).toEqual("using subscription \u001b[32mname\u001b[39m");
    expect(debugCalls[2]).toEqual('storage {"id":"test_id","name":"name","location":"location"}');
    expect(result).toBe(true);
  });
});
