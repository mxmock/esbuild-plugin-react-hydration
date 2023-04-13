import * as esbuild from "esbuild";
import { Provider } from "react-redux";
import store from "./src/redux/store.js";
import reactHydrationPlugin from "../index.min.js";

const REDUX = { store, Provider };

const ctx = await esbuild.context({
  entryPoints: ["test/src/bootstrap/bootstrap.js", "test/src/main.js"],
  bundle: true,
  plugins: [
    reactHydrationPlugin({
      redux: REDUX,
      jsOut: "/js",
      outDir: "/test/dev",
      // cssOut: "/css",
      cssFrom: "/test/src/styles",
      htmlOut: "/",
      htmlFrom: "/test/src/pages",
      // assetsOut: "/assets",
      assetsFrom: "/test/src/files",
    }),
  ],
  outdir: "test/dev/js",
});

await ctx.watch();
