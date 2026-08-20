<script setup lang="ts">
import {
  SwatchIcon,
  CodeBracketIcon,
  CalendarDaysIcon,
  ChartBarIcon,
  CloudIcon,
} from '@heroicons/vue/24/outline'
import type { Component } from 'vue'

const props = withDefaults(defineProps<{
  expandable?: boolean
  heading?: 'h2' | 'h3'
}>(), {
  expandable: false,
  heading: 'h3',
})

const route = useRoute()
const { items } = useServices()
const localePath = useLocalePath()
const { active, onEnter, onLeave, onFocus, onBlur, onSelect } = useFocusSet(() => items.value.length)

const icons: Record<string, Component> = {
  design: SwatchIcon,
  development: CodeBracketIcon,
  booking: CalendarDaysIcon,
  seo: ChartBarIcon,
  hosting: CloudIcon,
}

const openId = ref<string | null>(null)

const pad = (i: number) => String(i + 1).padStart(2, '0')

const openFromHash = () => {
  if (!props.expandable) return
  const id = route.hash.replace('#', '')
  const idx = items.value.findIndex(item => item.id === id)
  if (idx >= 0) {
    openId.value = id
    onSelect(idx)
  }
}

onMounted(openFromHash)
watch(() => route.hash, openFromHash)

const toggle = (id: string, index: number) => {
  onSelect(index)
  if (!props.expandable) return
  openId.value = openId.value === id ? null : id
}
</script>

<template>
  <div
    class="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 ui-focus-group"
    :style="{ '--focus-i': active, '--focus-n': items.length }"
  >
    <component
      :is="expandable ? 'article' : 'NuxtLink'"
      v-for="(item, i) in items"
      :key="item.id"
      :id="item.id"
      :to="expandable ? undefined : `${localePath('/solutions')}#${item.id}`"
      class="ui-card-interactive service-card"
      :class="{ 'is-active': active === i }"
      @mouseenter="onEnter(i)"
      @mouseleave="onLeave"
      @focus="onFocus(i)"
      @blur="onBlur"
    >
      <button
        v-if="expandable"
        type="button"
        class="w-full text-left bg-transparent border-0 p-0 font-[inherit] text-inherit cursor-pointer"
        :aria-expanded="openId === item.id"
        @click="toggle(item.id, i)"
        @focus="onFocus(i)"
        @blur="onBlur"
      >
        <div class="flex items-start justify-between gap-3">
          <span class="ui-mark" :class="{ 'is-active': active === i }" aria-hidden="true">
            {{ pad(i) }}
          </span>
          <span class="flex items-center gap-2">
            <span class="service-icon">
              <component :is="icons[item.id]" class="w-5 h-5" />
            </span>
            <span
              class="disclosure-mark text-accent font-mono text-lg leading-none"
              :class="{ 'is-minus': openId === item.id }"
              aria-hidden="true"
            />
          </span>
        </div>
        <component :is="heading" class="mt-5 font-display font-bold text-lg text-fg">
          {{ item.title }}
        </component>
        <p class="mt-2 font-body text-sm text-fg-muted leading-relaxed">
          {{ item.teaser }}
        </p>
        <div v-if="item.tags?.length" class="flex flex-wrap gap-1.5 mt-5">
          <TagPill v-for="tag in item.tags" :key="tag">{{ tag }}</TagPill>
        </div>
      </button>

      <template v-else>
        <div class="flex items-start justify-between gap-3">
          <span class="ui-mark" :class="{ 'is-active': active === i }" aria-hidden="true">
            {{ pad(i) }}
          </span>
          <span class="service-icon">
            <component :is="icons[item.id]" class="w-5 h-5" />
          </span>
        </div>
        <component :is="heading" class="mt-5 font-display font-bold text-lg text-fg">
          {{ item.title }}
        </component>
        <p class="mt-2 font-body text-sm text-fg-muted leading-relaxed">
          {{ item.teaser }}
        </p>
        <div v-if="item.tags?.length" class="flex flex-wrap gap-1.5 mt-5">
          <TagPill v-for="tag in item.tags" :key="tag">{{ tag }}</TagPill>
        </div>
      </template>

      <div
        v-if="expandable"
        class="ui-reveal"
        :class="{ 'is-open': openId === item.id }"
      >
        <div>
          <div class="mt-5 pt-5 border-t border-border">
            <p class="font-body text-sm text-fg leading-relaxed">
              {{ item.body }}
            </p>
            <ul v-if="item.includes?.length" class="mt-4 space-y-2">
              <li
                v-for="line in item.includes"
                :key="line"
                class="flex items-start gap-2 font-body text-sm text-fg-muted"
              >
                <span class="mt-1.5 h-1 w-1 rounded-full bg-accent shrink-0" />
                {{ line }}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </component>
  </div>
</template>

<style scoped>
.service-card {
  padding: 1.5rem;
}

@media (min-width: 640px) {
  .service-card {
    padding: 1.75rem;
  }
}

.service-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 2.75rem;
  height: 2.75rem;
  border-radius: 1rem;
  background: rgb(var(--color-accent) / 0.1);
  color: rgb(var(--color-accent));
}

</style>
