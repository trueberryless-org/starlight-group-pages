import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightGroupPages from "starlight-group-pages";

export default defineConfig({
  integrations: [
    starlight({
      title: "Group Pages",
      pagefind: false,
      plugins: [starlightGroupPages()],
      sidebar: [
        { label: "Start", items: ["getting-started", "guides/installation"] },
        {
          label: "Guides",
          items: [
            "guides/installation",
            "guides/deployment",
            {
              label: "Advanced guides",
              items: ["guides/advanced/theming", "guides/advanced/plugins"],
            },
            "guides/next",
            { label: "External", link: "https://astro.build" },
          ],
        },
        { label: "Mixed", items: ["getting-started", "reference/api"] },
      ],
    }),
  ],
});
