<script setup lang="ts">
const { t } = useI18n()
const steps = useI18nEntries<{ num: string; title: string; time: string; desc: string }>('home.process.steps')
const { selected, active, onEnter, onLeave, onFocus, onBlur, onSelect } = useFocusSet(() => steps.value.length)
const { el, isVisible } = useIntersect({ threshold: 0.12 })
</script>

<template>
  <section id="process">
    <div class="max-w-6xl mx-auto px-6 pt-12 pb-16 sm:pb-20">
      <UiSectionHeader
        :eyebrow="t('home.process.eyebrow')"
        :title="t('home.process.title')"
        :sub="t('home.process.sub')"
      />

      <div
        ref="el"
        class="process-board ui-focus-group ui-enter mt-12"
        :class="{ 'is-in': isVisible }"
        :style="{ '--focus-i': active, '--focus-n': steps.length }"
      >
        <ol class="process-track">
          <li
            v-for="(step, i) in steps"
            :key="step.num"
            class="process-item ui-enter-item"
            :style="{ '--i': i }"
          >
            <button
              type="button"
              class="process-step"
              :aria-pressed="selected === i"
              @mouseenter="onEnter(i)"
              @mouseleave="onLeave"
              @focus="onFocus(i)"
              @blur="onBlur"
              @click="onSelect(i)"
            >
              <span class="process-rail" aria-hidden="true">
                <span class="ui-mark" :class="{ 'is-active': active === i }">
                  {{ step.num }}
                </span>
                <span
                  v-if="i < steps.length - 1"
                  class="process-link"
                  :class="{ 'is-lit': i < active }"
                />
              </span>
              <span
                class="ui-card-interactive process-card"
                :class="{ 'is-active': active === i }"
              >
                <p class="font-mono text-[11px] text-accent uppercase tracking-wider mb-2">
                  {{ step.time }}
                </p>
                <h3 class="font-display font-bold text-lg text-fg">
                  {{ step.title }}
                </h3>
                <p class="mt-2 font-body text-sm text-fg-muted leading-relaxed">
                  {{ step.desc }}
                </p>
              </span>
            </button>
          </li>
        </ol>
      </div>
    </div>
  </section>
</template>

<style scoped>
.process-board {
  position: relative;
  overflow: visible;
}

.process-track {
  display: grid;
  gap: 1rem;
  overflow: visible;
}

@media (min-width: 900px) {
  .process-board {
    padding-bottom: 0.35rem;
  }

  .process-track {
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
  }
}

.process-step {
  display: grid;
  grid-template-columns: 2.75rem 1fr;
  gap: 1rem;
  align-items: start;
  width: 100%;
  appearance: none;
  background: none;
  border: none;
  padding: 0;
  margin: 0;
  font: inherit;
  color: inherit;
  text-align: left;
  cursor: pointer;
  touch-action: manipulation;
}

@media (min-width: 900px) {
  .process-item {
    padding-inline: 0.75rem;
  }

  .process-item:first-child {
    padding-left: 0;
  }

  .process-item:last-child {
    padding-right: 0;
  }

  .process-step {
    display: flex;
    flex-direction: column;
  }
}

.process-rail {
  position: relative;
  display: flex;
  justify-content: center;
  min-height: 100%;
}

.process-link {
  position: absolute;
  top: 2.75rem;
  bottom: -1rem;
  left: 50%;
  width: 2px;
  margin-left: -1px;
  background: rgb(var(--color-border));
  transform-origin: top center;
  transition: background-color var(--duration-card) var(--ease-brand);
}

.process-link.is-lit {
  background: rgb(var(--color-accent));
}

@media (prefers-reduced-motion: no-preference) {
  .process-link {
    transform: scaleY(0);
    transition:
      transform 560ms var(--ease-brand),
      background-color var(--duration-card) var(--ease-brand);
    transition-delay: calc(var(--i, 0) * 80ms + 140ms), 0ms;
  }

  .process-board.is-in .process-link {
    transform: scaleY(1);
  }
}

@media (min-width: 900px) {
  .process-rail {
    width: 100%;
    min-height: 0;
    justify-content: flex-start;
    margin-bottom: 1.25rem;
  }

  .process-link {
    top: 1.35rem;
    bottom: auto;
    left: 2.7rem;
    right: -0.75rem;
    width: auto;
    height: 2px;
    margin-left: 0;
    transform-origin: left center;
  }

  @media (prefers-reduced-motion: no-preference) {
    .process-link {
      transform: scaleX(0);
    }

    .process-board.is-in .process-link {
      transform: scaleX(1);
    }
  }
}

.process-card {
  padding: 1.25rem 1.35rem 1.4rem;
}

@media (min-width: 900px) {
  .process-card {
    min-height: 11.5rem;
  }
}
</style>
