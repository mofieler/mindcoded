<template>
  <div class="min-h-screen flex flex-col bg-base text-fg">
    <AppNav />
    <main class="flex-1 pt-nav">
      <slot />
    </main>
    <AppFooter />
  </div>
</template>
