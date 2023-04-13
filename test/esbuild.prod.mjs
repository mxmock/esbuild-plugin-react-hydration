import * as esbuild from "esbuild";
import { Provider } from "react-redux";
import store from "./src/redux/store.js";
import { writeFile } from "node:fs/promises";
import reactHydrationPlugin from "../index.min.js";

const OUT_DIR = "test/prod";
const PAGES_FROM = "test/src/pages";
const JS_FROM = "test/src/main.js";
const REDUX = { store, Provider };

const TIME_LOG = `Build time`;

console.time(TIME_LOG);
const result = await esbuild.build({
  entryPoints: [JS_FROM],
  bundle: true,
  minify: true,
  plugins: [
    reactHydrationPlugin({
      outDir: `${OUT_DIR}/pages`,
      pages: PAGES_FROM,
      redux: REDUX,
    }),
  ],
  outdir: `${OUT_DIR}/js`,
  metafile: true,
  legalComments: "none",
  pure: ["console"],
});
console.timeEnd(TIME_LOG);

await writeFile("meta.json", JSON.stringify(result.metafile));
