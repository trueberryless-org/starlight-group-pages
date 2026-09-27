import { describe, expect, test } from "vitest";

import {
  addGroupPageLinks,
  getGroupEntries,
  getGroupLabelLink,
  getSidebarOverviews,
  isSidebarGroupOpen,
} from "../libs/sidebar";
import {
  createConfig,
  createContext,
  createDocs,
  createEntry,
  createGroup,
  createLink,
} from "./mocks";

const docs = createDocs([
  createEntry("index"),
  createEntry("getting-started"),
  createEntry("guides/a"),
  createEntry("guides/b"),
  createEntry("guides/advanced/c"),
  createEntry("reference", { title: "Reference" }),
  createEntry("reference/api"),
  createEntry("secret", { sidebar: { hidden: true } }),
  createEntry("secret/d"),
]);

const options = {
  config: createConfig(),
  context: createContext(),
  docs,
  locale: undefined,
};

describe("getSidebarOverviews", () => {
  test("maps groups to the common directory of their links", () => {
    const advanced = createGroup("Advanced", [
      createLink("/guides/advanced/c/"),
    ]);
    const guides = createGroup("Guides", [
      createLink("/guides/a/"),
      createLink("/guides/b/"),
      advanced,
    ]);

    expect(getSidebarOverviews([guides], options)).toEqual([
      { directory: "guides", group: guides, href: "/guides/", slug: "guides" },
      {
        directory: "guides/advanced",
        group: advanced,
        href: "/guides/advanced/",
        slug: "guides/advanced",
      },
    ]);
  });

  test("treats links to index pages as part of their directory", () => {
    const reference = createGroup("Reference", [
      createLink("/reference/"),
      createLink("/reference/api/"),
    ]);

    expect(getSidebarOverviews([reference], options)[0]?.directory).toBe(
      "reference"
    );
  });

  test("ignores groups spanning multiple directories", () => {
    const group = createGroup("Start", [
      createLink("/getting-started/"),
      createLink("/guides/a/"),
    ]);

    expect(getSidebarOverviews([group], options)).toEqual([]);
  });

  test("ignores external links and groups without internal links", () => {
    const withExternal = createGroup("Guides", [
      createLink("/guides/a/"),
      createLink("https://astro.build"),
    ]);
    const externalOnly = createGroup("Links", [
      createLink("https://astro.build"),
    ]);

    expect(
      getSidebarOverviews([withExternal, externalOnly], options).map(
        ({ group }) => group.label
      )
    ).toEqual(["Guides"]);
  });

  test("assigns a directory to the first matching group only", () => {
    const inner = createGroup("Inner", [createLink("/guides/a/")]);
    const outer = createGroup("Outer", [inner]);

    expect(getSidebarOverviews([outer], options).map(({ group }) => group)).toEqual(
      [outer]
    );
  });

  test("ignores excluded directories", () => {
    const guides = createGroup("Guides", [
      createLink("/guides/a/"),
      createGroup("Advanced", [createLink("/guides/advanced/c/")]),
    ]);

    expect(
      getSidebarOverviews([guides], {
        ...options,
        config: createConfig({ exclude: ["guides/*"] }),
      }).map(({ directory }) => directory)
    ).toEqual(["guides"]);
  });

  test("supports localized links", () => {
    const context = createContext({ hasRootLocale: true, locales: ["fr"] });
    const localizedDocs = createDocs(
      [createEntry("guides/a"), createEntry("fr/guides/a")],
      context
    );
    const guides = createGroup("Guides", [createLink("/fr/guides/a/")]);

    expect(
      getSidebarOverviews([guides], {
        ...options,
        context,
        docs: localizedDocs,
        locale: "fr",
      })
    ).toEqual([
      {
        directory: "guides",
        group: guides,
        href: "/fr/guides/",
        slug: "fr/guides",
      },
    ]);
  });
});

describe("addGroupPageLinks", () => {
  test("adds a link to the overview page at the start of groups", () => {
    const guides = createGroup("Guides", [createLink("/guides/a/")]);
    const overviews = getSidebarOverviews([guides], options);

    expect(
      addGroupPageLinks(overviews, {
        ...options,
        mode: "item",
        currentSlug: "guides",
        label: "Overview",
      })
    ).toBe(true);
    expect(guides.entries[0]).toEqual(
      createLink("/guides/", "Overview", true)
    );
  });

  test("does not add a link when the group already links to the overview page", () => {
    const reference = createGroup("Reference", [
      createLink("/reference/"),
      createLink("/reference/api/"),
    ]);
    const overviews = getSidebarOverviews([reference], options);

    expect(
      addGroupPageLinks(overviews, {
        ...options,
        mode: "item",
        currentSlug: "",
        label: "Overview",
      })
    ).toBe(false);
    expect(reference.entries).toHaveLength(2);
  });

  test("does not add a link to hidden index pages", () => {
    const secret = createGroup("Secret", [createLink("/secret/d/")]);
    const overviews = getSidebarOverviews([secret], options);

    expect(
      addGroupPageLinks(overviews, {
        ...options,
        mode: "item",
        currentSlug: "",
        label: "Overview",
      })
    ).toBe(false);
  });
});

describe("addGroupPageLinks with the label mode", () => {
  const labelOptions = {
    ...options,
    currentSlug: "",
    label: "Overview",
    mode: "label" as const,
  };

  test("turns the group label into a link", () => {
    const guides = createGroup("Guides", [createLink("/guides/a/", "A")]);
    const overviews = getSidebarOverviews([guides], options);

    expect(
      addGroupPageLinks(overviews, { ...labelOptions, currentSlug: "guides" })
    ).toBe(true);
    expect(getGroupLabelLink(guides)).toMatchObject({
      href: "/guides/",
      isCurrent: true,
      label: "Guides",
    });
    expect(getGroupEntries(guides)).toEqual([createLink("/guides/a/", "A")]);
  });

  test("replaces an existing link to the group page", () => {
    const reference = createGroup("Reference", [
      createLink("/reference/api/", "API"),
      createLink("/reference/", "Reference"),
    ]);
    const overviews = getSidebarOverviews([reference], options);

    addGroupPageLinks(overviews, labelOptions);

    expect(getGroupLabelLink(reference)?.href).toBe("/reference/");
    expect(getGroupEntries(reference)).toEqual([
      createLink("/reference/api/", "API"),
    ]);
  });

  test("keeps groups with a hidden index page unchanged", () => {
    const secret = createGroup("Secret", [createLink("/secret/d/")]);
    const overviews = getSidebarOverviews([secret], options);

    expect(addGroupPageLinks(overviews, labelOptions)).toBe(false);
    expect(getGroupLabelLink(secret)).toBeUndefined();
  });
});

describe("isSidebarGroupOpen", () => {
  test("opens expanded groups and groups containing the current page", () => {
    const collapsed = { ...createGroup("A", [createLink("/a/")]), collapsed: true };

    expect(isSidebarGroupOpen(createGroup("A", [createLink("/a/")]))).toBe(true);
    expect(isSidebarGroupOpen(collapsed)).toBe(false);
    expect(
      isSidebarGroupOpen({
        ...collapsed,
        entries: [createGroup("B", [createLink("/b/", "B", true)])],
      })
    ).toBe(true);
  });
});
