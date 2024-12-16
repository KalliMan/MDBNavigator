export function remFromPx(px: number | string, base = 16): number {
  const tempPx = `${px}`.replace('px', '')

  return (1 / base) * parseInt(tempPx)
}
