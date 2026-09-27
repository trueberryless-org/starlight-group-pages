import type { StarlightRouteData } from "@astrojs/starlight/route-data";

import type { StarlightGroupPagesConfig } from "./config";
import { isOverviewDirectory } from "./directory";
import { type DocsIndex, findDocsPage, getLocaleDirectories } from "./docs";
import { localizeSlug, stripSlugLocale } from "./locale";
import { getCommonPath, getParentPath, hrefToSlug, slugToHref } from "./path";
import type { StarlightGroupPagesContext } from "./vite";

const GroupLabelLinkAttribute = "data-starlight-group-pages-label-link";

export function getSidebarOverviews(
  sidebar: SidebarEntry[],
  options: SidebarOptions
): SidebarOverview[] {
  const claimedDirectories = new Set<string>();

  return getSidebarGroups(sidebar).flatMap((group) => {
    const directory = getGroupDirectory(group, options);

    if (
      directory === undefined ||
      claimedDirectories.has(directory) ||
      !isOverviewDirectory(
        directory,
        options.docs,
        options.locale,
        options.config
      )
    ) {
      return [];
    }

    claimedDirectories.add(directory);

    const slug = localizeSlug(directory, options.locale);

    return [
      { directory, group, href: slugToHref(slug, options.context), slug },
    ];
  });
}

export function addGroupPageLinks(
  overviews: SidebarOverview[],
  options: GroupPageLinkOptions
): boolean {
  const visibleOverviews = overviews.filter(
    (overview) => !isHiddenOverviewPage(overview, options)
  );

  if (options.mode === "label") {
    for (const overview of visibleOverviews) {
      addGroupLabelLink(overview, options);
    }

    return visibleOverviews.length > 0;
  }

  const missingOverviews = visibleOverviews.filter(
    (overview) => !hasOverviewLink(overview, options)
  );

  for (const overview of missingOverviews) {
    overview.group.entries.unshift(
      getOverviewLink(overview, options.label, options)
    );
  }

  return missingOverviews.length > 0;
}

export function getGroupLabelLink(
  group: SidebarGroup
): SidebarLink | undefined {
  const [firstEntry] = group.entries;

  return firstEntry?.type === "link" && isGroupLabelLink(firstEntry)
    ? firstEntry
    : undefined;
}

export function getGroupEntries(group: SidebarGroup): SidebarEntry[] {
  return getGroupLabelLink(group) ? group.entries.slice(1) : group.entries;
}

export function isSidebarGroupOpen(group: SidebarGroup): boolean {
  return hasCurrentLink(group.entries) || !group.collapsed;
}

export function getSidebarLinks(sidebar: SidebarEntry[]): SidebarLink[] {
  return sidebar.flatMap((entry) =>
    entry.type === "group" ? getSidebarLinks(entry.entries) : entry
  );
}

function getSidebarGroups(sidebar: SidebarEntry[]): SidebarGroup[] {
  return sidebar.flatMap((entry) =>
    entry.type === "group" ? [entry, ...getSidebarGroups(entry.entries)] : []
  );
}

function getGroupDirectory(
  group: SidebarGroup,
  options: SidebarOptions
): string | undefined {
  const directories = getSidebarLinks(group.entries)
    .map((link) => getLinkDirectory(link, options))
    .filter((directory) => directory !== undefined);

  if (directories.length === 0) return undefined;

  return getCommonPath(directories) || undefined;
}

function getLinkDirectory(
  link: SidebarLink,
  options: SidebarOptions
): string | undefined {
  const slug = hrefToSlug(link.href, options.context);
  if (slug === undefined) return undefined;

  const relativeSlug = stripSlugLocale(slug, options.context);

  return getLocaleDirectories(options.docs, options.locale).has(relativeSlug)
    ? relativeSlug
    : getParentPath(relativeSlug);
}

function addGroupLabelLink(
  overview: SidebarOverview,
  options: GroupPageLinkOptions
) {
  const entries = overview.group.entries.filter(
    (entry) => !isOverviewLink(entry, overview, options)
  );

  overview.group.entries = [
    {
      ...getOverviewLink(overview, overview.group.label, options),
      attrs: { [GroupLabelLinkAttribute]: "" },
    },
    ...entries,
  ];
}

function isGroupLabelLink(link: SidebarLink): boolean {
  return Object.hasOwn(link.attrs, GroupLabelLinkAttribute);
}

function hasCurrentLink(entries: SidebarEntry[]): boolean {
  return getSidebarLinks(entries).some((link) => link.isCurrent);
}

function hasOverviewLink(
  overview: SidebarOverview,
  options: SidebarOptions
): boolean {
  return overview.group.entries.some((entry) =>
    isOverviewLink(entry, overview, options)
  );
}

function isOverviewLink(
  entry: SidebarEntry,
  overview: SidebarOverview,
  options: SidebarOptions
): boolean {
  return (
    entry.type === "link" &&
    hrefToSlug(entry.href, options.context) === overview.slug
  );
}

function isHiddenOverviewPage(
  overview: SidebarOverview,
  options: SidebarOptions
): boolean {
  const page = findDocsPage(
    options.docs,
    overview.directory,
    options.locale,
    options.context
  );

  return page?.hidden ?? false;
}

function getOverviewLink(
  overview: SidebarOverview,
  label: string,
  options: { currentSlug: string }
): SidebarLink {
  return {
    type: "link",
    label,
    href: overview.href,
    isCurrent: overview.slug === options.currentSlug,
    badge: undefined,
    attrs: {},
  };
}

export interface SidebarOptions {
  config: Pick<StarlightGroupPagesConfig, "exclude">;
  context: StarlightGroupPagesContext;
  docs: DocsIndex;
  locale: string | undefined;
}

export interface GroupPageLinkOptions extends SidebarOptions {
  currentSlug: string;
  label: string;
  mode: Exclude<StarlightGroupPagesConfig["sidebarLink"], false>;
}

export interface SidebarOverview {
  directory: string;
  group: SidebarGroup;
  href: string;
  slug: string;
}

export type SidebarEntry = StarlightRouteData["sidebar"][number];
export type SidebarGroup = Extract<SidebarEntry, { type: "group" }>;
export type SidebarLink = Extract<SidebarEntry, { type: "link" }>;
