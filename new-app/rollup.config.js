import { readdirSync, writeFileSync } from "node:fs"
import { sveltePreprocess } from "svelte-preprocess"
import { toKebabCase } from "@std/text/to-kebab-case"
import css from "rollup-plugin-css-only"
import resolve from "@rollup/plugin-node-resolve"
import svelte from "rollup-plugin-svelte"
import terser from "@rollup/plugin-terser"
import typescript from "@rollup/plugin-typescript"

const isProd = process.env.NODE_ENV === "production"

const components = readdirSync("src/lib")
  .filter((file) => file.endsWith(".svelte"))
  .map((file) => file.replace(".svelte", ""))

const widgets = readdirSync("src/lib/widgets")
  .filter((file) => file.endsWith(".svelte"))
  .map((file) => file.replace(".svelte", ""))

const widgetData = {
  widgets: widgets.map((name) => ({
    name,
    kebabCase: toKebabCase(name),
    file: `${toKebabCase(name)}.js`,
  })),
}

writeFileSync("dist/data.json", JSON.stringify(widgetData, null, 2))

export default [
  {
    input: "src/svelte.js",
    output: {
      file: "dist/svelte.js",
      format: "es",
      sourcemap: true,
    },
    plugins: [
      resolve({
        browser: true,
      }),
      isProd && terser(),
    ],
  },
  ...components.map((name) => ({
    input: `src/lib/${name}.svelte`,
    external: ["svelte", "svelte/internal/client"],
    output: {
      dir: "dist",
      entryFileNames: `${toKebabCase(name)}.js`,
      format: "es",
      name,
      sourcemap: true,
    },
    plugins: [
      svelte({
        compilerOptions: { runes: true },
        extensions: [".svelte"],
        include: "src/lib/**/*.svelte",
        preprocess: sveltePreprocess({
          typescript: {
            compilerOptions: {
              target: "es2020",
              module: "esnext",
              moduleResolution: "node",
              strict: true,
              esModuleInterop: true,
              skipLibCheck: true,
              outDir: "dist",
            },
          },
        }),
      }),
      css({
        output: `${toKebabCase(name)}.css`,
      }),
      resolve({
        browser: true,
        exportConditions: ["svelte"],
        extensions: [".svelte", ".ts", ".js"],
      }),
      typescript(),
      isProd && terser(),
    ],
  })),
]
