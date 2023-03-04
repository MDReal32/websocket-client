import { build, BuildOptions } from "esbuild";
import { polyfillNode } from "esbuild-plugin-polyfill-node";

const isProduction = process.env.NODE_ENV === "production";

const nodeConfig: BuildOptions = {
  platform: "node",
  entryPoints: ["./src/websocket-client.ts"],
  bundle: true,
  external: ["ws"],
  outfile: "build/node.js",
  target: "es6",
  format: "cjs",
  minify: isProduction,
  sourcemap: true
};

const browserConfig: BuildOptions = {
  platform: "browser",
  entryPoints: ["./src/websocket-client.ts"],
  bundle: true,
  outfile: "build/browser.mjs",
  target: "es6",
  format: "esm",
  minify: isProduction,
  sourcemap: true,
  plugins: [polyfillNode()],
  define: {
    "process.env.NODE_ENV": `"${process.env.NODE_ENV || "development"}"`
  }
};

Promise.all([build(browserConfig), build(nodeConfig)]).catch(() => process.exit(1));
