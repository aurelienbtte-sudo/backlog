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

// Teinte dominante : on classe les pixels par teinte (12 familles) en privilégiant les couleurs vives
function dominantColor(img) {
  const canvas = document.createElement('canvas')
  canvas.width = 24
  canvas.height = 36
  const ctx = canvas.getContext('2d', { willReadFrequently: true })
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data // erreur si l'image n'autorise pas la lecture
  const bins = Array.from({ length: 12 }, () => ({ w: 0, h: 0, s: 0 }))
  let grey = 0
  for (let i = 0; i < data.length; i += 4) {
    const [h, s, l] = rgbToHsl(data[i], data[i + 1], data[i + 2])
    const w = (s / 100) * (1 - Math.abs(l - 50) / 50) // vif et ni trop sombre ni trop clair
    if (w < 0.08) {
      grey++
      continue
    }
    const bin = bins[Math.floor(h / 30) % 12]
    bin.w += w
    bin.h += h * w
    bin.s += s * w
  }
  const best = bins.reduce((a, b) => (b.w > a.w ? b : a))
  // image presque en noir et blanc : palette neutre
  if (best.w === 0 || grey > (data.length / 4) * 0.85) return { h: best.w ? best.h / best.w : 30, s: 8 }
  return { h: best.h / best.w, s: Math.min(best.s / best.w, 75) }
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
    let color = null
    let cancelled = false
    let applied = []

    const apply = () => {
      if (!color || cancelled) return
      // les fiches restent en version sombre, même en mode clair : les affiches y rendent mieux
      const palette = paletteFor(color, true)
      applied = Object.keys(palette)
      for (const [k, v] of Object.entries(palette)) root.style.setProperty(k, v)
      metas.forEach((m) => (m.content = palette['--bg']))
    }

    if (src) {
      const img = new Image()
      img.crossOrigin = 'anonymous'
      img.onload = () => {
        try {
          color = dominantColor(img)
        } catch {
          color = fallbackHue === undefined ? null : { h: fallbackHue, s: 45 } // image illisible : on garde la DA
        }
        apply()
      }
      img.onerror = () => {
        if (fallbackHue !== undefined) color = { h: fallbackHue, s: 45 }
        apply()
      }
      // adresse distincte de celle de l'affiche affichée : sinon Safari ressert sa copie en mémoire,
      // chargée sans autorisation de lecture, et les couleurs ne peuvent pas être lues
      img.src = src + (src.includes('?') ? '&' : '?') + 'palette=1'
    } else {
      color = { h: fallbackHue, s: 45 }
      apply()
    }

    return () => {
      cancelled = true
      applied.forEach((k) => root.style.removeProperty(k))
      metas.forEach((m, i) => (m.content = original[i]))
    }
  }, [src, fallbackHue])
}
