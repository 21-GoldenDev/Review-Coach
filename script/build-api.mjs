import { build as esbuild } from "esbuild";
import path from "path";
import { fileURLToPath } from "url";
import { mkdir } from "fs/promises";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

export async function buildVercelApi() {
  await mkdir(path.join(projectRoot, "api"), { recursive: true });

  console.log("building Vercel API bundle...");
  await esbuild({
    entryPoints: [path.join(projectRoot, "server/vercel.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.join(projectRoot, "api/index.cjs"),
    target: "node20",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    alias: {
      "@shared": path.join(projectRoot, "shared"),
    },
    minify: true,
    logLevel: "info",
    footer: {
      js: "module.exports = module.exports.default;",
    },
  });
}

if (process.argv[1]?.endsWith("build-api.mjs")) {
  buildVercelApi().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
