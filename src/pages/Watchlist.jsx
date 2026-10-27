import { useState } from 'react'
import { useStore } from '../store.js'
import { Grid } from '../components/MediaCard.jsx'
import TypeTabs from '../components/TypeTabs.jsx'

export default function Watchlist() {
  const entries = useStore((s) => s.entries)
  const [type, setType] = useState('all')
  const items = Object.values(entries)
    .filter((e) => e.wishlist && (type === 'all' || e.item.type === type))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .map((e) => e.item)

  return (
    <>
      <h1>À découvrir</h1>
      <TypeTabs value={type} onChange={setType} withAll />
      <Grid items={items} empty="Ta liste est vide. Clique sur ⏳ sur une fiche pour l'ajouter ici." />
    </>
  )
}
