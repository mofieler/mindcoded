<script setup lang="ts">
const { t, locale } = useI18n()

useSeo({
  title: locale.value === 'de' ? 'Datenschutz – Studio Name' : 'Privacy Policy – Studio Name',
  description: locale.value === 'de' ? 'Datenschutzerklärung / Privacy Policy' : 'Privacy Policy / Datenschutzerklärung',
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-24">
    <!-- Header -->
    <div class="mb-16">
      <p class="text-accent text-xs font-display font-semibold tracking-[0.3em] uppercase mb-4">
        {{ locale === 'de' ? 'Datenschutz' : 'Privacy Policy' }}
      </p>
      <h1 class="font-display font-extrabold text-5xl sm:text-6xl text-fg mb-6">
        {{ locale === 'de' ? 'Schutz Ihrer Daten' : 'Protection of Your Data' }}
      </h1>
    </div>

    <!-- Content -->
    <div class="space-y-12 bg-surface rounded-xl p-8 sm:p-12 border border-border">
      <!-- General Section -->
      <div class="mb-12">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? '1. Allgemeines' : '1. General' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            {{ locale === 'de'
              ? 'Der Schutz Ihrer persönlichen Daten ist uns ein besonderes Anliegen. Wir verarbeiten Ihre Daten daher ausschließlich auf Grundlage der gesetzlichen Bestimmungen (DSGVO, TMG).'
              : 'The protection of your personal data is of particular concern to us. We therefore process your data exclusively on basis of legal regulations (GDPR, TMG).' }}
          </p>
        </div>
      </div>

      <!-- Cookies Section -->
      <div class="border-t border-border pt-8">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? '2. Cookies und Tracking' : '2. Cookies and Tracking' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            {{ locale === 'de'
              ? 'Wir verwenden Cookies und ähnliche Technologien, um die Website-Funktionalität zu verbessern und die Nutzung zu analysieren. Diese Technologien können Daten auf Ihrem Gerät speichern.'
              : 'We use cookies and similar technologies to improve website functionality and analyze usage. These technologies may store data on your device.' }}
          </p>
        </div>
      </div>

      <!-- Third Party Section -->
      <div class="border-t border-border pt-8">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? '3. Drittanbieter-Dienste' : '3. Third Party Services' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            {{ locale === 'de'
              ? 'Durch die Nutzung unserer Website stimmen Sie der Verarbeitung Ihrer Daten durch diese Drittanbieter zu.'
              : 'By using our website, you consent to to processing of your data by these third parties.' }}
          </p>
        </div>
      </div>

      <!-- Hosting Section -->
      <div class="border-t border-border pt-8">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? '4. Hosting & Server-Logs' : '4. Hosting & Server Logs' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            {{ locale === 'de'
              ? 'Diese Website wird bei Vercel, Inc. gehostet. Beim Aufruf der Website werden durch Vercel automatisch Server-Logfiles erstellt, die technische Daten wie IP-Adresse, Browsertyp und Zugriffszeit enthalten. Diese Daten sind nicht einer bestimmten Person zuordenbar.'
              : 'This website is hosted by Vercel, Inc. When accessing the website, Vercel automatically creates server log files containing technical data such as IP address, browser type and access time. This data cannot be attributed to a specific person.' }}
          </p>
        </div>
      </div>

      <!-- Rights Section -->
      <div class="border-t border-border pt-8">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? '5. Ihre Rechte' : '5. Your Rights' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            {{ locale === 'de'
              ? 'Ihnen stehen bezüglich Ihrer gespeicherten Daten grundsätzlich die Rechte auf Auskunft, Berichtigung, Löschung, Einschränkung, Datenübertragbarkeit und Widerspruch zu. Bei Beschwerden wenden Sie sich an die Datenschutzbehörde.'
              : 'You have the right to access, correct, delete, restrict, transfer and object to your stored data. For complaints, contact the data protection authority.' }}
          </p>
        </div>
      </div>

      <!-- Disclaimer Section -->
      <div class="border-t border-border pt-8">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? 'Wichtiger Hinweis' : 'Important Notice' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p class="text-sm">
            {{ locale === 'de'
              ? '⚠ Hinweis: Diese Datenschutzerklärung ist ein Platzhalter und muss vor dem Go-Live durch einen Rechtsanwalt geprüft werden.'
              : '⚠ Note: This privacy policy is a placeholder and must be reviewed by a lawyer before going live.' }}
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div class="border-t border-border pt-8 text-center">
        <p class="font-body text-fg-muted text-sm">
          Mindcoded by Mo · {{ locale === 'de' ? 'Stuttgart, Deutschland' : 'Stuttgart, Germany' }}
        </p>
      </div>
    </div>
  </div>
</template>
