<script setup lang="ts">
const { t } = useI18n()
const studio = useStudio()
</script>

<template>
  <section id="contact" class="border-t border-border">
    <div class="max-w-xl mx-auto px-6 py-24">
      <UiSectionHeader
        align="center"
        :eyebrow="t('nav.contact')"
        :title="t('contact.title')"
        :sub="t('contact.form_sub')"
      />
      <p class="mt-6 text-center font-body text-sm text-fg-muted">
        <a :href="`mailto:${studio.email}`" class="hover:text-fg">{{ studio.email }}</a>
        <span class="mx-2 text-border">·</span>
        <a :href="studio.phoneHref" class="hover:text-fg">{{ studio.phone }}</a>
        <span class="mx-2 text-border">·</span>
        {{ studio.city }}
      </p>
      <div class="mt-12">
        <ClientOnly>
          <UiContactForm />
        </ClientOnly>
      </div>
    </div>
  </section>
</template>
