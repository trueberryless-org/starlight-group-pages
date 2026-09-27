import type { StarlightRouteData } from "@astrojs/starlight/route-data";
import config from "virtual:starlight-group-pages/config";
import context from "virtual:starlight-group-pages/context";

import { getDocsIndex } from "./content";
import { hasDirectoryPage, isOverviewDirectory } from "./directory";
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
): Promise<StarlightGroupPagesRouteData> {
  const docs = await getDocsIndex();
  const sidebarOptions = {
    config,
    context,
    docs,
    locale: starlightRoute.locale,
  };
  const currentSlug = stripLeadingAndTrailingSlashes(starlightRoute.id);
  const overviews = getSidebarOverviews(starlightRoute.sidebar, sidebarOptions);
  const overview = getCurrentOverview(starlightRoute, {
    ...sidebarOptions,
    currentSlug,
    lang: starlightRoute.lang,
    overviews,
  });

  if (config.sidebarLink) {
    const label = t("starlightGroupPages.sidebarLink");

    if (
      addGroupPageLinks(overviews, {
        ...sidebarOptions,
        currentSlug,
        label,
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

  return { overview };
}

function getCurrentOverview(
  starlightRoute: StarlightRouteData,
  options: OverviewOptions
): Overview | undefined {
  const directory = stripSlugLocale(options.currentSlug, context);

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
    (overview) => overview.slug === options.currentSlug
  );
  const overview = sidebarOverview
    ? getGroupOverview(sidebarOverview, options)
    : getDirectoryOverview(directory, options);

  if (isGeneratedPage) updateGeneratedPageMetadata(starlightRoute, overview);

  return overview;
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

export interface StarlightGroupPagesRouteData {
  overview: Overview | undefined;
}

type HeadTag = StarlightRouteData["head"][number];
type Translate = (key: keyof StarlightApp.I18n) => string;
