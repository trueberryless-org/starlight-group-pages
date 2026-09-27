/// <reference path="./locals.d.ts" />
import type { StarlightPlugin } from "@astrojs/starlight/types";

import {
  type StarlightGroupPagesConfig,
  type StarlightGroupPagesUserConfig,
  validateConfig,
} from "./libs/config";
import {
  getComponentOverrides,
  getOverriddenComponents,
} from "./libs/starlight";
import { vitePluginStarlightGroupPages } from "./libs/vite";
import { Translations } from "./translations";

export type { StarlightGroupPagesConfig, StarlightGroupPagesUserConfig };

export default function starlightGroupPages(
  userConfig?: StarlightGroupPagesUserConfig
): StarlightPlugin {
  const config = validateConfig(userConfig);

  return {
    name: "starlight-group-pages",
    hooks: {
      "i18n:setup"({ injectTranslations }) {
        injectTranslations(Translations);
      },
      "config:setup"({
        addIntegration,
        addRouteMiddleware,
        config: starlightConfig,
        logger,
        updateConfig: updateStarlightConfig,
      }) {
        addRouteMiddleware({
          entrypoint: "starlight-group-pages/middleware",
          order: "post",
        });

        updateStarlightConfig({
          components: getComponentOverrides(
            starlightConfig.components,
            logger,
            getOverriddenComponents(config)
          ),
        });

        addIntegration({
          name: "starlight-group-pages-integration",
          hooks: {
            "astro:config:setup": ({
              config: astroConfig,
              injectRoute,
              updateConfig,
            }) => {
              updateConfig({
                vite: {
                  plugins: [
                    vitePluginStarlightGroupPages(
                      config,
                      starlightConfig,
                      astroConfig
                    ),
                  ],
                },
              });

              injectRoute({
                entrypoint: "starlight-group-pages/routes/GroupPage.astro",
                pattern: "[...groupPage]",
                prerender: true,
              });
            },
          },
        });
      },
    },
  };
}
