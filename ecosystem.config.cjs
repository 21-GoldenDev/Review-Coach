/**
 * PM2 process config for Linux VPS.
 *
 *   npm run build
 *   pm2 start ecosystem.config.cjs
 *   pm2 save && pm2 startup
 */
module.exports = {
  apps: [
    {
      name: "ratemycoach",
      script: "dist/index.cjs",
      cwd: __dirname,
      instances: 1,
      autorestart: true,
      max_memory_restart: "512M",
      env: {
        NODE_ENV: "production",
        UPLOADS_DIR: "/var/lib/ratemycoach/uploads",
      },
    },
  ],
};
