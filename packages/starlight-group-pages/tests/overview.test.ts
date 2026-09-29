import { describe, expect, test } from "vitest";

import { getDirectoryOverview, getGroupOverview } from "../libs/overview";
import { type SidebarOverview, getSidebarOverviews } from "../libs/sidebar";
import {
  createConfig,
  createContext,
  createDocs,
  createEntry,
  createGroup,
  createLink,
} from "./mocks";

const docs = createDocs([
  createEntry("guides/a", { title: "A", description: "About A" }),
  createEntry("guides/b", {
    title: "B",
    sidebar: { label: "Bee", order: 1 },
  }),
  createEntry("guides/c", { title: "C", sidebar: { hidden: true } }),
  createEntry("guides/advanced", {
    title: "Advanced",
    description: "About advanced",
  }),
  createEntry("guides/advanced/d", { title: "D" }),
]);

function getFirstOverview(overviews: SidebarOverview[]): SidebarOverview {
  const [overview] = overviews;
  if (!overview) throw new Error("Expected an overview.");

  return overview;
}

function getOptions(overviews: SidebarOverview[] = []) {
  return {
    config: createConfig(),
    context: createContext(),
    docs,
    lang: "en",
    locale: undefined,
    overviews,
  };
}

describe("getGroupOverview", () => {
  test("lists the group entries with their descriptions", () => {
    const advanced = createGroup("advanced", [
      createLink("/guides/advanced/", "Advanced"),
      createLink("/guides/advanced/d/", "D"),
    ]);
    const guides = createGroup("Guides", [
      createLink("/guides/a/", "A"),
      advanced,
      createLink("https://astro.build", "Astro"),
    ]);
    const sidebar = [guides];
    const overviews = getSidebarOverviews(sidebar, getOptions());

    expect(
      getGroupOverview(getFirstOverview(overviews), {
        ...getOptions(),
        overviews,
      })
    ).toEqual({
      title: "Guides",
      description: "A, advanced, and Astro",
      entries: [
        {
          type: "link",
          label: "A",
          href: "/guides/a/",
          description: "About A",
        },
        {
          type: "link",
          label: "advanced",
          href: "/guides/advanced/",
          description: "About advanced",
        },
        {
          type: "link",
          label: "Astro",
          href: "https://astro.build",
          description: undefined,
        },
      ],
    });
  });

  test("omits the group page", () => {
    const advanced = createGroup("advanced", [
      createLink("/guides/advanced/", "Advanced", true),
      createLink("/guides/advanced/d/", "D"),
    ]);
    const overviews = getSidebarOverviews([advanced], getOptions());

    expect(
      getGroupOverview(getFirstOverview(overviews), {
        ...getOptions(),
        overviews,
      }).entries.map(({ label }) => label)
    ).toEqual(["D"]);
  });

  test("lists the current page when it is not the group page", () => {
    const guides = createGroup("Guides", [
      createLink("/guides/a/", "A", true),
      createLink("/guides/b/", "Bee"),
    ]);
    const overviews = getSidebarOverviews([guides], getOptions());

    expect(
      getGroupOverview(getFirstOverview(overviews), {
        ...getOptions(),
        overviews,
      }).entries.map(({ label }) => label)
    ).toEqual(["A", "Bee"]);
  });

  test("renders nested groups without an overview page as groups", () => {
    const options = {
      ...getOptions(),
      config: createConfig({ exclude: ["guides/advanced"] }),
    };
    const advanced = createGroup("advanced", [
      createLink("/guides/advanced/d/", "D"),
    ]);
    const guides = createGroup("Guides", [
      createLink("/guides/a/", "A"),
      advanced,
    ]);
    const overviews = getSidebarOverviews([guides], options);

    expect(
      getGroupOverview(getFirstOverview(overviews), { ...options, overviews })
        .entries[1]
    ).toEqual({
      type: "group",
      label: "advanced",
      entries: [
        {
          type: "link",
          label: "D",
          href: "/guides/advanced/d/",
          description: undefined,
        },
      ],
    });
  });
});

describe("getGroupOverview descriptions", () => {
  test("summarizes nested groups without an index page description", () => {
    const summaryDocs = createDocs([
      createEntry("guides/a", { title: "A" }),
      createEntry("guides/advanced/b", { title: "B" }),
      createEntry("guides/advanced/c", { title: "C" }),
    ]);
    const options = { ...getOptions(), docs: summaryDocs };
    const advanced = createGroup("Advanced", [
      createLink("/guides/advanced/b/", "B"),
      createLink("/guides/advanced/c/", "C"),
    ]);
    const guides = createGroup("Guides", [
      createLink("/guides/a/", "A"),
      advanced,
    ]);
    const overviews = getSidebarOverviews([guides], options);

    expect(
      getGroupOverview(getFirstOverview(overviews), { ...options, overviews })
        .entries[1]
    ).toEqual({
      type: "link",
      label: "Advanced",
      href: "/guides/advanced/",
      description: "B and C",
    });
  });
});

describe("getDirectoryOverview", () => {
  test("lists the visible pages and subdirectories sorted like the sidebar", () => {
    expect(getDirectoryOverview("guides", getOptions())).toEqual({
      title: "guides",
      description: "Bee, A, and Advanced",
      entries: [
        {
          type: "link",
          label: "Bee",
          href: "/guides/b/",
          description: undefined,
        },
        {
          type: "link",
          label: "A",
          href: "/guides/a/",
          description: "About A",
        },
        {
          type: "link",
          label: "Advanced",
          href: "/guides/advanced/",
          description: "About advanced",
        },
      ],
    });
  });

  test("summarizes subdirectories with the labels of their direct children only", () => {
    const nestedDocs = createDocs([
      createEntry("guides/a", { title: "A" }),
      createEntry("guides/advanced/b", { title: "B" }),
      createEntry("guides/advanced/deep/c", { title: "C" }),
    ]);

    expect(
      getDirectoryOverview("guides", {
        ...getOptions(),
        docs: nestedDocs,
      }).entries[1]
    ).toEqual({
      type: "link",
      label: "advanced",
      href: "/guides/advanced/",
      description: "B and deep",
    });
  });

  test("uses the title of the index page", () => {
    expect(
      getDirectoryOverview("guides/advanced", getOptions())
        .title
    ).toBe("Advanced");
  });
});
