import starlight from "@astrojs/starlight";
import { defineConfig } from "astro/config";
import starlightGroupPages from "starlight-group-pages";

export default defineConfig({
  integrations: [
    starlight({
      title: "Group Pages",
      pagefind: false,
      plugins: [starlightGroupPages()],
      defaultLocale: "en",
      locales: {
        en: { label: "English", lang: "en" },
        fr: { label: "Français", lang: "fr" },
      },
      sidebar: [
        { label: "Guides", items: [{ autogenerate: { directory: "guides" } }] },
      ],
    }),
  ],
});
