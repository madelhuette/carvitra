import { create } from 'zustand'
import { devtools, persist } from 'zustand/middleware'
import { createLogger } from '@/lib/logger'

const logger = createLogger('AppStore')

// User profile state
interface UserProfile {
  id: string
  email: string
  first_name?: string
  last_name?: string
  organization_id?: string
  role?: string
}

// App-wide notification state
interface Notification {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
}

// Global loading states
interface LoadingState {
  isLoading: boolean
  loadingMessage?: string
}

// App Store Interface
interface AppStore {
  // User state
  user: UserProfile | null
  setUser: (user: UserProfile | null) => void
  
  // Organization state
  organization: any | null
  setOrganization: (org: any) => void
  
  // Notifications
  notifications: Notification[]
  addNotification: (notification: Omit<Notification, 'id'>) => void
  removeNotification: (id: string) => void
  clearNotifications: () => void
  
  // Global loading
  globalLoading: LoadingState
  setGlobalLoading: (loading: boolean, message?: string) => void
  
  // PDF Processing state
  processingPdfs: Set<string>
  addProcessingPdf: (id: string) => void
  removeProcessingPdf: (id: string) => void
  isProcessingPdf: (id: string) => boolean
  
  // Wizard state cache
  wizardCache: Record<string, any>
  setWizardCache: (offerId: string, data: any) => void
  getWizardCache: (offerId: string) => any | null
  clearWizardCache: (offerId: string) => void
  
  // Error state
  lastError: Error | null
  setError: (error: Error | null) => void
  
  // Reset store
  reset: () => void
}

// Create the store
export const useAppStore = create<AppStore>()(
  devtools(
    persist(
      (set, get) => ({
        // User state
        user: null,
        setUser: (user) => {
          logger.debug('Setting user', { userId: user?.id })
          set({ user })
        },
        
        // Organization state
        organization: null,
        setOrganization: (organization) => {
          logger.debug('Setting organization', { orgId: organization?.id })
          set({ organization })
        },
        
        // Notifications
        notifications: [],
        addNotification: (notification) => {
          const id = Date.now().toString()
          const newNotification = { ...notification, id }
          
          logger.info('Adding notification', newNotification)
          
          set((state) => ({
            notifications: [...state.notifications, newNotification]
          }))
          
          // Auto-remove after duration
          if (notification.duration !== 0) {
            setTimeout(() => {
              get().removeNotification(id)
            }, notification.duration || 5000)
          }
        },
        removeNotification: (id) => {
          set((state) => ({
            notifications: state.notifications.filter(n => n.id !== id)
          }))
        },
        clearNotifications: () => {
          set({ notifications: [] })
        },
        
        // Global loading
        globalLoading: { isLoading: false },
        setGlobalLoading: (isLoading, loadingMessage) => {
          set({ globalLoading: { isLoading, loadingMessage } })
        },
        
        // PDF Processing
        processingPdfs: new Set(),
        addProcessingPdf: (id) => {
          set((state) => ({
            processingPdfs: new Set(state.processingPdfs).add(id)
          }))
        },
        removeProcessingPdf: (id) => {
          set((state) => {
            const newSet = new Set(state.processingPdfs)
            newSet.delete(id)
            return { processingPdfs: newSet }
          })
        },
        isProcessingPdf: (id) => {
          return get().processingPdfs.has(id)
        },
        
        // Wizard cache
        wizardCache: {},
        setWizardCache: (offerId, data) => {
          set((state) => ({
            wizardCache: { ...state.wizardCache, [offerId]: data }
          }))
        },
        getWizardCache: (offerId) => {
          return get().wizardCache[offerId] || null
        },
        clearWizardCache: (offerId) => {
          set((state) => {
            const { [offerId]: _, ...rest } = state.wizardCache
            return { wizardCache: rest }
          })
        },
        
        // Error state
        lastError: null,
        setError: (error) => {
          if (error) {
            logger.error('Global error set', error)
          }
          set({ lastError: error })
        },
        
        // Reset
        reset: () => {
          logger.info('Resetting app store')
          set({
            user: null,
            organization: null,
            notifications: [],
            globalLoading: { isLoading: false },
            processingPdfs: new Set(),
            wizardCache: {},
            lastError: null
          })
        }
      }),
      {
        name: 'carvitra-app-store',
        // Only persist certain fields
        partialize: (state) => ({
          user: state.user,
          organization: state.organization,
          wizardCache: state.wizardCache
        })
      }
    ),
    {
      name: 'CarvitaAppStore'
    }
  )
)

// Hooks for common selectors
export const useUser = () => useAppStore(state => state.user)
export const useNotifications = () => useAppStore(state => state.notifications)
export const useGlobalLoading = () => useAppStore(state => state.globalLoading)
export const useProcessingPdfs = () => useAppStore(state => state.processingPdfs)