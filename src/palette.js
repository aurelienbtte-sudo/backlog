// Test : la fiche d'une œuvre prend les couleurs de son affiche.
// On repère la teinte dominante de l'image, puis on fabrique une palette claire ou sombre
// (selon le mode de l'appareil) qui remplace celle de l'appli tant que la fiche est ouverte.
import { useEffect } from 'react'

function rgbToHsl(r, g, b) {
  r /= 255
  g /= 255
  b /= 255
  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  const l = (max + min) / 2
  if (max === min) return [0, 0, l * 100]
  const d = max - min
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
  const h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4
  return [h * 60, s * 100, l * 100]
}

// Teinte dominante : on classe les pixels par teinte (24 familles). La surface compte plus que la vivacité,
// pour qu'un petit détail très vif ne l'emporte pas sur la couleur principale de l'affiche.
function dominantColor(img) {
  const canvas = document.createElement('canvas')
  canvas.width = 24
  canvas.height = 36
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data // erreur si l'image n'autorise pas la lecture
  const N = 24
  const bins = Array.from({ length: N }, () => ({ w: 0, x: 0, y: 0, s: 0 }))
  let grey = 0
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
    // pixels presque gris, presque noirs ou presque blancs : ils ne donnent pas de teinte
    if (s < 18 || l < 12 || l > 90) {
      grey++
      continue
    }
    const w = 0.4 + 0.6 * (s / 100) // la surface d'abord, la vivacité ensuite
    const bin = bins[Math.floor(h / (360 / N)) % N]
    const rad = (h * Math.PI) / 180
    bin.w += w
    bin.x += Math.cos(rad) * w // moyenne sur le cercle des teintes (le rouge est à 0° et à 360°)
    bin.y += Math.sin(rad) * w
    bin.s += s * w
  }
  // une teinte gagne avec ses voisines : une affiche « orange-rouge » ne se divise pas en deux
  const score = bins.map((b, i) => b.w + 0.6 * (bins[(i + N - 1) % N].w + bins[(i + 1) % N].w))
  const top = score.indexOf(Math.max(...score))
  const group = [bins[(top + N - 1) % N], bins[top], bins[(top + 1) % N]]
  const total = group.reduce((t, b) => t + b.w, 0)
  const pixels = data.length / 4
  // image presque en noir et blanc : palette neutre, légèrement chaude
  if (total === 0 || grey > pixels * 0.85) return { h: 30, s: 8 }
  const x = group.reduce((t, b) => t + b.x, 0)
  const y = group.reduce((t, b) => t + b.y, 0)
  const h = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360
  const s = group.reduce((t, b) => t + b.s, 0) / total
  return { h, s: Math.min(s, 75) }
}

// Les sites d'affiches (TMDB…) n'autorisent pas la lecture des couleurs de leurs images.
// On demande donc une miniature au service d'images gratuit wsrv.nl, qui l'autorise,
// puis on essaie l'image d'origine en dernier recours.
function readableSources(src) {
  const bare = src.replace(/^https?:\/\//, '')
  return [`https://wsrv.nl/?url=${encodeURIComponent(bare)}&w=60&output=jpg`, src]
}

function loadReadable(sources) {
  return new Promise((resolve) => {
    const tryNext = (i) => {
      if (i >= sources.length) return resolve(null)
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          resolve(dominantColor(img))
        } catch {
          tryNext(i + 1) // image chargée mais illisible
        }
      }
      img.onerror = () => tryNext(i + 1)
      img.src = sources[i]
    }
    tryNext(0)
  })
}

const hsl = (h, s, l, a = 1) => `hsla(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%, ${a})`

