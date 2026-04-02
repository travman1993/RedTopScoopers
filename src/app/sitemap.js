export default function sitemap() {
  const base = 'https://redtopscoopers.com';
  return [
    { url: base,            lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/#pricing`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/#quote`,   lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
  ];
}
