export interface Landingpage {
  id: string
  offer_id: string
  slug: string
  template_type: 'modern' | 'classic' | 'minimal'
  customization: LandingpageCustomization
  seo_metadata: SeoMetadata
  published: boolean
  published_at?: string
  view_count: number
  last_viewed_at?: string
  created_at: string
  updated_at: string
}

export interface LandingpageCustomization {
  primaryColor?: string
  secondaryColor?: string
  fontFamily?: string
  logoUrl?: string
  showFinancing?: boolean
  showEquipment?: boolean
  showGallery?: boolean
  showContactForm?: boolean
  ctaButtonText?: string
  customCss?: string
  heroLayout?: 'split' | 'centered' | 'full-width'
  galleryLayout?: 'grid' | 'carousel' | 'masonry'
}

export interface SeoMetadata {
  title?: string
  description?: string
  keywords?: string[]
  ogImage?: string
  ogTitle?: string
  ogDescription?: string
  canonical?: string
  robots?: string
  structuredData?: any
}

export interface Lead {
  id: string
  landingpage_id: string
  offer_id: string
  first_name: string
  last_name: string
  email: string
  phone?: string
  message?: string
  financing_interest?: boolean
  preferred_contact_method?: 'email' | 'phone' | 'whatsapp'
  metadata?: {
    source?: string
    campaign?: string
    referrer?: string
    ip_address?: string
    user_agent?: string
  }
  created_at: string
}

export interface LandingpageStats {
  total_views: number
  unique_visitors: number
  total_leads: number
  conversion_rate: number
  avg_time_on_page: number
  bounce_rate: number
  traffic_sources: {
    source: string
    count: number
    percentage: number
  }[]
  daily_stats: {
    date: string
    views: number
    leads: number
  }[]
}