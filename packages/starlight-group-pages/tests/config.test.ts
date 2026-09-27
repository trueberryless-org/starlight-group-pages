import { AstroError } from "astro/errors";
import { describe, expect, test } from "vitest";

import { validateConfig } from "../libs/config";

describe("validateConfig", () => {
  test("returns the default configuration", () => {
    expect(validateConfig(undefined)).toEqual({
      exclude: [],
      extendIndexPages: true,
      layout: "grid",
      sidebarLink: "item",
    });
  });

  test("returns a custom configuration", () => {
    expect(
      validateConfig({
        exclude: ["reference/**"],
        extendIndexPages: false,
        layout: "list",
        sidebarLink: false,
      })
    ).toEqual({
      exclude: ["reference/**"],
      extendIndexPages: false,
      layout: "list",
      sidebarLink: false,
    });
  });

  test("accepts all sidebar link modes", () => {
    expect(validateConfig({ sidebarLink: "label" }).sidebarLink).toBe("label");
    expect(validateConfig({ sidebarLink: false }).sidebarLink).toBe(false);
    expect(() => validateConfig({ sidebarLink: true })).toThrow(AstroError);
  });

  test("throws a readable error for invalid configurations", () => {
    expect(() => validateConfig({ layout: "table" })).toThrow(AstroError);
    expect(() => validateConfig({ layout: "table" })).toThrow(
      /Invalid starlight-group-pages configuration:[\s\S]*layout/
    );
  });
});
