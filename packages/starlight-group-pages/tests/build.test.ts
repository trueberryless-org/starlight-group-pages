import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { beforeAll, describe, expect, test } from "vitest";

import {
  buildFixture,
  getDocumentTitle,
  getOverviewCards,
  getPageTitle,
  getPagination,
  getSidebarLinks,
  hasCardGrid,
  readFixtureOutput,
} from "./utils";

function hasFixtureOutput(name: string, path: string) {
  return existsSync(
    fileURLToPath(new URL(`fixtures/${name}/dist/${path}`, import.meta.url))
  );
}

describe("basic", () => {
  beforeAll(async () => {
    const { output, status } = await buildFixture("basic");
    expect(status, output).toBe("success");
  });

  test("generates overview pages for directories without an index page", () => {
    expect(hasFixtureOutput("basic", "guides/index.html")).toBe(true);
    expect(hasFixtureOutput("basic", "guides/advanced/index.html")).toBe(true);
  });

  test("uses the sidebar group label as the title of generated overview pages", () => {
    const html = readFixtureOutput("basic", "guides/index.html");

    expect(getPageTitle(html)).toBe("Guides");
    expect(getDocumentTitle(html)).toBe("Guides | Group Pages");
    expect(html).toContain('<meta property="og:title" content="Guides"/>');
  });

  test("renders a link card for each entry of the sidebar group", () => {
    const html = readFixtureOutput("basic", "guides/index.html");

    expect(hasCardGrid(html)).toBe(true);
    expect(getOverviewCards(html)).toEqual([
      {
        description: "Install the package.",
        href: "/guides/installation/",
        title: "Installation",
      },
      {
        description: "Deploy the site.",
        href: "/guides/deployment/",
        title: "Deployment",
      },
      {
        description: "Plugins &lt;3 and Theming",
        href: "/guides/advanced/",
        title: "advanced",
      },
    ]);
  });

  test("describes generated pages with a summary of their entries", () => {
    const html = readFixtureOutput("basic", "guides/index.html");

    expect(html).toContain(
      '<meta name="description" content="Installation, Deployment, and advanced"/>'
    );
    expect(html).toContain(
      '<meta property="og:description" content="Installation, Deployment, and advanced"/>'
    );
  });

  test("escapes labels and descriptions", () => {
    const html = readFixtureOutput("basic", "guides/advanced/index.html");

    expect(getOverviewCards(html)).toContainEqual({
      description: "Extend &amp; enhance.",
      href: "/guides/advanced/plugins/",
      title: "Plugins &lt;3",
    });
  });

  test("adds overview links to the sidebar groups", () => {
    const html = readFixtureOutput("basic", "guides/installation/index.html");

    expect(getSidebarLinks(html)).toEqual([
      { href: "/", isCurrent: false, label: "Home" },
      { href: "/guides/", isCurrent: false, label: "Overview" },
      { href: "/guides/installation/", isCurrent: true, label: "Installation" },
      { href: "/guides/deployment/", isCurrent: false, label: "Deployment" },
      { href: "/guides/advanced/", isCurrent: false, label: "Overview" },
      {
        href: "/guides/advanced/plugins/",
        isCurrent: false,
        label: "Plugins &lt;3",
      },
      {
        href: "/guides/advanced/theming/",
        isCurrent: false,
        label: "Theming",
      },
      { href: "/reference/", isCurrent: false, label: "Reference" },
      { href: "/reference/api/", isCurrent: false, label: "API" },
      { href: "/reference/cli/", isCurrent: false, label: "CLI" },
    ]);
  });

  test("marks the overview link of generated overview pages as current", () => {
    const html = readFixtureOutput("basic", "guides/index.html");

    expect(getSidebarLinks(html)).toContainEqual({
      href: "/guides/",
      isCurrent: true,
      label: "Overview",
    });
  });

  test("includes overview pages in the pagination", () => {
    expect(
      getPagination(readFixtureOutput("basic", "guides/index.html"))
    ).toEqual({
      next: { href: "/guides/installation/", label: "Installation" },
      prev: { href: "/", label: "Home" },
    });
    expect(
      getPagination(readFixtureOutput("basic", "guides/installation/index.html"))
    ).toEqual({
      next: { href: "/guides/deployment/", label: "Deployment" },
      prev: { href: "/guides/", label: "Overview" },
    });
  });

  test("appends link cards to existing index pages", () => {
    const html = readFixtureOutput("basic", "reference/index.html");

    expect(html).toContain("Hand-written introduction.");
    expect(getOverviewCards(html)).toEqual([
      { description: "The API.", href: "/reference/api/", title: "API" },
      { description: undefined, href: "/reference/cli/", title: "CLI" },
    ]);
  });

  test("does not add overview links for groups with an index page", () => {
    const html = readFixtureOutput("basic", "reference/api/index.html");
    const labels = getSidebarLinks(html).map(({ label }) => label);

    expect(labels.slice(-3)).toEqual(["Reference", "API", "CLI"]);
  });

  test("does not render overview cards on other pages", () => {
    expect(
      getOverviewCards(readFixtureOutput("basic", "guides/installation/index.html"))
    ).toEqual([]);
    expect(getOverviewCards(readFixtureOutput("basic", "index.html"))).toEqual(
      []
    );
  });

  test("renders the link cards of a directory with the GroupPageCards component", () => {
    const html = readFixtureOutput("basic", "cards/index.html");

    expect(html).toContain("Content between the cards.");
    expect(getOverviewCards(html)).toEqual([
      {
        description: "Extend &amp; enhance.",
        href: "/guides/advanced/plugins/",
        title: "Plugins &lt;3",
      },
      {
        description: "Customize the theme.",
        href: "/guides/advanced/theming/",
        title: "Theming",
      },
      { description: "The API.", href: "/reference/api/", title: "API" },
      { description: undefined, href: "/reference/cli/", title: "CLI" },
    ]);
  });
});

