// Übersetzungstabelle für Ausstattungskategorien
export const EQUIPMENT_CATEGORY_TRANSLATIONS: Record<string, string> = {
  // Standard-Kategorien aus der Datenbank
  'safety': 'Sicherheit',
  'comfort': 'Komfort',
  'entertainment': 'Entertainment & Medien',
  'connectivity': 'Konnektivität',
  'assistance': 'Assistenzsysteme',
  'exterior': 'Exterieur',
  'interior': 'Interieur',
  'performance': 'Performance',
  'lighting': 'Beleuchtung',
  
  // Mögliche weitere Kategorien
  'climate': 'Klimatisierung',
  'navigation': 'Navigation',
  'audio': 'Audio & Sound',
  'wheels': 'Räder & Reifen',
  'seats': 'Sitze',
  'storage': 'Stauraum',
  'technology': 'Technologie',
  'luxury': 'Luxus',
  'sport': 'Sport',
  'electric': 'Elektrik',
  'other': 'Sonstiges',
  'miscellaneous': 'Sonstiges',
  
  // Fallback für unbekannte Kategorien
  'Sonstiges': 'Sonstiges'
}

// Hilfsfunktion zur Übersetzung
export function translateEquipmentCategory(category: string | null | undefined): string {
  if (!category) return 'Sonstiges'
  
  // Zuerst exakte Übereinstimmung prüfen (case-insensitive)
  const lowerCategory = category.toLowerCase()
  const translation = EQUIPMENT_CATEGORY_TRANSLATIONS[lowerCategory]
  if (translation) return translation
  
  // Wenn bereits auf Deutsch, direkt zurückgeben
  const germanCategories = Object.values(EQUIPMENT_CATEGORY_TRANSLATIONS)
  if (germanCategories.includes(category)) {
    return category
  }
  
  // Fallback: Erste Buchstabe groß, Rest klein
  return category.charAt(0).toUpperCase() + category.slice(1).toLowerCase()
}