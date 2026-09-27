import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightGroupPages from "starlight-group-pages";

export default defineConfig({
  integrations: [
    starlight({
      title: "Group Pages",
      pagefind: false,
      plugins: [starlightGroupPages({ sidebarLink: "label" })],
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
