import { build, BuildOptions } from "esbuild";

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
  sourcemap: !isProduction
};

const browserConfig: BuildOptions = {
  platform: "browser",
  entryPoints: ["./src/websocket-client.ts"],
  bundle: true,
  outfile: "build/browser.mjs",
  target: "es6",
  format: "esm",
  minify: isProduction,
  sourcemap: !isProduction,
  define: {
    "process.env.NODE_ENV": `"${process.env.NODE_ENV || "development"}"`
  }
};

Promise.all([build(browserConfig), build(nodeConfig)]).catch(() => process.exit(1));
