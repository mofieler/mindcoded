import deMessages from '~/locales/de.json'
import enMessages from '~/locales/en.json'

export default defineNuxtPlugin(({ $i18n }) => {
  // Load locale messages
  $i18n.setLocaleMessage('de', deMessages)
  $i18n.setLocaleMessage('en', enMessages)
})
