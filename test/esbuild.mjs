import * as esbuild from "esbuild";
import { Provider } from "react-redux";
import store from "./src/redux/store.js";
import reactHydrationPlugin from "../index.min.js";

const SRC = "test/src";
const OUT = "test/dev";
const REDUX = { store, Provider };

const ctx = await esbuild.context({
  entryPoints: [`${SRC}/bootstrap/bootstrap.js`, `${SRC}/main.js`],
  bundle: true,
  plugins: [
    reactHydrationPlugin({
      redux: REDUX,

      cssFrom: `/${SRC}/styles`,
      htmlFrom: `/${SRC}/pages`,
      assetsFrom: `/${SRC}/files`,

      outDir: `/${OUT}`,
      jsOut: "/js", // => /${OUT}/js => /test/dev/js
      htmlOut: "/", // => /${OUT}/   => /test/dev/

      galleries: ["cars", "images/dbz"],
    }),
  ],
  outdir: `${OUT}/js`, // must be the same as jsOut option
});

await ctx.watch();
