import { defineRouteMiddleware } from "@astrojs/starlight/route-data";

import { updateStarlightRoute } from "./libs/routeData";

export const onRequest = defineRouteMiddleware(async (context) => {
  await updateStarlightRoute(context.locals.starlightRoute, context.locals.t);
});
