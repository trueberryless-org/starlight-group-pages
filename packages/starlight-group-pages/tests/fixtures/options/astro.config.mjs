import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightGroupPages from "starlight-group-pages";

export default defineConfig({
  integrations: [
    starlight({
      title: "Group Pages",
      pagefind: false,
      head: [
        {
          tag: "meta",
          attrs: { name: "description", content: "Site description" },
        },
      ],
      plugins: [
        starlightGroupPages({
          exclude: ["guides/advanced"],
          extendIndexPages: false,
          layout: "list",
          sidebarLink: false,
        }),
      ],
      sidebar: [
        { label: "Start", items: ["index"] },
        { label: "Guides", items: [{ autogenerate: { directory: "guides" } }] },
        {
          label: "Reference",
          items: [{ autogenerate: { directory: "reference" } }],
        },
      ],
    }),
  ],
});
