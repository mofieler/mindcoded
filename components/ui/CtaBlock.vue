<script setup lang="ts">
defineProps<{
  eyebrow?: string
  title: string
  sub?: string
  to: string
  cta: string
}>()
</script>

<template>
  <section class="border-t border-border">
    <div class="page-narrow section-y">
      <UiSectionHeader
        :eyebrow="eyebrow"
        :title="title"
        :sub="sub"
      />
      <NuxtLink :to="to" class="btn-primary mt-8">
        {{ cta }}
      </NuxtLink>
    </div>
  </section>
</template>
