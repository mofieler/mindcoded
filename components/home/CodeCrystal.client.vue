<script setup lang="ts">
import * as THREE from 'three'

const hostRef = ref<HTMLElement | null>(null)

onMounted(() => {
  const host = hostRef.value
  if (!host) return

  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  let raf = 0
  let visible = true
  let running = true
  const clock = new THREE.Clock()
  const pointer = { x: 0, y: 0 }

  const brandEase = (t: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 4)

  const renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setClearColor(0x000000, 0)
  renderer.outputColorSpace = THREE.SRGBColorSpace
  host.appendChild(renderer.domElement)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(36, 1, 0.1, 30)
  camera.position.set(0, 0.06, 3.7)

  const root = new THREE.Group()
  root.rotation.set(0.34, 0.62, -0.08)
  scene.add(root)

  const key = new THREE.DirectionalLight(0xffffff, 1.35)
  key.position.set(-2.1, 3.2, 4)
  scene.add(key)
  const rim = new THREE.DirectionalLight(0x1e50fa, 1.9)
  rim.position.set(2.6, 1.2, -3)
  scene.add(rim)
  const coreLight = new THREE.PointLight(0x1e50fa, 2.1, 7, 1.6)
  root.add(coreLight)
  scene.add(new THREE.AmbientLight(0xffffff, 0.5))

  const hex = (y: number, r: number) =>
    Array.from({ length: 6 }, (_, i) => {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2
      return new THREE.Vector3(Math.cos(a) * r, y, Math.sin(a) * r)
    })

  const top = new THREE.Vector3(0, 1.34, 0)
  const upper = hex(0.4, 1.02)
  const lower = hex(-0.48, 0.88)
  const bottom = new THREE.Vector3(0, -1.28, 0)
  const verts = [top, ...upper, ...lower, bottom]
  const lattice = [
    ...verts,
    ...verts.map((v) => v.clone().multiplyScalar(0.58)),
    new THREE.Vector3(0, 0, 0),
  ]

  const tri = (positions: number[], a: THREE.Vector3, b: THREE.Vector3, c: THREE.Vector3) => {
    positions.push(a.x, a.y, a.z, b.x, b.y, b.z, c.x, c.y, c.z)
  }
  const positions: number[] = []
  for (let i = 0; i < 6; i++) {
    const n = (i + 1) % 6
    tri(positions, top, upper[i], upper[n])
    tri(positions, upper[i], lower[i], upper[n])
    tri(positions, upper[n], lower[i], lower[n])
    tri(positions, lower[i], bottom, lower[n])
  }

  const solidGeo = new THREE.BufferGeometry()
  solidGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  solidGeo.computeVertexNormals()

  const solidMat = new THREE.MeshStandardMaterial({
    color: 0x1e50fa,
    metalness: 0.18,
    roughness: 0.22,
    transparent: true,
    opacity: 0.22,
    emissive: 0x1e50fa,
    emissiveIntensity: 0.2,
    side: THREE.DoubleSide,
  })
  const solid = new THREE.Mesh(solidGeo, solidMat)
  root.add(solid)

  const edgeGeo = new THREE.EdgesGeometry(solidGeo, 18)
  const edgeMat = new THREE.LineBasicMaterial({ color: 0x1e50fa, transparent: true, opacity: 0 })
  const edges = new THREE.LineSegments(edgeGeo, edgeMat)
  root.add(edges)

  const glyphs = ['<', '>', '/', '{', '}', '[', ']', '=', ';', '0', '1', '#']
  const atlasCols = 4
  const cell = 96
  const atlasRows = Math.ceil(glyphs.length / atlasCols)
  const atlas = document.createElement('canvas')
  atlas.width = cell * atlasCols
  atlas.height = cell * atlasRows
  const ctx = atlas.getContext('2d')
  if (ctx) {
    ctx.clearRect(0, 0, atlas.width, atlas.height)
    ctx.fillStyle = '#ffffff'
    ctx.font = '700 58px "Instrument Sans", ui-monospace, monospace'
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    glyphs.forEach((g, i) => {
      const x = (i % atlasCols) * cell + cell / 2
      const y = Math.floor(i / atlasCols) * cell + cell / 2
      ctx.fillText(g, x, y)
    })
  }
  const atlasTex = new THREE.CanvasTexture(atlas)
  atlasTex.colorSpace = THREE.SRGBColorSpace
  atlasTex.needsUpdate = true
  atlasTex.minFilter = THREE.LinearFilter

  const tokenCount = 84
  const tokenGeo = new THREE.PlaneGeometry(0.18, 0.18)
  const glyphIndex = new Float32Array(tokenCount)
  for (let i = 0; i < tokenCount; i++) glyphIndex[i] = i % glyphs.length
  tokenGeo.setAttribute('aGlyph', new THREE.InstancedBufferAttribute(glyphIndex, 1))

  const tokenMat = new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    uniforms: {
      uMap: { value: atlasTex },
      uColor: { value: new THREE.Color(0x1e50fa) },
      uOpacity: { value: 1 },
      uCols: { value: atlasCols },
      uRows: { value: atlasRows },
    },
    vertexShader: `
      attribute float aGlyph;
      varying vec2 vUv;
      uniform float uCols;
      uniform float uRows;
      void main() {
        float col = mod(aGlyph, uCols);
        float row = floor(aGlyph / uCols);
        vUv = vec2(
          (uv.x + col) / uCols,
          (uv.y + (uRows - 1.0 - row)) / uRows
        );
        vec4 mv = modelViewMatrix * instanceMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: `
      uniform sampler2D uMap;
      uniform vec3 uColor;
      uniform float uOpacity;
      varying vec2 vUv;
      void main() {
        float a = texture2D(uMap, vUv).a;
        if (a < 0.12) discard;
        gl_FragColor = vec4(uColor, a * uOpacity);
      }
    `,
  })
  tokenMat.toneMapped = false
  const tokens = new THREE.InstancedMesh(tokenGeo, tokenMat, tokenCount)
  tokens.frustumCulled = false
  root.add(tokens)

  const dummy = new THREE.Object3D()
  const tokenHome = Array.from({ length: tokenCount }, (_, i) => {
    const base = lattice[i % lattice.length].clone()
    const jitter = new THREE.Vector3(
      Math.sin(i * 2.1) * 0.16,
      Math.cos(i * 1.4) * 0.12,
      Math.sin(i * 0.9) * 0.16,
    )
    return base.add(jitter)
  })
  const tokenFrom = tokenHome.map((p, i) => p.clone().add(new THREE.Vector3(
    Math.sin(i * 1.73) * 3.4,
    Math.cos(i * 1.11) * 2.6,
    Math.cos(i * 0.79) * 3.4,
  )))

  const nodeGeo = new THREE.OctahedronGeometry(0.055, 0)
  const nodeMat = new THREE.MeshStandardMaterial({
    color: 0x1e50fa,
    emissive: 0x1e50fa,
    emissiveIntensity: 1.05,
    roughness: 0.3,
  })
  const nodes = new THREE.InstancedMesh(nodeGeo, nodeMat, verts.length)
  verts.forEach((v, i) => {
    dummy.position.copy(v)
    dummy.updateMatrix()
    nodes.setMatrixAt(i, dummy.matrix)
  })
  nodes.instanceMatrix.needsUpdate = true
  root.add(nodes)

  const tokenRgb = (name: string, fallback: string) => {
    const raw = getComputedStyle(host).getPropertyValue(name).trim() || fallback
    const [r, g, b] = raw.split(/\s+/).map(Number)
    return new THREE.Color(r / 255, g / 255, b / 255)
  }

  const applyTheme = () => {
    const dark = document.documentElement.classList.contains('dark')
    const accent = tokenRgb('--color-accent', dark ? '37 99 255' : '0 87 255')
    const fg = tokenRgb('--color-fg', dark ? '244 241 234' : '22 20 18')

    solidMat.color.copy(accent)
    solidMat.emissive.copy(accent)
    solidMat.opacity = dark ? 0.18 : 0.28
    edgeMat.color.copy(accent)
    nodeMat.color.copy(accent)
    nodeMat.emissive.copy(accent)
    tokenMat.uniforms.uColor.value.copy(accent)
    key.color.copy(fg)
    key.intensity = dark ? 0.9 : 1.35
    rim.color.copy(accent)
    rim.intensity = dark ? 2.2 : 1.7
    coreLight.color.copy(accent)
  }
  applyTheme()
  const themeWatch = new MutationObserver(applyTheme)
  themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })

  const resize = () => {
    const w = host.clientWidth || 1
    const h = host.clientHeight || 1
    camera.aspect = w / h
    camera.updateProjectionMatrix()
    renderer.setSize(w, h, false)
  }
  resize()
  const ro = new ResizeObserver(resize)
  ro.observe(host)

  const onPointer = (e: PointerEvent) => {
    pointer.x = (e.clientX / window.innerWidth) * 2 - 1
    pointer.y = -((e.clientY / window.innerHeight) * 2 - 1)
  }
  window.addEventListener('pointermove', onPointer, { passive: true })

  const assembleAt = (cycle: number) => {
    if (reduced) return 1
    return brandEase(Math.min(1, cycle / 3.2))
  }

  const tick = () => {
    if (!running) return
    if (!visible) {
      raf = 0
      return
    }
    raf = requestAnimationFrame(tick)

    const t = clock.getElapsedTime()
    const assemble = assembleAt(t)
    const hold = assemble
    const pulse = 0.9 + Math.sin(t * 1.5) * 0.1
    const dark = document.documentElement.classList.contains('dark')

    for (let i = 0; i < tokenCount; i++) {
      dummy.position.lerpVectors(tokenFrom[i], tokenHome[i], assemble)
      dummy.scale.setScalar(0.75 + assemble * 0.5)
      dummy.rotation.set(
        (1 - assemble) * 0.8,
        assemble * 0.15 + i * 0.02,
        (1 - assemble) * (i * 0.35 + t * 0.9),
      )
      dummy.updateMatrix()
      tokens.setMatrixAt(i, dummy.matrix)
    }
    tokens.instanceMatrix.needsUpdate = true
    tokenMat.uniforms.uOpacity.value = 0.35 + assemble * 0.65

    solid.scale.setScalar(0.2 + hold * 0.8)
    edges.scale.copy(solid.scale)
    nodes.scale.copy(solid.scale)
    solidMat.opacity = (dark ? 0.18 : 0.28) * hold
    edgeMat.opacity = hold * 0.95
    nodeMat.emissiveIntensity = (dark ? 1.25 : 0.95) * pulse
    coreLight.intensity = (dark ? 2.6 : 1.9) * pulse

    if (!reduced) {
      root.rotation.y = 0.62 + t * 0.08
      root.rotation.x = 0.34 + Math.sin(t * 0.22) * 0.04
      root.rotation.y += pointer.x * 0.16
      root.rotation.x += pointer.y * 0.1
    }

    renderer.render(scene, camera)
  }
  tick()

  const io = new IntersectionObserver(([entry]) => {
    visible = !!entry?.isIntersecting
    if (visible && !raf) tick()
  }, { threshold: 0.08 })
  io.observe(host)

  onBeforeUnmount(() => {
    running = false
    cancelAnimationFrame(raf)
    io.disconnect()
    ro.disconnect()
    themeWatch.disconnect()
    window.removeEventListener('pointermove', onPointer)
    solidGeo.dispose()
    edgeGeo.dispose()
    tokenGeo.dispose()
    nodeGeo.dispose()
    solidMat.dispose()
    edgeMat.dispose()
    tokenMat.dispose()
    nodeMat.dispose()
    atlasTex.dispose()
    renderer.dispose()
    renderer.domElement.remove()
  })
})
</script>

<template>
  <div
    ref="hostRef"
    class="crystal"
    role="img"
    aria-hidden="true"
  />
</template>

<style scoped>
.crystal {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  max-width: 42rem;
  min-height: 20rem;
  margin-inline: auto;
}

.crystal::before {
  content: '';
  position: absolute;
  inset: 10%;
  border-radius: 50%;
  background: radial-gradient(circle, rgb(var(--color-accent) / 0.32) 0%, transparent 70%);
  filter: blur(22px);
  pointer-events: none;
}

.crystal :deep(canvas) {
  position: relative;
  display: block;
  width: 100%;
  height: 100%;
}

@media (min-width: 1024px) {
  .crystal {
    min-height: 28rem;
    max-width: none;
  }
}
</style>
