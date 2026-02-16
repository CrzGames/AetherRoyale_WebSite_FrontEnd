// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  app: {
    head: {
      title: 'Aether Royale', // default fallback title
      meta: [{ name: 'viewport', content: 'width=device-width, initial-scale=1' }, { charset: 'utf-8' }],
      script: [],
      link: [],
      style: [],
      noscript: [],
    },
  },
  // Directory of your source files
  srcDir: 'src-nuxt/app',
  serverDir: 'src-nuxt/server',
  dir: {
    public: 'src-nuxt/public', // Spécifie que le dossier public se trouve dans src-nuxt
  },
  ssr: process.env.NUXT_SSR === 'true',
  devtools: { enabled: true },
  telemetry: false,
  components: true,
  modules: [
    '@pinia/nuxt',
    '@nuxt/test-utils/module',
    '@nuxtjs/sitemap',
    '@nuxtjs/google-fonts',
    '@nuxtjs/tailwindcss',
    '@nuxt/image',
    '@nuxtjs/robots',
    '@nuxtjs/sitemap',
    'nuxt-seo-utils',
  ],
  pinia: {
    storesDirs: ['./src-nuxt/app/stores/**'],
  },
  tailwindcss: {
    exposeConfig: true,
    viewer: true,
  },
  postcss: {
    plugins: {
      tailwindcss: {},
      autoprefixer: {},
    },
  },
  googleFonts: {
    families: {
      Poppins: true,
    },
  },
  image: {
    // Options
  },
})
