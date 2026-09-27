import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightGroupPages from "starlight-group-pages";

export default defineConfig({
  integrations: [
    starlight({
      title: "Group Pages",
      pagefind: false,
      plugins: [starlightGroupPages()],
      routeMiddleware: "./src/routeData.ts",
      sidebar: [
        {
          label: "Guides",
          items: [{ autogenerate: { directory: "1.guides" } }],
        },
      ],
    }),
  ],
});
