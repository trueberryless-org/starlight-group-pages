import { docsLoader } from "@astrojs/starlight/loaders";
import { docsSchema } from "@astrojs/starlight/schema";
import { defineCollection } from "astro:content";

const leadingNumberAndDotRegEx = /^\d+\./;
const fileExtensionRegEx = /\.(md|mdx)$/;

export const collections = {
  docs: defineCollection({
    loader: docsLoader({
      generateId: ({ entry }) =>
        entry
          .replace(fileExtensionRegEx, "")
          .split("/")
          .map((segment) => segment.replace(leadingNumberAndDotRegEx, ""))
          .join("/"),
    }),
    schema: docsSchema(),
  }),
};
