import { fileURLToPath } from 'node:url';

const patched = process.env.REPRO_REBASE_REFRESH_URL === '1';

export default {
  devIndicators: false,
  // Separate outputs prevent a previous experiment contaminating the baseline.
  distDir: patched ? '.next-patched' : '.next',
  ...(patched ? {
    webpack(config) {
      config.module.rules.push({
        test: /next\/dist\/(?:esm\/)?client\/components\/segment-cache\/navigation\.js$/,
        use: [{
          loader: fileURLToPath(new URL('./diagnostics/rebase-refresh-loader.cjs', import.meta.url)),
        }],
      });
      return config;
    },
  } : {}),
};
