<script setup lang="ts">
const { t, locale } = useI18n()

useSeo({
  title: locale.value === 'de' ? 'Impressum – Studio Name' : 'Imprint – Studio Name',
  description: locale.value === 'de' ? 'Impressum und rechtliche Angaben gemäß § 5 TMG.' : 'Imprint and legal information according to § 5 TMG.',
})
</script>

<template>
  <div class="max-w-4xl mx-auto px-6 py-24">
    <!-- Header -->
    <div class="mb-16">
      <p class="text-accent text-xs font-display font-semibold tracking-[0.3em] uppercase mb-4">
        {{ locale === 'de' ? 'Impressum' : 'Imprint' }}
      </p>
      <h1 class="font-display font-extrabold text-5xl sm:text-6xl text-fg mb-6">
        {{ locale === 'de' ? 'Angaben gemäß § 5 TMG' : 'Information according to § 5 TMG' }}
      </h1>
    </div>

    <!-- Content -->
    <div class="space-y-12 bg-surface rounded-xl p-8 sm:p-12 border border-border">
      <!-- Contact Info -->
      <div class="mb-12">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? 'Kontakt' : 'Contact' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            <strong>{{ locale === 'de' ? 'E-Mail:' : 'Email:' }}</strong> 
            <a 
              href="mailto:moritzfieler@icloud.com" 
              class="text-accent hover:text-accent/80 transition-colors"
            >
              moritzfieler@icloud.com
            </a>
          </p>
          <p>
            <strong>{{ locale === 'de' ? 'Berufsbezeichnung:' : 'Professional Title:' }}</strong> 
            {{ locale === 'de' ? 'Freiberuflicher UX Designer & Frontend Entwickler' : 'Freelance UX Designer & Frontend Developer' }}
          </p>
          <p>
            <strong>{{ locale === 'de' ? 'Verliehen in:' : 'Based in:' }}</strong> 
            {{ locale === 'de' ? 'Deutschland' : 'Germany' }}
          </p>
        </div>
      </div>

      <!-- Legal Separator -->
      <div class="border-t border-border pt-8">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? 'Steuerliche Angaben' : 'Tax Information' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            Als Kleinunternehmer im Sinne von § 19 Abs. 1 UStG wird keine Umsatzsteuer berechnet und ausgewiesen. Eine Umsatzsteuer-Identifikationsnummer liegt daher nicht vor.
          </p>
        </div>
      </div>

      <!-- Liability Separator -->
      <div class="border-t border-border pt-8">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? 'Verantwortlich für den Inhalt (§ 55 Abs. 2 RStV)' : 'Responsible for Content (§ 55 Abs. 2 RStV)' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            <strong>Moritz Fieler</strong><br>
            Sautterweg 30<br>
            70565 Stuttgart
          </p>
        </div>
      </div>

      <!-- Content Liability Separator -->
      <div class="border-t border-border pt-8">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? 'Haftung für Inhalte' : 'Liability for Content' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            Als Dienstleister bin ich gemäß § 7 Abs. 1 TMG für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Nach §§ 8 bis 10 TMG bin ich als Dienstleister jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überprüfen oder nach Umständen zu entfernen, die auf eine rechtswidrige Tätigkeit hinweisen.
          </p>
        </div>
      </div>

      <!-- Links Liability Separator -->
      <div class="border-t border-border pt-8">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? 'Haftung für Links' : 'Liability for Links' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            Mein Angebot enthält Links zu externen Websites Dritter, auf deren Inhalte ich keinen Einfluss habe. Deshalb kann ich für diese fremden Inhalte auch keine Gewähr übernehmen. Für die Inhalte der verlinkten Seiten ist stets der jeweilige Anbieter oder Betreiber der Seiten verantwortlich.
          </p>
        </div>
      </div>

      <!-- Copyright Separator -->
      <div class="border-t border-border pt-8">
        <h2 class="font-display font-bold text-2xl text-fg mb-6">
          {{ locale === 'de' ? 'Urheberrecht' : 'Copyright' }}
        </h2>
        <div class="space-y-4 font-body text-fg-muted">
          <p>
            Die durch mich erstellten Inhalte und Werke auf diesen Seiten unterliegen dem deutschen Urheberrecht. Die Vervielfältigung, Bearbeitung, Verbreitung und jede Art der Verwertung außerhalb der Grenzen des Urheberrechts bedürfen meiner schriftlichen Zustimmung.
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
