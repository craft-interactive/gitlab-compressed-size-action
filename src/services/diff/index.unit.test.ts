import { createDiff } from "./index";

describe("createDiff()", () => {
  it("should return a diff for unchanged file size comparisons", () => {
    const results = createDiff({
      id: "foo/bar.js",
      sizes: { current: 200, last: 200 },
      threshold: 200,
    });

    expect(results).toMatchObject({
      id: "foo/bar.js",
      status: "unchanged",
      change: { raw: 0, percent: 0.0, pretty: "0 Bytes" },
      size: { raw: 200, pretty: "200 Bytes" },
      isBelowThreshold: true,
    });
  });

  it("should return a diff for increase file size comparisons", () => {
    const results = createDiff({
      id: "foo/bar.js",
      sizes: { current: 224, last: 200 },
      threshold: 200,
    });

    expect(results).toMatchObject({
      id: "foo/bar.js",
      status: "increased",
      change: { raw: 24, percent: 12.0, pretty: "+24 Bytes" },
      size: { raw: 224, pretty: "224 Bytes" },
      isBelowThreshold: false,
    });
  });

  it("should return a diff for decrease file size comparisons", () => {
    const results = createDiff({
      id: "foo/bar.js",
      sizes: { current: 129, last: 200 },
      threshold: 200,
    });

    expect(results).toMatchObject({
      id: "foo/bar.js",
      status: "decreased",
      change: { raw: -71, percent: 35.5, pretty: "-71 Bytes" },
      size: { raw: 129, pretty: "129 Bytes" },
      isBelowThreshold: true,
    });
  });

  it("should return a diff for new file sizes", () => {
    const results = createDiff({
      id: "foo/bar.js",
      sizes: { current: 200, last: 0 },
      threshold: 200,
    });

    expect(results).toMatchObject({
      id: "foo/bar.js",
      status: "added",
      change: { raw: 200, percent: 100.0, pretty: "+200 Bytes" },
      size: { raw: 200, pretty: "200 Bytes" },
      isBelowThreshold: true,
    });
  });
});
