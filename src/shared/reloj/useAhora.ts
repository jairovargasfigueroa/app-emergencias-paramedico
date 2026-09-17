import { useEffect, useState } from 'react'

/** Hora actual que se renueva cada `intervaloMs`, para textos como "hace 4 min" que deben avanzar solos. */
export function useAhora(intervaloMs = 15_000) {
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const temporizador = setInterval(() => setAhora(Date.now()), intervaloMs)
    return () => clearInterval(temporizador)
  }, [intervaloMs])
  return ahora
}
