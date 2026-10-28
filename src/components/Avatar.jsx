import { useRef, useState } from 'react'
import { useStore, setSetting } from '../store.js'

// Réduit la photo choisie à un carré de 256 px (recadré au centre) pour qu'elle reste légère
function resizePhoto(file, size = 256) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      const side = Math.min(img.naturalWidth, img.naturalHeight)
      const canvas = document.createElement('canvas')
      canvas.width = canvas.height = size
      canvas
        .getContext('2d')
        .drawImage(img, (img.naturalWidth - side) / 2, (img.naturalHeight - side) / 2, side, side, 0, 0, size, size)
      URL.revokeObjectURL(url)
      resolve(canvas.toDataURL('image/jpeg', 0.85))
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error("Cette image n'a pas pu être ouverte. Essaie avec une autre photo."))
    }
    img.src = url
  })
}

// Photo de profil (ou initiale du pseudo). Avec `editable`, un appui ouvre la galerie pour la changer.
export default function Avatar({ editable = false, size = 72 }) {
  const { name, avatar } = useStore((s) => s.settings)
  const inputRef = useRef(null)
  const [error, setError] = useState(null)

  const pick = async (e) => {
    const file = e.target.files[0]
    e.target.value = ''
    if (!file) return
    try {
      setSetting('avatar', await resizePhoto(file))
      setError(null)
    } catch (err) {
      setError(err.message)
    }
  }

  const content = avatar ? <img src={avatar} alt="Photo de profil" /> : <span>{(name || '?')[0].toUpperCase()}</span>

  if (!editable) return <div className="avatar" style={{ '--size': `${size}px` }}>{content}</div>

  return (
    <div className="avatar-edit">
      <button type="button" className="avatar" style={{ '--size': `${size}px` }} onClick={() => inputRef.current.click()} aria-label="Changer la photo de profil">
        {content}
        <span className="avatar-badge" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="14" height="14">
            <path fill="currentColor" d="M9 4 7.2 6H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-3.2L15 4H9Zm3 4.5a4.5 4.5 0 1 1 0 9 4.5 4.5 0 0 1 0-9Zm0 2a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5Z" />
          </svg>
        </span>
      </button>
      <input ref={inputRef} type="file" accept="image/*" hidden onChange={pick} />
      {error && <p className="small error">{error}</p>}
    </div>
  )
}
