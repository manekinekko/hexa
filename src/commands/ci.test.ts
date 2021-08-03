import * as utils from "../core/utils";
import ci from "./ci";

describe("ci", () => {
  jest.spyOn(utils, "readWorkspace").mockImplementationOnce(() => ({
    storage: {
      id: "AUTOMATIC",
      name: "",
      location: "",
    },
    project: {
      id: "AUTOMATIC",
      name: "",
      location: "",
    },
    subscription: {
      id: "AUTOMATIC",
      name: "",
      state: "Enabled",
    },
    registry: {
      id: "AUTOMATIC",
      name: "",
      hostname: "",
    },
  }));

  jest.spyOn(utils, "az").mockImplementationOnce(() =>
    Promise.resolve({
      message: "This is the message from az",
    })
  );

  console.log = jest.fn();

  it("should log principal service", async () => {
    await ci();
    expect(console.log).toHaveBeenCalledWith({ message: "This is the message from az" });
  });
});
