<script setup lang="ts">
const { t } = useI18n()
const items = useI18nEntries<{ q: string; a: string }>('home.faq.items')
</script>

<template>
  <section id="faq" class="border-t border-border">
    <div class="page-narrow section-y">
      <UiSectionHeader
        :eyebrow="t('home.faq.eyebrow')"
        :title="t('home.faq.title')"
        :sub="t('home.faq.sub')"
      />

      <UiRuleList class="mt-10">
        <details
          v-for="(item, i) in items"
          :key="item.q"
          class="group py-5"
        >
          <summary class="flex items-start gap-4 cursor-pointer list-none [&::-webkit-details-marker]:hidden">
            <span class="ui-mark ui-mark-sm mt-0.5 shrink-0" aria-hidden="true">
              {{ String(i + 1).padStart(2, '0') }}
            </span>
            <span class="flex-1 font-display font-semibold text-fg text-base sm:text-lg leading-snug">
              {{ item.q }}
            </span>
            <span class="disclosure-mark mt-0.5 shrink-0 text-accent font-mono text-lg leading-none" aria-hidden="true" />
          </summary>
          <p class="pl-12 pr-8 pt-3 font-body text-sm text-fg-muted leading-relaxed">
            {{ item.a }}
          </p>
        </details>
      </UiRuleList>
    </div>
  </section>
</template>
