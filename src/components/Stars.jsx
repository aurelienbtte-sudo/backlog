// Note de 0,5 à 5 étoiles (stockée de 1 à 10 en interne)
export function StarRating({ value, onChange }) {
  return (
    <div className="stars-input" role="radiogroup" aria-label="Note">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className="star-slot">
          {[n * 2 - 1, n * 2].map((v) => (
            <button
              key={v}
              type="button"
              className={`half ${v % 2 ? 'left' : 'right'} ${value >= v ? 'on' : ''}`}
              aria-label={`${v / 2} étoile${v > 2 ? 's' : ''}`}
              title={`${v / 2} ★`}
              onClick={() => onChange(value === v ? 0 : v)}
            />
          ))}
        </span>
      ))}
    </div>
  )
}

export function Stars({ value }) {
  if (!value) return null
  return (
    <span className="stars" aria-label={`${value / 2} sur 5`}>
      {'★'.repeat(Math.floor(value / 2))}
      {value % 2 ? '½' : ''}
    </span>
  )
}
