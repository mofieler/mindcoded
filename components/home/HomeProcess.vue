<script setup lang="ts">
const { t } = useI18n()
const steps = useI18nEntries<{ num: string; title: string; time: string; desc: string }>('home.process.steps')
const { selected, active, onEnter, onLeave, onFocus, onBlur, onSelect } = useFocusSet(() => steps.value.length)
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
        class="process-board ui-focus-group mt-12"
        :style="{ '--focus-i': active, '--focus-n': steps.length }"
      >
        <div class="process-spotlight-track" aria-hidden="true">
          <span class="ui-spotlight" />
        </div>
        <ol class="process-track">
          <li
            v-for="(step, i) in steps"
            :key="step.num"
            class="process-item"
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

.process-spotlight-track {
  display: none;
}

@media (min-width: 900px) {
  .process-board {
    padding-bottom: 0.35rem;
  }

  .process-track {
    grid-template-columns: repeat(4, 1fr);
    gap: 0;
  }

  .process-spotlight-track {
    display: block;
    position: absolute;
    top: 2.75rem;
    left: 0;
    right: 0;
    height: 2px;
    pointer-events: none;
    z-index: 2;
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

.process-rail::after {
  content: '';
  position: absolute;
  top: 2.75rem;
  bottom: -1rem;
  left: 50%;
  width: 1px;
  background: rgb(var(--color-border));
}

.process-item:last-child .process-rail::after {
  display: none;
}

@media (min-width: 900px) {
  .process-rail {
    width: 100%;
    min-height: 0;
    justify-content: flex-start;
    margin-bottom: 1.25rem;
  }

  .process-rail::before {
    content: '';
    position: absolute;
    top: 1.35rem;
    left: 2.7rem;
    right: -0.75rem;
    height: 1px;
    background: rgb(var(--color-border));
  }

  .process-rail::after {
    display: none;
  }

  .process-item:last-child .process-rail::before {
    display: none;
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
