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

const isLabelDemo = process.env.DEMO_SIDEBAR_LINK === "label";

export default defineConfig({
  site,
  ...(isLabelDemo ? { base: "/label", outDir: "./dist/label" } : {}),
  integrations: [
    starlight({
      components: {
        Banner: "./src/components/Banner.astro",
        Footer: "./src/components/Footer.astro",
      },
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
        ...(isLabelDemo
          ? [
              {
                tag: "meta" as const,
                attrs: { name: "robots", content: "noindex" },
              },
            ]
          : []),
      ],
      social: [
        {
          icon: "blueSky",
          label: "BlueSky",
          href: "https://bsky.app/profile/felixs.dev",
        },
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
        ...(isLabelDemo
          ? []
          : [starlightLinksValidator({ exclude: ["/demo/"] })]),
        starlightPluginsDocsComponents({
          pluginName: "starlight-group-pages",
        }),
        starlightGroupPages({ sidebarLink: isLabelDemo ? "label" : "item" }),
      ],
      sidebar: [
        {
          label: "Start Here",
          items: [
            "getting-started",
            "configuration",
            "group-pages",
            "customization",
            "components",
            "i18n",
          ],
        },
        {
          label: "Demo",
          collapsed: true,
          items: [
            {
              label: "Guides",
              items: [{ autogenerate: { directory: "demo/guides" } }],
            },
            {
              label: "Reference",
              items: [{ autogenerate: { directory: "demo/reference" } }],
            },
          ],
        },
      ],
      credits: true,
      routeMiddleware: "./src/routeData.ts",
    }),
  ],
});