describe("no-sidebar", () => {
  beforeAll(async () => {
    const { output, status } = await buildFixture("no-sidebar");
    expect(status, output).toBe("success");
  });

  test("supports the default autogenerated sidebar", () => {
    const html = readFixtureOutput("no-sidebar", "guides/index.html");

    expect(getPageTitle(html)).toBe("guides");
    expect(getSidebarLinks(html).slice(0, 2)).toEqual([
      { href: "/guides/", isCurrent: true, label: "Overview" },
      { href: "/guides/installation/", isCurrent: false, label: "Installation" },
    ]);
  });
});

describe("options", () => {
  beforeAll(async () => {
    const { output, status } = await buildFixture("options");
    expect(status, output).toBe("success");
  });

  test("does not generate overview pages for excluded directories", () => {
    expect(hasFixtureOutput("options", "guides/index.html")).toBe(true);
    expect(hasFixtureOutput("options", "guides/advanced/index.html")).toBe(
      false
    );
  });

  test("renders groups without an overview page as sections", () => {
    const html = readFixtureOutput("options", "guides/index.html");

    expect(getOverviewCards(html)).toEqual([
      {
        description: "Install the package.",
        href: "/guides/installation/",
        title: "Installation",
      },
      {
        description: "Deploy the site.",
        href: "/guides/deployment/",
        title: "Deployment",
      },
      { heading: "advanced", id: "advanced", level: 2 },
      {
        description: "Extend &amp; enhance.",
        href: "/guides/advanced/plugins/",
        title: "Plugins &lt;3",
      },
      {
        description: "Customize the theme.",
        href: "/guides/advanced/theming/",
        title: "Theming",
      },
    ]);
  });

  test("keeps a site-wide description like Starlight does", () => {
    const html = readFixtureOutput("options", "guides/index.html");

    expect(html.match(/<meta name="description"/g)).toHaveLength(1);
    expect(html).toContain(
      '<meta name="description" content="Site description"/>'
    );
    expect(html).toContain(
      '<meta property="og:description" content="Installation, Deployment, and advanced"/>'
    );
  });

  test("supports the list layout", () => {
    expect(hasCardGrid(readFixtureOutput("options", "guides/index.html"))).toBe(
      false
    );
  });

  test("does not extend index pages when disabled", () => {
    expect(
      getOverviewCards(readFixtureOutput("options", "reference/index.html"))
    ).toEqual([]);
  });

  test("does not add overview links to the sidebar when disabled", () => {
    const html = readFixtureOutput("options", "guides/index.html");

    expect(getSidebarLinks(html).map(({ label }) => label)).not.toContain(
      "Overview"
    );
    expect(getPagination(html)).toEqual({});
  });
});

