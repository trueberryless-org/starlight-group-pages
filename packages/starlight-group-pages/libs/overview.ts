import type { StarlightGroupPagesConfig } from "./config";
import { isOverviewDirectory } from "./directory";
import {
  type DocsIndex,
  type DocsPage,
  findDocsPage,
  getLocaleDirectories,
  getLocalePages,
} from "./docs";
import { localizeSlug, stripSlugLocale } from "./locale";
import { getParentPath, getPathName, hrefToSlug, slugToHref } from "./path";
import type { SidebarEntry, SidebarLink, SidebarOverview } from "./sidebar";
import { getLabelsSummary } from "./summary";
import type { StarlightGroupPagesContext } from "./vite";

const collator = new Intl.Collator();

export function getGroupOverview(
  overview: SidebarOverview,
  options: OverviewOptions
): Overview {
  const entries = getGroupOverviewEntries(
    overview.group.entries,
    overview.slug,
    options
  );

  return {
    title: overview.group.label,
    description: getEntriesSummary(entries, options),
    entries,
  };
}

export function getDirectoryOverview(
  directory: string,
  options: OverviewOptions
): Overview {
  const indexPage = getDirectoryPage(directory, options);
  const entries = getDirectoryEntries(directory, options);

  return {
    title: indexPage?.title ?? getPathName(directory),
    description: getEntriesSummary(entries, options),
    entries,
  };
}

function getDirectoryEntries(
  directory: string,
  options: OverviewOptions
): OverviewLink[] {
  return getDirectoryChildren(directory, options).map((child) =>
    getDirectoryChildEntry(child, options)
  );
}

function getDirectoryChildren(
  directory: string,
  options: OverviewOptions
): DirectoryChild[] {
  return [
    ...getChildPages(directory, options),
    ...getChildDirectories(directory, options),
  ].sort(compareDirectoryChildren);
}

function getDirectoryChildEntry(
  child: DirectoryChild,
  options: OverviewOptions
): OverviewLink {
  return {
    type: "link",
    label: child.label,
    href: getLocalizedHref(child.slug, options),
    description:
      child.description ??
      (child.isDirectory
        ? getDirectorySummary(child.slug, options)
        : undefined),
  };
}

function getDirectorySummary(
  directory: string,
  options: OverviewOptions
): string | undefined {
  return getLabelsSummary(
    getDirectoryChildren(directory, options).map(({ label }) => label),
    options.lang
  );
}

function getEntriesSummary(
  entries: OverviewEntry[],
  options: OverviewOptions
): string | undefined {
  return getLabelsSummary(
    entries.map(({ label }) => label),
    options.lang
  );
}

function getGroupOverviewEntries(
  entries: SidebarEntry[],
  groupPageSlug: string,
  options: OverviewOptions
): OverviewEntry[] {
  return entries.flatMap((entry): OverviewEntry[] => {
    if (entry.type === "link") {
      return hrefToSlug(entry.href, options.context) === groupPageSlug
        ? []
        : [getLinkOverviewEntry(entry, options)];
    }

    const groupOverview = options.overviews.find(
      (overview) => overview.group === entry
    );

    if (groupOverview) {
      return [
        {
          type: "link",
          label: entry.label,
          href: groupOverview.href,
          description:
            getDirectoryPage(groupOverview.directory, options)?.description ??
            getGroupSummary(groupOverview, options),
        },
      ];
    }

    const groupEntries = getGroupOverviewEntries(
      entry.entries,
      groupPageSlug,
      options
    );

    return groupEntries.length > 0
      ? [{ type: "group", label: entry.label, entries: groupEntries }]
      : [];
  });
}

function getGroupSummary(
  overview: SidebarOverview,
  options: OverviewOptions
): string | undefined {
  return getLabelsSummary(
    overview.group.entries
      .filter(
        (entry) =>
          entry.type === "group" ||
          hrefToSlug(entry.href, options.context) !== overview.slug
      )
      .map(({ label }) => label),
    options.lang
  );
}

function getLinkOverviewEntry(
  link: SidebarLink,
  options: OverviewOptions
): OverviewLink {
  const slug = hrefToSlug(link.href, options.context);
  const page =
    slug === undefined
      ? undefined
      : findDocsPage(
          options.docs,
          stripSlugLocale(slug, options.context),
          options.locale,
          options.context
        );

  return {
    type: "link",
    label: link.label,
    href: link.href,
    description: page?.description,
  };
}

function getChildPages(
  directory: string,
  options: OverviewOptions
): DirectoryChild[] {
  const directories = getLocaleDirectories(options.docs, options.locale);
  const slugs = new Set(
    getLocalePages(options.docs.pages.values(), options.locale, options.context)
      .filter(
        (page) =>
          getParentPath(page.slug) === directory && !directories.has(page.slug)
      )
      .map((page) => page.slug)
  );

  return [...slugs]
    .map((slug) =>
      findDocsPage(options.docs, slug, options.locale, options.context)
    )
    .filter((page): page is DocsPage => page !== undefined && !page.hidden)
    .map((page) => ({
      description: page.description,
      isDirectory: false,
      label: page.label,
      order: page.order,
      slug: page.slug,
    }));
}

function getChildDirectories(
  directory: string,
  options: OverviewOptions
): DirectoryChild[] {
  return [...getLocaleDirectories(options.docs, options.locale)]
    .filter((childDirectory) => getParentPath(childDirectory) === directory)
    .flatMap((childDirectory) => {
      const page = getDirectoryPage(childDirectory, options);

      if (page?.hidden) return [];
      if (
        !page &&
        !isOverviewDirectory(
          childDirectory,
          options.docs,
          options.locale,
          options.config
        )
      ) {
        return [];
      }

      return [
        {
          description: page?.description,
          isDirectory: true,
          label: page?.label ?? getPathName(childDirectory),
          order: page?.order,
          slug: childDirectory,
        },
      ];
    });
}

function getDirectoryPage(
  directory: string,
  options: OverviewOptions
): DocsPage | undefined {
  return findDocsPage(options.docs, directory, options.locale, options.context);
}

function getLocalizedHref(slug: string, options: OverviewOptions): string {
  return slugToHref(localizeSlug(slug, options.locale), options.context);
}

function compareDirectoryChildren(
  a: DirectoryChild,
  b: DirectoryChild
): number {
  const orderA = a.order ?? Number.MAX_VALUE;
  const orderB = b.order ?? Number.MAX_VALUE;

  if (orderA !== orderB) return orderA < orderB ? -1 : 1;

  return collator.compare(a.slug, b.slug);
}

export interface OverviewOptions {
  config: Pick<StarlightGroupPagesConfig, "exclude">;
  context: StarlightGroupPagesContext;
  docs: DocsIndex;
  lang: string;
  locale: string | undefined;
  overviews: SidebarOverview[];
}

export interface Overview {
  description: string | undefined;
  title: string;
  entries: OverviewEntry[];
}

export type OverviewEntry = OverviewLink | OverviewGroup;

export interface OverviewLink {
  type: "link";
  label: string;
  href: string;
  description: string | undefined;
}

export interface OverviewGroup {
  type: "group";
  label: string;
  entries: OverviewEntry[];
}

interface DirectoryChild {
  description: string | undefined;
  isDirectory: boolean;
  label: string;
  order: number | undefined;
  slug: string;
}
