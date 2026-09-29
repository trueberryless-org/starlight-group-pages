import type { StarlightRouteData } from "@astrojs/starlight/route-data";
import config from "virtual:starlight-group-pages/config";
import context from "virtual:starlight-group-pages/context";

import { getDocsIndex } from "./content";
import { hasDirectoryPage, isOverviewDirectory } from "./directory";
import { type DocsIndex, getLocaleDirectories } from "./docs";
import { throwPluginError } from "./error";
import { stripSlugLocale } from "./locale";
import {
  type Overview,
  type OverviewOptions,
  getDirectoryOverview,
  getGroupOverview,
} from "./overview";
import { getPagination } from "./pagination";
import { stripLeadingAndTrailingSlashes } from "./path";
import { addGroupPageLinks, getSidebarOverviews } from "./sidebar";

export async function updateStarlightRoute(
  starlightRoute: StarlightRouteData,
  t: Translate
): Promise<void> {
  const options = getOverviewOptions(starlightRoute, await getDocsIndex());
  const currentSlug = getCurrentSlug(starlightRoute);
  const currentOverview = getCurrentOverview(currentSlug, options);

  if (currentOverview?.isGeneratedPage) {
    updateGeneratedPageMetadata(starlightRoute, currentOverview.overview);
  }

  if (!config.sidebarLink) return;

  if (
    addGroupPageLinks(options.overviews, {
      ...options,
      currentSlug,
      label: t("starlightGroupPages.sidebarLink"),
      mode: config.sidebarLink,
    })
  ) {
    starlightRoute.pagination = getPagination(
      starlightRoute.sidebar,
      context.pagination,
      starlightRoute.entry.data
    );
  }
}

export async function getCurrentPageOverview(
  starlightRoute: StarlightRouteData
): Promise<Overview | undefined> {
  const options = getOverviewOptions(starlightRoute, await getDocsIndex());

  return getCurrentOverview(getCurrentSlug(starlightRoute), options)?.overview;
}

export async function getGroupPageCardsOverview(
  directory: string,
  starlightRoute: StarlightRouteData
): Promise<Overview> {
  const docs = await getDocsIndex();
  const normalizedDirectory = stripLeadingAndTrailingSlashes(directory);

  if (
    !getLocaleDirectories(docs, starlightRoute.locale).has(normalizedDirectory)
  ) {
    throwPluginError(
      `The \`${directory}\` directory passed to the \`<GroupPageCards>\` component does not contain any page.`,
      "The `directory` prop must be a directory relative to `src/content/docs/` without a locale, e.g. `guides` or `guides/advanced`."
    );
  }

  const options = getOverviewOptions(starlightRoute, docs);
  const sidebarOverview = options.overviews.find(
    (overview) => overview.directory === normalizedDirectory
  );

  return sidebarOverview
    ? getGroupOverview(sidebarOverview, options)
    : getDirectoryOverview(normalizedDirectory, options);
}

function getOverviewOptions(
  starlightRoute: StarlightRouteData,
  docs: DocsIndex
): OverviewOptions {
  const sidebarOptions = {
    config,
    context,
    docs,
    locale: starlightRoute.locale,
  };

  return {
    ...sidebarOptions,
    lang: starlightRoute.lang,
    overviews: getSidebarOverviews(starlightRoute.sidebar, sidebarOptions),
  };
}

function getCurrentSlug(starlightRoute: StarlightRouteData): string {
  return stripLeadingAndTrailingSlashes(starlightRoute.id);
}

function getCurrentOverview(
  currentSlug: string,
  options: OverviewOptions
): CurrentOverview | undefined {
  const directory = stripSlugLocale(currentSlug, context);

  if (!isOverviewDirectory(directory, options.docs, options.locale, config)) {
    return undefined;
  }

  const isGeneratedPage = !hasDirectoryPage(
    directory,
    options.locale,
    options.docs,
    context
  );

  if (!isGeneratedPage && !config.extendIndexPages) return undefined;

  const sidebarOverview = options.overviews.find(
    (overview) => overview.slug === currentSlug
  );
  const overview = sidebarOverview
    ? getGroupOverview(sidebarOverview, options)
    : getDirectoryOverview(directory, options);

  return { isGeneratedPage, overview };
}

function updateGeneratedPageMetadata(
  starlightRoute: StarlightRouteData,
  overview: Overview
) {
  const previousTitle = starlightRoute.entry.data.title;

  starlightRoute.entry.data.title = overview.title;
  starlightRoute.head = starlightRoute.head.map((tag) =>
    getUpdatedHeadTag(tag, previousTitle, overview.title)
  );

  if (overview.description) {
    starlightRoute.entry.data.description = overview.description;
    starlightRoute.head.push(
      ...getDescriptionHeadTags(overview.description).filter(
        (tag) => !hasHeadTag(starlightRoute.head, tag)
      )
    );
  }
}

function hasHeadTag(head: HeadTag[], tag: HeadTag): boolean {
  return head.some(
    ({ attrs }) =>
      attrs?.["name"] === tag.attrs?.["name"] &&
      attrs?.["property"] === tag.attrs?.["property"]
  );
}

function getDescriptionHeadTags(description: string): HeadTag[] {
  return [
    { tag: "meta", attrs: { name: "description", content: description } },
    {
      tag: "meta",
      attrs: { property: "og:description", content: description },
    },
  ];
}

function getUpdatedHeadTag(
  tag: HeadTag,
  previousTitle: string,
  title: string
): HeadTag {
  if (tag.tag === "title" && tag.content?.startsWith(previousTitle)) {
    return {
      ...tag,
      content: `${title}${tag.content.slice(previousTitle.length)}`,
    };
  }

  if (
    tag.tag === "meta" &&
    tag.attrs?.["property"] === "og:title" &&
    tag.attrs["content"] === previousTitle
  ) {
    return { ...tag, attrs: { ...tag.attrs, content: title } };
  }

  return tag;
}

interface CurrentOverview {
  isGeneratedPage: boolean;
  overview: Overview;
}

type HeadTag = StarlightRouteData["head"][number];
type Translate = (key: keyof StarlightApp.I18n) => string;