describe("manual-sidebar", () => {
  beforeAll(async () => {
    const { output, status } = await buildFixture("manual-sidebar");
    expect(status, output).toBe("success");
  });

  test("detects the directory of manual sidebar groups", () => {
    const html = readFixtureOutput("manual-sidebar", "guides/index.html");

    expect(getPageTitle(html)).toBe("Guides");
    expect(getOverviewCards(html)).toEqual([
      {
        description: "Install the package.",
        href: "/guides/installation/",
        title: "Installation",
      },
      {
        description: "Deploy the site.",
        href: "/guides/deployment/",
        title: "Deployment",
      },
      {
        description: "Theming and Plugins &lt;3",
        href: "/guides/advanced/",
        title: "Advanced guides",
      },
      { description: undefined, href: "/guides/next/", title: "Next" },
      { description: undefined, href: "https://astro.build", title: "External" },
    ]);
  });

  test("does not add overview links to groups spanning multiple directories", () => {
    const html = readFixtureOutput("manual-sidebar", "getting-started/index.html");
    const labels = getSidebarLinks(html).map(({ label }) => label);

    expect(labels.slice(0, 2)).toEqual(["Getting Started", "Installation"]);
    expect(labels.slice(-2)).toEqual(["Getting Started", "API"]);
  });

  test("respects pagination frontmatter overrides", () => {
    expect(
      getPagination(readFixtureOutput("manual-sidebar", "guides/next/index.html"))
    ).toEqual({ next: { href: "https://astro.build", label: "External" } });
  });

  test("lists the pages of directories not matching a sidebar group", () => {
    const html = readFixtureOutput("manual-sidebar", "orphans/index.html");

    expect(getPageTitle(html)).toBe("orphans");
    expect(getOverviewCards(html)).toEqual([
      { description: "Second orphan.", href: "/orphans/two/", title: "Two" },
      { description: "First orphan.", href: "/orphans/one/", title: "One" },
    ]);
  });

  test("ignores directories only containing hidden pages", () => {
    expect(hasFixtureOutput("manual-sidebar", "secret/index.html")).toBe(false);
  });
});

describe("base-trailing-slash", () => {
  beforeAll(async () => {
    const { output, status } = await buildFixture("base-trailing-slash");
    expect(status, output).toBe("success");
  });

  test("supports the base and trailing slash options", () => {
    const html = readFixtureOutput("base-trailing-slash", "guides/index.html");

    expect(getSidebarLinks(html)).toContainEqual({
      href: "/docs/guides",
      isCurrent: true,
      label: "Overview",
    });
    expect(getOverviewCards(html)).toContainEqual({
      description: "Plugins &lt;3 and Theming",
      href: "/docs/guides/advanced",
      title: "advanced",
    });
  });
});

describe("build-format-file", () => {
  beforeAll(async () => {
    const { output, status } = await buildFixture("build-format-file");
    expect(status, output).toBe("success");
  });

  test("supports the file build format", () => {
    const html = readFixtureOutput("build-format-file", "guides.html");

    expect(getSidebarLinks(html)).toContainEqual({
      href: "/guides.html",
      isCurrent: true,
      label: "Overview",
    });
    expect(getOverviewCards(html)).toContainEqual({
      description: "Plugins &lt;3 and Theming",
      href: "/guides/advanced.html",
      title: "advanced",
    });
  });
});

