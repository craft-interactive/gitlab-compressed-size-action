import { getReadableFileSize, parseReadableFileSize } from "./index";

describe("getReadableFileSize()", () => {
  it("should a human readable string for the given bytes", () => {
    expect(getReadableFileSize(0)).toBe("0 Bytes");
    expect(getReadableFileSize(200)).toBe("200 Bytes");
    expect(getReadableFileSize(200 * 1024)).toBe("200 KB");
    expect(getReadableFileSize(200 * 1024 * 1024)).toBe("200 MB");
  });
});

describe("parseReadableFileSize()", () => {
  it("should bytes for the human readable string", () => {
    expect(parseReadableFileSize("0 Bytes")).toBe(0);
    expect(parseReadableFileSize("200 Bytes")).toBe(200);
    expect(parseReadableFileSize("200 KB")).toBe(200 * 1024);
    expect(parseReadableFileSize("200 MB")).toBe(200 * 1024 * 1024);
  });

  it("throw an error for malformed input strings", () => {
    expect(() => parseReadableFileSize("nope")).toThrowError(
      'Unable to detect size for "nope"'
    );
    expect(() => parseReadableFileSize("MB")).toThrowError(
      'Unable to detect size for "MB"'
    );
    expect(() => parseReadableFileSize("0")).toThrowError(
      'Unable to detect size for "0"'
    );
  });
});
