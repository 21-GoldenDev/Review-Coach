import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import { rm, readFile, mkdir, unlink } from "fs/promises";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const allowlist = [
  "@google/generative-ai",
  "axios",
  "connect-pg-simple",
  "cors",
  "date-fns",
  "drizzle-orm",
  "drizzle-zod",
  "express",
  "express-rate-limit",
  "express-session",
  "jsonwebtoken",
  "memorystore",
  "multer",
  "nanoid",
  "nodemailer",
  "openai",
  "passport",
  "passport-local",
  "pg",
  "stripe",
  "uuid",
  "ws",
  "xlsx",
  "zod",
  "zod-validation-error",
];

async function buildAll() {
  await rm("dist", { recursive: true, force: true });
  await mkdir(path.join(projectRoot, "api"), { recursive: true });

  console.log("building client...");
  await viteBuild();

  console.log("building server...");
  const pkg = JSON.parse(
    await readFile(path.join(projectRoot, "package.json"), "utf-8"),
  );
  const allDeps = [
    ...Object.keys(pkg.dependencies || {}),
    ...Object.keys(pkg.devDependencies || {}),
  ];
  const externals = allDeps.filter((dep) => !allowlist.includes(dep));

  await esbuild({
    entryPoints: [path.join(projectRoot, "server/index.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.join(projectRoot, "dist/index.cjs"),
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    minify: true,
    external: externals,
    logLevel: "info",
  });

  console.log("building Vercel API...");
  for (const stale of ["api/index.cjs", "api/index.js"]) {
    await unlink(path.join(projectRoot, stale)).catch(() => {});
  }
  await esbuild({
    entryPoints: [path.join(projectRoot, "server/vercel.ts")],
    platform: "node",
    bundle: true,
    format: "cjs",
    outfile: path.join(projectRoot, "api/[...path].cjs"),
    target: "node20",
    define: {
      "process.env.NODE_ENV": '"production"',
    },
    alias: {
      "@shared": path.join(projectRoot, "shared"),
    },
    minify: true,
    logLevel: "info",
  });
}

buildAll().catch((err) => {
  console.error(err);
  process.exit(1);
});
