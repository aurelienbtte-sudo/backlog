import { useEffect, useState } from 'react'

// Bouton à double clic : le premier demande confirmation, le second agit.
// (Remplace confirm(), qui est bloqué dans certains environnements.)
export default function ConfirmButton({ onConfirm, confirmLabel = 'Confirmer ?', className = '', children, ...props }) {
  const [armed, setArmed] = useState(false)

  useEffect(() => {
    if (!armed) return
    const t = setTimeout(() => setArmed(false), 3000)
    return () => clearTimeout(t)
  }, [armed])

  const click = () => {
    if (!armed) return setArmed(true)
    setArmed(false)
    onConfirm()
  }

  return (
    <button type="button" className={`${className} ${armed ? 'armed' : ''}`} onClick={click} {...props}>
      {armed ? confirmLabel : children}
    </button>
  )
}
