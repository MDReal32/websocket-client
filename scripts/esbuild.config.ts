import { build, BuildOptions } from "esbuild";
import { writeFileSync } from "fs";

const baseBuildOptions: BuildOptions = {
  entryPoints: ["./src/websocket-client.ts"],
  target: "es6",
  bundle: true
};

const nodeBuildOption: BuildOptions = {
  ...baseBuildOptions,
  platform: "node",
  external: ["ws"],
  outfile: "build/node.${env}.js",
  format: "cjs"
};

const browserBuildOption: BuildOptions = {
  ...baseBuildOptions,
  platform: "browser",
  outfile: "build/browser.${env}.mjs",
  format: "esm",
  define: {
    "process.env.NODE_ENV": `"${process.env.NODE_ENV || "development"}"`
  }
};

const nodeBuildOptions = [true, false].map(env => ({
  ...nodeBuildOption,
  outfile: nodeBuildOption.outfile!.replace("${env}", env ? "min" : "dev"),
  minify: env,
  sourcemap: !env
}));
const browserBuildOptions = [true, false].map(env => ({
  ...browserBuildOption,
  outfile: browserBuildOption.outfile!.replace("${env}", env ? "min" : "dev"),
  minify: env,
  sourcemap: !env
}));

Promise.all([...nodeBuildOptions, ...browserBuildOptions].map(options => build(options)))
  .then(() => {
    const code = `if (process.env.NODE_ENV === "development") {
  module.exports = require("./\${name}.dev.mjs");
} else {
  module.exports = require("./\${name}.min.mjs");
}
`;

    ["browser.mjs", "node.js"].forEach(name => {
      const compiledCode = code.replace(/\${name}/g, name.split(".")[0]);
      const path = `./build/${name}`;
      writeFileSync(path, compiledCode);
    });
  })
  .catch(() => process.exit(1));
