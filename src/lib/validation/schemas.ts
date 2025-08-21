import { z } from 'zod'

// Common schemas
export const uuidSchema = z.string().uuid('Invalid UUID format')

export const paginationSchema = z.object({
  page: z.number().int().positive().default(1),
  limit: z.number().int().positive().max(100).default(20)
})

// PDF Document schemas
export const pdfUploadSchema = z.object({
  file_name: z.string().min(1, 'File name is required'),
  file_size: z.number().positive('File size must be positive'),
  file_url: z.string().url('Invalid file URL'),
  organization_id: uuidSchema.optional()
})

export const pdfExtractSchema = z.object({
  pdf_document_id: uuidSchema
})

export const pdfDeleteSchema = z.object({
  id: uuidSchema
})

// Wizard/Offer schemas
export const vehicleBasicsSchema = z.object({
  make: z.string().min(1, 'Marke ist erforderlich'),
  model: z.string().min(1, 'Modell ist erforderlich'),
  variant: z.string().optional(),
  year: z.number().int().min(1990).max(new Date().getFullYear() + 1),
  mileage: z.number().int().min(0).max(500000).optional(),
  first_registration: z.string().optional()
})

export const technicalDetailsSchema = z.object({
  fuel_type: z.string().optional(),
  transmission: z.string().optional(),
  power_kw: z.number().positive().optional(),
  power_ps: z.number().positive().optional(),
  engine_size: z.number().positive().optional(),
  cylinders: z.number().int().positive().max(16).optional(),
  drive_type: z.string().optional(),
  consumption_combined: z.number().positive().max(50).optional(),
  consumption_city: z.number().positive().max(50).optional(),
  consumption_highway: z.number().positive().max(50).optional(),
  co2_emissions: z.number().min(0).max(500).optional(),
  emission_class: z.string().optional()
})

export const equipmentSchema = z.object({
  exterior_color: z.string().optional(),
  interior_color: z.string().optional(),
  upholstery: z.string().optional(),
  doors: z.number().int().min(2).max(5).optional(),
  seats: z.number().int().min(1).max(9).optional(),
  equipment_ids: z.array(uuidSchema).optional()
})

export const availabilitySchema = z.object({
  price: z.number().positive('Preis muss positiv sein').optional(),
  price_gross: z.number().positive().optional(),
  vat_rate: z.number().min(0).max(100).default(19),
  availability_type: z.string().optional(),
  delivery_date: z.string().optional(),
  location: z.string().optional()
})

export const financingSchema = z.object({
  offer_type: z.enum(['leasing', 'financing', 'cash']),
  monthly_rate: z.number().positive().optional(),
  duration_months: z.number().int().min(6).max(96).optional(),
  annual_mileage: z.number().int().min(5000).max(100000).optional(),
  down_payment: z.number().min(0).optional(),
  final_payment: z.number().min(0).optional(),
  interest_rate: z.number().min(0).max(30).optional(),
  total_cost: z.number().positive().optional()
})

export const contactSchema = z.object({
  sales_person_id: uuidSchema.optional(),
  dealer_id: uuidSchema.optional(),
  contact_email: z.string().email().optional(),
  contact_phone: z.string().optional()
})

export const marketingSchema = z.object({
  title: z.string().min(1, 'Titel ist erforderlich').max(100),
  description: z.string().optional(),
  slug: z.string()
    .min(1, 'URL-Slug ist erforderlich')
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug darf nur Kleinbuchstaben, Zahlen und Bindestriche enthalten'),
  meta_title: z.string().max(60).optional(),
  meta_description: z.string().max(160).optional(),
  marketing_text: z.string().optional()
})

// Combined offer schema
export const offerWizardSchema = z.object({
  vehicle: vehicleBasicsSchema,
  technical: technicalDetailsSchema,
  equipment: equipmentSchema,
  availability: availabilitySchema,
  financing: financingSchema,
  contact: contactSchema,
  marketing: marketingSchema,
  pdf_document_id: uuidSchema.optional(),
  status: z.enum(['draft', 'active', 'sold', 'reserved', 'archived']).default('draft')
})

// Wizard autofill schema
export const wizardAutofillSchema = z.object({
  step: z.number().int().min(1).max(7),
  currentData: z.record(z.any()),
  extractedData: z.record(z.any()).optional(),
  confidence: z.number().min(0).max(100).optional()
})

// Type exports
export type PdfUpload = z.infer<typeof pdfUploadSchema>
export type PdfExtract = z.infer<typeof pdfExtractSchema>
export type VehicleBasics = z.infer<typeof vehicleBasicsSchema>
export type TechnicalDetails = z.infer<typeof technicalDetailsSchema>
export type Equipment = z.infer<typeof equipmentSchema>
export type Availability = z.infer<typeof availabilitySchema>
export type Financing = z.infer<typeof financingSchema>
export type Contact = z.infer<typeof contactSchema>
export type Marketing = z.infer<typeof marketingSchema>
export type OfferWizard = z.infer<typeof offerWizardSchema>
export type WizardAutofill = z.infer<typeof wizardAutofillSchema>