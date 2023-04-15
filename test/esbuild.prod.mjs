import * as esbuild from "esbuild";
import { Provider } from "react-redux";
import store from "./src/redux/store.js";
import { writeFile } from "node:fs/promises";
import reactHydrationPlugin from "../index.min.js";

const SRC = "test/src";
const OUT = "test/prod";
const REDUX = { store, Provider };

const TIME_LOG = `Build time`;

console.time(TIME_LOG);
const result = await esbuild.build({
  entryPoints: [`${SRC}/main.js`],
  bundle: true,
  minify: true,
  plugins: [
    reactHydrationPlugin({
      redux: REDUX,

      cssFrom: `/${SRC}/styles`,
      htmlFrom: `/${SRC}/pages`,
      assetsFrom: `/${SRC}/files`,

      outDir: `/${OUT}`,
      jsOut: "/js", // => /${OUT}/js => /test/prod/js
      htmlOut: "/", // => /${OUT}/   => /test/prod/
      cssOut: "/css",
      assetsOut: "/assets",

      galleries: ["cars", "images/dbz"],
    }),
  ],
  outdir: `${OUT}/js`, // must be the same as jsOut option
  metafile: true,
  legalComments: "none",
  pure: ["console"],
});
console.timeEnd(TIME_LOG);

await writeFile("meta.json", JSON.stringify(result.metafile));
