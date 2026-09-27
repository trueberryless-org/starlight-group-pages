import type { StarlightRouteData } from "@astrojs/starlight/route-data";
import { defineRouteMiddleware } from "@astrojs/starlight/route-data";

const leadingNumberAndDotRegEx = /^\d+\./;

export const onRequest = defineRouteMiddleware((context) => {
  cleanGroupLabels(context.locals.starlightRoute.sidebar);
});

function cleanGroupLabels(entries: StarlightRouteData["sidebar"]) {
  for (const entry of entries) {
    if (entry.type !== "group") continue;

    const label = entry.label.replace(leadingNumberAndDotRegEx, "");
    entry.label = label.charAt(0).toUpperCase() + label.slice(1);
    cleanGroupLabels(entry.entries);
  }
}
