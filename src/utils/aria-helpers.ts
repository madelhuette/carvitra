import type { ReactNode } from 'react';

/**
 * ARIA Accessibility Helpers
 * Provides consistent aria-label generation for components without explicit labels
 */

/**
 * Generates an appropriate aria-label for form components
 * 
 * Priority order:
 * 1. Explicit ariaLabel prop
 * 2. Text content from label (if string)
 * 3. Placeholder text
 * 4. Field name as fallback
 * 
 * @param ariaLabel - Explicit aria-label prop
 * @param label - Label content (ReactNode)
 * @param placeholder - Placeholder text
 * @param fieldName - Field name as fallback
 * @returns aria-label string or undefined
 */
export const getAriaLabel = (
  ariaLabel?: string,
  label?: string | ReactNode,
  placeholder?: string,
  fieldName?: string
): string | undefined => {
  // 1. Use explicit aria-label if provided
  if (ariaLabel) return ariaLabel;
  
  // 2. Use label if it's a string
  if (typeof label === 'string' && label.trim()) return label.trim();
  
  // 3. Use placeholder as fallback
  if (placeholder && placeholder.trim()) return placeholder.trim();
  
  // 4. Use field name as last resort
  if (fieldName && fieldName.trim()) return fieldName.trim();
  
  return undefined;
};

/**
 * Extracts text content from ReactNode (for complex labels)
 * @param node - ReactNode to extract text from
 * @returns extracted text or undefined
 */
export const extractTextFromNode = (node: ReactNode): string | undefined => {
  if (typeof node === 'string') return node.trim() || undefined;
  if (typeof node === 'number') return String(node);
  
  // For React elements, we can't easily extract text without rendering
  // This is a limitation - complex labels need explicit aria-label
  return undefined;
};

/**
 * Generates aria-label for vehicle form fields
 * Maps German field names to accessible labels
 */
export const getVehicleFieldAriaLabel = (fieldKey: string): string => {
  const fieldLabels: Record<string, string> = {
    // Vehicle basics
    'make_id': 'Fahrzeugmarke auswählen',
    'model': 'Fahrzeugmodell eingeben',
    'variant': 'Modellvariante eingeben',
    'year': 'Baujahr eingeben',
    
    // Technical specs
    'power_ps': 'Leistung in PS eingeben',
    'power_kw': 'Leistung in Kilowatt eingeben',
    'displacement': 'Hubraum in ccm eingeben',
    'cylinders': 'Zylinderanzahl eingeben',
    'fuel_type_id': 'Kraftstoffart auswählen',
    'transmission_type_id': 'Getriebeart auswählen',
    'fuel_consumption': 'Kraftstoffverbrauch eingeben',
    'co2_emissions': 'CO2-Emissionen eingeben',
    
    // Pricing
    'list_price_gross': 'Listenpreis brutto eingeben',
    'list_price_net': 'Listenpreis netto eingeben',
    'monthly_rate': 'Monatsrate eingeben',
    
    // Vehicle history
    'mileage': 'Kilometerstand eingeben',
    'first_registration': 'Erstzulassung auswählen',
    'owner_count': 'Anzahl Vorbesitzer eingeben',
    
    // Equipment
    'exterior_color': 'Außenfarbe eingeben',
    'interior_color': 'Innenraumfarbe eingeben',
    'interior_material': 'Innenraummaterial eingeben',
    'door_count': 'Anzahl Türen eingeben',
    'seat_count': 'Anzahl Sitzplätze eingeben',
    
    // Marketing
    'seo_title': 'SEO-Titel eingeben',
    'seo_description': 'SEO-Beschreibung eingeben',
    'marketing_headline': 'Marketing-Headline eingeben',
    'marketing_description': 'Marketing-Beschreibung eingeben',
    'slug': 'URL-Pfad eingeben',
  };
  
  return fieldLabels[fieldKey] || `${fieldKey} eingeben`;
};

/**
 * Generates aria-label for checkbox/boolean fields
 */
export const getBooleanFieldAriaLabel = (fieldKey: string, isChecked?: boolean): string => {
  const baseLabels: Record<string, string> = {
    'accident_free': 'Unfallfrei',
    'financing_available': 'Finanzierung verfügbar',
    'warranty_extension': 'Garantieverlängerung',
    'maintenance_included': 'Wartung inklusive',
    'insurance_included': 'Versicherung inklusive',
  };
  
  const baseLabel = baseLabels[fieldKey] || fieldKey;
  return `${baseLabel} ${isChecked ? 'aktiviert' : 'deaktiviert'}`;
};

/**
 * Common aria-labels for repeated UI elements
 */
export const CommonAriaLabels = {
  close: 'Schließen',
  open: 'Öffnen',
  search: 'Suchen',
  save: 'Speichern',
  cancel: 'Abbrechen',
  next: 'Weiter',
  previous: 'Zurück',
  submit: 'Absenden',
  loading: 'Wird geladen',
  options: 'Optionen',
  menu: 'Menü',
  dropdown: 'Dropdown-Menü',
  checkbox: 'Kontrollkästchen',
  required: 'Pflichtfeld',
} as const;