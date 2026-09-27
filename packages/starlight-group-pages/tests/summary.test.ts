import { describe, expect, test } from "vitest";

import { getLabelsSummary } from "../libs/summary";

describe("getLabelsSummary", () => {
  test("returns nothing without labels", () => {
    expect(getLabelsSummary([], "en")).toBeUndefined();
  });

  test("lists up to three labels", () => {
    expect(getLabelsSummary(["A"], "en")).toBe("A");
    expect(getLabelsSummary(["A", "B"], "en")).toBe("A and B");
    expect(getLabelsSummary(["A", "B", "C"], "en")).toBe("A, B, and C");
  });

  test("truncates longer lists", () => {
    expect(getLabelsSummary(["A", "B", "C", "D"], "en")).toBe("A, B, C, …");
  });

  test("uses the list conventions of the language", () => {
    expect(getLabelsSummary(["A", "B", "C"], "de")).toBe("A, B und C");
    expect(getLabelsSummary(["A", "B", "C", "D"], "ja")).toBe("A、B、C、…");
  });
});