describe("i18n", () => {
  beforeAll(async () => {
    const { output, status } = await buildFixture("i18n");
    expect(status, output).toBe("success");
  });

  test("generates overview pages for all locales", () => {
    expect(hasFixtureOutput("i18n", "guides/index.html")).toBe(true);
    expect(hasFixtureOutput("i18n", "fr/guides/index.html")).toBe(true);
    expect(hasFixtureOutput("i18n", "zh-cn/guides/index.html")).toBe(true);
  });

  test("uses translated labels and localized links", () => {
    const html = readFixtureOutput("i18n", "fr/guides/index.html");

    expect(getPageTitle(html)).toBe("Guides FR");
    expect(getSidebarLinks(html)[0]).toEqual({
      href: "/fr/guides/",
      isCurrent: true,
      label: "Vue d’ensemble",
    });
    expect(getOverviewCards(html).slice(0, 2)).toEqual([
      {
        description: "Installer le paquet.",
        href: "/fr/guides/installation/",
        title: "Installation FR",
      },
      {
        description: "Deploy the site.",
        href: "/fr/guides/deployment/",
        title: "Deployment",
      },
    ]);
  });

  test("looks up translations using the language tag of the locale", () => {
    const html = readFixtureOutput("i18n", "zh-cn/guides/index.html");

    expect(getSidebarLinks(html)[0]?.label).toBe("概览");
  });

  test("generates overview pages for directories only existing in a locale", () => {
    expect(hasFixtureOutput("i18n", "fr/extra/index.html")).toBe(true);
    expect(hasFixtureOutput("i18n", "extra/index.html")).toBe(false);
    expect(hasFixtureOutput("i18n", "zh-cn/extra/index.html")).toBe(false);
  });
});

describe("i18n-no-root", () => {
  beforeAll(async () => {
    const { output, status } = await buildFixture("i18n-no-root");
    expect(status, output).toBe("success");
  });

  test("supports multilingual sites without a root locale", () => {
    expect(hasFixtureOutput("i18n-no-root", "guides/index.html")).toBe(false);

    const html = readFixtureOutput("i18n-no-root", "fr/guides/index.html");

    expect(getSidebarLinks(html)[0]).toEqual({
      href: "/fr/guides/",
      isCurrent: true,
      label: "Vue d’ensemble",
    });
  });
});

describe("sidebar-label", () => {
  beforeAll(async () => {
    const { output, status } = await buildFixture("sidebar-label");
    expect(status, output).toBe("success");
  });

  test("turns group labels into links to their group page", () => {
    const html = readFixtureOutput("sidebar-label", "guides/installation/index.html");

    expect(getSidebarLinks(html)).toEqual([
      { href: "/", isCurrent: false, label: "Home" },
      { href: "/guides/", isCurrent: false, label: "Guides" },
      { href: "/guides/installation/", isCurrent: true, label: "Installation" },
      { href: "/guides/deployment/", isCurrent: false, label: "Deployment" },
      { href: "/guides/advanced/", isCurrent: false, label: "advanced" },
      {
        href: "/guides/advanced/plugins/",
        isCurrent: false,
        label: "Plugins &lt;3",
      },
      { href: "/guides/advanced/theming/", isCurrent: false, label: "Theming" },
      { href: "/reference/", isCurrent: false, label: "Reference" },
      { href: "/reference/api/", isCurrent: false, label: "API" },
      { href: "/reference/cli/", isCurrent: false, label: "CLI" },
    ]);
  });

  test("keeps a separate toggle for each group", () => {
    const html = readFixtureOutput("sidebar-label", "guides/index.html");

    expect(html).toMatch(
      /<a href="\/guides\/" aria-current="page" class="sl-group-pages-link[^"]*">/
    );
    expect(html).toMatch(
      /<summary[^>]*><span class="sr-only[^"]*">Guides<\/span>/
    );
  });

  test("uses group labels in the pagination", () => {
    expect(
      getPagination(
        readFixtureOutput("sidebar-label", "guides/installation/index.html")
      )
    ).toEqual({
      next: { href: "/guides/deployment/", label: "Deployment" },
      prev: { href: "/guides/", label: "Guides" },
    });
  });
});

describe("generate-id", () => {
  beforeAll(async () => {
    const { output, status } = await buildFixture("generate-id");
    expect(status, output).toBe("success");
  });

  test("supports custom entry IDs and group labels updated by route middleware", () => {
    const html = readFixtureOutput("generate-id", "guides/index.html");

    expect(getOverviewCards(html)[0]).toEqual({
      description: "Plugins and Theming",
      href: "/guides/advanced/",
      title: "Advanced",
    });
    expect(
      getPageTitle(readFixtureOutput("generate-id", "guides/advanced/index.html"))
    ).toBe("Advanced");
  });
});
