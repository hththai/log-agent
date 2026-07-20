import { defineConfig } from 'vite'
import { devtools } from '@tanstack/devtools-vite'

import { tanstackStart } from '@tanstack/react-start/plugin/vite'

import viteReact from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { nitro } from 'nitro/vite'

// INTERNAL_API_URL is read at build time; defaults to the Docker service name.
// Set it in the Dockerfile ARG / docker-compose build.args if the service name differs.
const internalApiUrl = process.env.INTERNAL_API_URL ?? 'http://log_report:8000'

const config = defineConfig({
  resolve: { tsconfigPaths: true },
  plugins: [
    devtools(),
    tailwindcss(),
    tanstackStart(),
    viteReact(),
    nitro({
      routeRules: {
        // Browser calls /api/* → Nitro proxies to internal Python server.
        // fetchOptions.redirect: 'manual' is required — h3's proxy() calls
        // the global fetch(), which follows redirects by default. Without
        // this, a 302 from FastAPI (e.g. /sso/authorize -> Google) gets
        // followed server-side and the target page's HTML is inlined into
        // a 200 response under our own origin instead of reaching the
        // browser as a real redirect.
        '/api/**': { proxy: { to: `${internalApiUrl}/**`, fetchOptions: { redirect: 'manual' } } },
      },
    }),
  ],
})

export default config
