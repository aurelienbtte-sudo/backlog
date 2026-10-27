import { useState } from 'react'
import { TYPES } from '../types.js'

// Affiche la jaquette, ou une jaquette générée (couleur + titre) si l'image manque
export default function Cover({ item, size = 'md' }) {
  const [broken, setBroken] = useState(false)
  const square = item.type === 'album'
  const cls = `cover cover-${size} ${square ? 'square' : ''}`

  if (item.cover && !broken) {
    return <img className={cls} src={item.cover} alt={item.title} loading="lazy" onError={() => setBroken(true)} />
  }
  const hue = [...item.title].reduce((h, c) => (h * 31 + c.charCodeAt(0)) % 360, 7)
  return (
    <div className={`${cls} placeholder`} style={{ '--hue': hue }} role="img" aria-label={item.title}>
      <span className="ph-icon">{TYPES[item.type].icon}</span>
      <span className="ph-title">{item.title}</span>
    </div>
  )
}
