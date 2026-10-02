/** "0:42", "3:05": posición dentro de un audio o un video. */
export function minutosYSegundos(segundos: number): string {
  const total = Math.max(0, Math.floor(Number.isFinite(segundos) ? segundos : 0))
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`
}
