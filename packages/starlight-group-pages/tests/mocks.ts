import type { StarlightGroupPagesConfig } from "../libs/config";
import { type DocsEntry, createDocsIndex } from "../libs/docs";
import type { SidebarEntry, SidebarGroup, SidebarLink } from "../libs/sidebar";
import type { StarlightGroupPagesContext } from "../libs/vite";

export function createContext(
  context: Partial<StarlightGroupPagesContext> = {}
): StarlightGroupPagesContext {
  return {
    base: "",
    defaultLocale: undefined,
    format: "directory",
    hasRootLocale: false,
    locales: [],
    pagination: true,
    trailingSlash: "ignore",
    ...context,
  };
}

export function createConfig(
  config: Partial<StarlightGroupPagesConfig> = {}
): StarlightGroupPagesConfig {
  return {
    exclude: [],
    extendIndexPages: true,
    layout: "grid",
    sidebarLink: "item",
    ...config,
  };
}

export function createEntry(
  id: string,
  data: Partial<Omit<DocsEntry["data"], "sidebar">> & {
    sidebar?: Partial<DocsEntry["data"]["sidebar"]>;
  } = {}
): DocsEntry {
  return {
    id,
    data: {
      title: data.title ?? id,
      ...(data.description ? { description: data.description } : {}),
      sidebar: { hidden: false, ...data.sidebar },
    },
  };
}

export function createDocs(entries: DocsEntry[], context = createContext()) {
  return createDocsIndex(entries, context);
}

export function createLink(
  href: string,
  label = href,
  isCurrent = false
): SidebarLink {
  return { type: "link", label, href, isCurrent, badge: undefined, attrs: {} };
}

export function createGroup(
  label: string,
  entries: SidebarEntry[]
): SidebarGroup {
  return { type: "group", label, entries, collapsed: false, badge: undefined };
}