function paletteFor({ h, s }, dark) {
  if (dark) {
    const bs = Math.min(s, 55)
    return {
      '--bg': hsl(h, bs, 16), '--paper': hsl(h, bs, 16), '--bg-2': hsl(h, bs, 12), '--bg-3': hsl(h, bs, 24),
      '--hover': hsl(h, bs, 30), '--border': hsl(h, bs, 28),
      '--text': hsl(h, 30, 94), '--muted': hsl(h, 25, 75), '--soft': hsl(h, 25, 86),
      '--ink': hsl(h, Math.min(s + 10, 80), 78), '--on-ink': hsl(h, bs, 14), '--primary': hsl(h, Math.min(s + 10, 80), 78),
      '--glass': hsl(h, bs, 12, 0.72), '--glass-strong': hsl(h, bs, 18, 0.95),
      '--bar-text': hsl(h, 30, 94), '--bar-active': 'rgba(255, 255, 255, .15)', '--bar-border': 'rgba(255, 255, 255, .2)',
      '--line': hsl(h, 40, 78, 0.6), '--star': hsl(h, Math.min(s + 10, 80), 78), '--star-empty': hsl(h, 30, 80, 0.25),
      '--shadow': 'rgba(0, 0, 0, .35)',
      '--hero-text': '#fff', '--hero-glow': 'rgba(0, 0, 0, .5)',
      '--hero-btn-bg': 'rgba(255, 255, 255, .16)', '--hero-btn-text': '#fff', '--hero-btn-border': 'rgba(255, 255, 255, .3)',
      'color-scheme': 'dark',
    }
  }
  const bs = Math.min(s, 45)
  return {
    '--bg': hsl(h, bs, 90), '--paper': hsl(h, bs, 90), '--bg-2': hsl(h, bs, 86), '--bg-3': hsl(h, bs, 81),
    '--hover': hsl(h, bs, 76), '--border': hsl(h, bs, 74),
    '--text': hsl(h, 40, 20), '--muted': hsl(h, 25, 38), '--soft': hsl(h, 35, 26),
    '--ink': hsl(h, Math.min(s, 70), 36), '--on-ink': hsl(h, 40, 96), '--primary': hsl(h, Math.min(s, 70), 36),
    '--glass': hsl(h, Math.min(s, 70), 36, 0.7), '--glass-strong': hsl(h, Math.min(s, 70), 36, 0.94),
    '--bar-text': hsl(h, 40, 96), '--bar-active': 'rgba(255, 255, 255, .22)', '--bar-border': 'rgba(255, 255, 255, .38)',
    '--line': hsl(h, Math.min(s, 70), 36, 0.55), '--star': hsl(h, Math.min(s, 70), 36), '--star-empty': hsl(h, Math.min(s, 70), 36, 0.25),
    '--shadow': hsl(h, 40, 20, 0.22),
    '--hero-text': hsl(h, 45, 18), '--hero-glow': hsl(h, bs, 90, 0.9),
    '--hero-btn-bg': hsl(h, bs, 90, 0.6), '--hero-btn-text': hsl(h, 45, 20), '--hero-btn-border': hsl(h, Math.min(s, 70), 36, 0.35),
    'color-scheme': 'light',
  }
}

// src : l'affiche ; fallbackHue : couleur à utiliser si l'œuvre n'a pas d'image (fiches de démo)
export function useImagePalette(src, fallbackHue) {
  useEffect(() => {
    if (!src && fallbackHue === undefined) return
    const root = document.documentElement
    const metas = [...document.querySelectorAll('meta[name="theme-color"]')]
    const original = metas.map((m) => m.content)
    const darkQuery = window.matchMedia('(prefers-color-scheme: dark)')
    let color = null
    let cancelled = false
    let applied = []

    const apply = () => {
      if (!color || cancelled) return
      const palette = paletteFor(color, darkQuery.matches)
      applied = Object.keys(palette)
      for (const [k, v] of Object.entries(palette)) root.style.setProperty(k, v)
      metas.forEach((m) => (m.content = palette['--bg']))
    }

    if (src) {
      // image illisible partout : on garde la DA plutôt qu'une couleur au hasard
      loadReadable(readableSources(src)).then((c) => {
        color = c
        apply()
      })
    } else {
      color = { h: fallbackHue, s: 45 }
      apply()
    }
    darkQuery.addEventListener('change', apply)

    return () => {
      cancelled = true
      darkQuery.removeEventListener('change', apply)
      applied.forEach((k) => root.style.removeProperty(k))
      metas.forEach((m, i) => (m.content = original[i]))
    }
  }, [src, fallbackHue])
}
