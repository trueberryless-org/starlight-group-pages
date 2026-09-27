import starlight from "@astrojs/starlight";
import starlightPluginsDocsComponents from "@trueberryless-org/starlight-plugins-docs-components";
import { defineConfig } from "astro/config";
import starlightGroupPages from "starlight-group-pages";
import starlightLinksValidator from "starlight-links-validator";

const site =
  (process.env.CONTEXT === "deploy-preview" ||
  process.env.CONTEXT === "branch-deploy"
    ? process.env.DEPLOY_PRIME_URL
    : process.env.URL) ?? "https://starlight-group-pages.netlify.app";

export default defineConfig({
  site,
  integrations: [
    starlight({
      title: "Starlight Group Pages",
      head: [
        {
          tag: "meta",
          attrs: {
            property: "og:image",
            content: new URL("og.png", site).href,
          },
        },
        {
          tag: "meta",
          attrs: {
            property: "og:image:alt",
            content: "Automatic overview pages for sidebar groups.",
          },
        },
      ],
      social: [
        {
          icon: "github",
          label: "GitHub",
          href: "https://github.com/trueberryless-org/starlight-group-pages",
        },
      ],
      editLink: {
        baseUrl:
          "https://github.com/trueberryless-org/starlight-group-pages/edit/main/docs/",
      },
      plugins: [
        starlightLinksValidator({ exclude: ["/demo/"] }),
        starlightPluginsDocsComponents({
          pluginName: "starlight-group-pages",
        }),
        starlightGroupPages(),
      ],
      sidebar: [
        {
          label: "Start Here",
          items: [
            "getting-started",
            "group-pages",
            "customization",
            "configuration",
          ],
        },
        {
          label: "Demo",
          items: [
            {
              label: "Guides",
              items: [{ autogenerate: { directory: "demo/guides" } }],
            },
            {
              label: "Reference",
              items: [{ autogenerate: { directory: "demo/reference" } }],
            },
            {
              label: "Tutorials",
              items: [{ autogenerate: { directory: "demo/tutorials" } }],
            },
          ],
        },
      ],
      credits: true,
    }),
  ],
});
