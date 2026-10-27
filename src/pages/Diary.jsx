import { useState } from 'react'
import { useStore, removeLog, sortedDiary } from '../store.js'
import DiaryRow from '../components/DiaryRow.jsx'
import TypeTabs from '../components/TypeTabs.jsx'

const monthLabel = (d) => new Date(d + 'T12:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })

export default function Diary() {
  const diary = useStore((s) => s.diary)
  const [type, setType] = useState('all')
  const logs = sortedDiary(diary).filter((l) => type === 'all' || l.item.type === type)

  // Regroupement par mois
  const groups = []
  for (const log of logs) {
    const key = log.date.slice(0, 7)
    if (groups.at(-1)?.key !== key) groups.push({ key, label: monthLabel(log.date), logs: [] })
    groups.at(-1).logs.push(log)
  }

  return (
    <>
      <h1>Journal</h1>
      <TypeTabs value={type} onChange={setType} withAll />
      {!logs.length && <p className="muted">Ton journal est vide. Ouvre une fiche et clique sur « Ajouter au journal ».</p>}
      {groups.map((g) => (
        <section key={g.key}>
          <h2 className="month">{g.label}</h2>
          <div className="diary">{g.logs.map((l) => <DiaryRow key={l.id} log={l} onDelete={removeLog} />)}</div>
        </section>
      ))}
    </>
  )
}
