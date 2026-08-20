<template>
  <section class="hero relative overflow-hidden">
    <HomeHeroMedia />
    <HomeHeroInner />
  </section>
</template>

<style scoped>
.hero {
  min-height: 100dvh;
  display: flex;
  align-items: center;
  background: rgb(var(--color-base));
}

@media (max-height: 700px) {
  .hero {
    min-height: 0;
    padding-block: 7rem 4rem;
  }
}
</style>
