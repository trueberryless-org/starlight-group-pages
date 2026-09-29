import {
  type StarlightRouteData,
  defineRouteMiddleware,
} from "@astrojs/starlight/route-data";

const wordRegEx = /\p{Letter}\S*/gu;
const labelDemoBase = "/label";

export const onRequest = defineRouteMiddleware((context) => {
  const { starlightRoute } = context.locals;

  titleCaseGroupLabels(starlightRoute.sidebar);

  if (isDemoPage(starlightRoute.id)) {
    starlightRoute.entry.data.banner = {
      content: getDemoBanner(context.url.pathname),
    };
  }
});

function titleCaseGroupLabels(entries: StarlightRouteData["sidebar"]) {
  for (const entry of entries) {
    if (entry.type !== "group") continue;

    entry.label = entry.label.replace(
      wordRegEx,
      (word) => `${word.charAt(0).toUpperCase()}${word.slice(1)}`
    );
    titleCaseGroupLabels(entry.entries);
  }
}

function isDemoPage(id: string): boolean {
  return id === "demo" || id.startsWith("demo/");
}

function getDemoBanner(pathname: string): string {
  if (pathname.startsWith(`${labelDemoBase}/`)) {
    return `This demo uses <code>sidebarLink: "label"</code>: group labels link to their group page. <a href="${pathname.slice(labelDemoBase.length)}" data-demo-switch>Compare with the default <code>"item"</code> option</a>.`;
  }

  return `This demo uses the default <code>sidebarLink: "item"</code> option: groups link to their group page with an “Overview” item. <a href="${labelDemoBase}${pathname}" data-demo-switch>Compare with the <code>"label"</code> option</a>.`;
}
