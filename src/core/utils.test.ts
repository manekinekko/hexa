import mockFs from "mock-fs";
import * as utils from "./utils";

describe("utils", () => {
  afterEach(() => {
    mockFs.restore();
  });

  describe("pluralize", () => {
    it("should pluralize", () => {
      const str = "test";
      expect(utils.pluralize(str)).toBe(str + "s are");
    });

    it("should not pluralize", () => {
      const str = "a";
      expect(utils.pluralize(str)).toBe(str + " is");
    });
  });

  describe("az", () => {
    it("should output response in a JSON format", () => {
      const str = '{ "test": "test" }';
      jest.spyOn(utils, "runCmd").mockImplementationOnce(() => Promise.resolve(str));
      utils.az("").then((re) => expect(re).toBe({ test: "test" }));
    });
  });

  describe("directoryExists", () => {
    it("should return if the directory exists", () => {
      mockFs({
        "/test": {},
      });
      expect(utils.directoryExists("/test")).toBe(true);
      expect(utils.directoryExists("/other")).toBe(false);
    });
  });

  describe("createDirectoryIfNotExists", () => {
    it("should create a new directory", () => {
      mockFs({});
      expect(utils.createDirectoryIfNotExists("/test")).toBe(true);
      expect(utils.directoryExists("/test")).toBe(true);
    });
  });

  describe("fileExists", () => {
    it("should return if the file exists", () => {
      mockFs({
        "/test.txt": "content",
      });
      expect(utils.fileExists("/test.txt")).toBe(true);
      expect(utils.fileExists("/other.txt")).toBe(false);
    });
  });

  describe("readFileFromDisk", () => {
    it("should read a file", () => {
      mockFs({
        "/test.txt": "content",
      });
      expect(utils.readFileFromDisk("/test.txt")).toBe("content");
      expect(utils.readFileFromDisk("/other.txt")).toBe(null);
    });
  });

  describe("getFullPath", () => {
    it("should get full path", () => {
      expect(utils.getFullPath("test")).toBe(`${__dirname}/test`);
    });
  });

  describe("joinPath", () => {
    it("should join mutiple paths", () => {
      expect(utils.joinPath(...["/foo", "bar", "baz/asdf", "quux", ".."])).toBe("/foo/bar/baz/asdf");
    });
  });

  describe("updateFile", () => {
    it("should read a file", () => {
      mockFs({
        "/test.txt": "content",
      });
      expect(
        utils.updateFile({
          filepath: "/test.txt",
          replace: "content2",
          search: "*",
        })
      );
      expect(utils.readFileFromDisk("/test.txt")).toBe("content2");
    });
  });

  describe("absolutePath", () => {
    it("should resolve a file path", () => {
      expect(utils.absolutePath("test.txt")).toBe(`${process.cwd()}/test.txt`);
    });
  });

  describe("deleteFile", () => {
    it("should delete a file", () => {
      mockFs({
        "/test.txt": "content",
      });
      expect(utils.deleteFile("/test.txt")).toBe(undefined);
      expect(utils.fileExists("/test.txt")).toBe(false);
    });
  });
});
