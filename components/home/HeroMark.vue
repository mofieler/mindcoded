<template>
  <div class="mark" aria-hidden="true">
    <div class="mark-haze" />
    <div class="mark-floor" />
    <div class="mark-space">
      <div class="orb">
        <span class="orb-core" />
        <span class="orb-shine" />
      </div>
      <div class="ring r1" />
      <div class="ring r2" />
      <div class="ring r3" />
      <span class="dot d1" />
      <span class="dot d2" />
      <span class="dot d3" />
      <span class="dot d4" />
    </div>
  </div>
</template>

<style scoped>
.mark {
  position: absolute;
  inset: 0;
  overflow: hidden;
  background:
    radial-gradient(ellipse 70% 60% at 58% 46%, rgb(var(--color-accent) / 0.14), transparent 62%),
    radial-gradient(ellipse 40% 36% at 22% 78%, rgb(var(--color-fg) / 0.05), transparent 55%),
    rgb(var(--color-base));
}

.mark-haze {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(rgb(var(--color-fg) / 0.035) 1px, transparent 1px),
    linear-gradient(90deg, rgb(var(--color-fg) / 0.035) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(ellipse 70% 65% at 55% 45%, black 20%, transparent 75%);
}

.mark-floor {
  position: absolute;
  left: 18%;
  right: 18%;
  bottom: 12%;
  height: 18%;
  background: radial-gradient(ellipse at center, rgb(var(--color-accent) / 0.18), transparent 70%);
  filter: blur(18px);
}

.mark-space {
  position: absolute;
  inset: 8% 12% 18% 12%;
  transform-style: preserve-3d;
  perspective: 900px;
}

.orb {
  position: absolute;
  left: 50%;
  top: 46%;
  width: 22%;
  aspect-ratio: 1;
  transform: translate(-50%, -50%);
}

.orb-core {
  position: absolute;
  inset: 0;
  border-radius: 50%;
  background:
    radial-gradient(circle at 32% 28%, rgb(var(--color-fg) / 0.55), transparent 28%),
    radial-gradient(circle at 50% 50%, rgb(var(--color-accent) / 0.95), rgb(var(--color-accent) / 0.15) 62%, transparent 70%);
  box-shadow:
    0 0 28px rgb(var(--color-accent) / 0.35),
    0 0 64px rgb(var(--color-accent) / 0.12);
}

.orb-shine {
  position: absolute;
  left: 22%;
  top: 18%;
  width: 28%;
  height: 18%;
  border-radius: 50%;
  background: rgb(var(--color-fg) / 0.35);
  filter: blur(2px);
}

.ring {
  position: absolute;
  left: 50%;
  top: 46%;
  border-radius: 50%;
  border: 1px solid rgb(var(--color-accent) / 0.45);
  transform-style: preserve-3d;
}

.r1 {
  width: 58%;
  aspect-ratio: 1;
  margin-left: -29%;
  margin-top: -29%;
  animation: orbit-a 22s linear infinite;
  border-color: rgb(var(--color-accent) / 0.55);
}

.r2 {
  width: 78%;
  aspect-ratio: 1;
  margin-left: -39%;
  margin-top: -39%;
  border-color: rgb(var(--color-fg) / 0.22);
  animation: orbit-b 32s linear infinite;
}

.r3 {
  width: 46%;
  aspect-ratio: 1;
  margin-left: -23%;
  margin-top: -23%;
  border-color: rgb(var(--color-accent) / 0.28);
  animation: orbit-c 18s linear infinite reverse;
}

.dot {
  position: absolute;
  width: 5px;
  height: 5px;
  border-radius: 50%;
  background: rgb(var(--color-accent));
  box-shadow: 0 0 10px rgb(var(--color-accent) / 0.8);
  left: 50%;
  top: 46%;
}

.d1 { animation: fly-1 14s ease-in-out infinite; }
.d2 { animation: fly-2 18s ease-in-out infinite; background: rgb(var(--color-fg) / 0.7); }
.d3 { animation: fly-3 16s ease-in-out infinite reverse; }
.d4 { width: 3px; height: 3px; animation: fly-4 20s ease-in-out infinite; }

@keyframes orbit-a {
  from { transform: rotateX(68deg) rotateZ(0deg); }
  to { transform: rotateX(68deg) rotateZ(360deg); }
}

@keyframes orbit-b {
  from { transform: rotateY(58deg) rotateX(18deg) rotateZ(0deg); }
  to { transform: rotateY(58deg) rotateX(18deg) rotateZ(-360deg); }
}

@keyframes orbit-c {
  from { transform: rotateX(28deg) rotateY(-48deg) rotateZ(0deg); }
  to { transform: rotateX(28deg) rotateY(-48deg) rotateZ(360deg); }
}

@keyframes fly-1 {
  0%, 100% { transform: translate(-8%, -42%) scale(1); opacity: 0.9; }
  50% { transform: translate(28%, 18%) scale(0.7); opacity: 0.4; }
}

@keyframes fly-2 {
  0%, 100% { transform: translate(36%, -8%) scale(0.8); opacity: 0.55; }
  50% { transform: translate(-30%, 24%) scale(1); opacity: 0.9; }
}

@keyframes fly-3 {
  0%, 100% { transform: translate(-36%, 12%) scale(1); opacity: 0.7; }
  50% { transform: translate(12%, -36%) scale(0.6); opacity: 0.35; }
}

@keyframes fly-4 {
  0%, 100% { transform: translate(22%, 32%) scale(1); opacity: 0.5; }
  50% { transform: translate(-18%, -22%) scale(1.2); opacity: 0.85; }
}

@media (prefers-reduced-motion: reduce) {
  .ring,
  .dot {
    animation: none;
  }

  .r1 { transform: rotateX(68deg) rotateZ(24deg); }
  .r2 { transform: rotateY(58deg) rotateX(18deg) rotateZ(-20deg); }
  .r3 { transform: rotateX(28deg) rotateY(-48deg) rotateZ(40deg); }
  .d1 { transform: translate(-8%, -42%); }
  .d2 { transform: translate(36%, -8%); }
  .d3 { transform: translate(-36%, 12%); }
  .d4 { transform: translate(22%, 32%); }
}
</style>
