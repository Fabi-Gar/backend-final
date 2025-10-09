// src/modules/firms/firms.config.ts
export function buildFirmsUrls(): string[] {
  const base = 'https://firms.modaps.eosdis.nasa.gov/api/area/csv'
  const days = Number(process.env.FIRMS_DAYS || 3)
  const bbox = process.env.FIRMS_BBOX_GTM
  const country = process.env.FIRMS_COUNTRY || 'GTM'

  const products = (process.env.FIRMS_PRODUCTS || 'VIIRS_SNPP_NRT')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)

  return products.map(p =>
    bbox
      ? `${base}?source=${encodeURIComponent(p)}&bbox=${bbox}&days=${days}`
      : `${base}?source=${encodeURIComponent(p)}&country=${country}&days=${days}`
  )
}
