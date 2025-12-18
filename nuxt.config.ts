// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
  devServer: {
    port: 3004,
  },
  modules: ['@nuxtjs/tailwindcss'],

  css: ['~/assets/css/main.css'],

  typescript: {
    strict: true,
    typeCheck: false
  },

  experimental: {
    appManifest: false
  },

  app: {
    head: {
      title: '个人报销管理系统',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { name: 'description', content: '个人报销管理平台' }
      ]
    }
  }
})
