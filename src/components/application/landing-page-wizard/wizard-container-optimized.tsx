'use client'

import { lazy, Suspense } from 'react'
import { SlideoutMenu } from '@/components/application/slideout-menus/slideout-menu'
import { WizardNavigation, WizardFooter } from './wizard-navigation'
import { useWizardContext } from './wizard-context'
import { AnalysisStatus } from './analysis-status'
import { LoadingIndicator } from '@/components/application/loading-indicator/loading-indicator'

// Lazy load all wizard steps for better performance
const StepVehicleBasics = lazy(() => 
  import('./steps/step-vehicle-basics').then(m => ({ default: m.StepVehicleBasics }))
)
const StepTechnicalDetails = lazy(() => 
  import('./steps/step-technical-details').then(m => ({ default: m.StepTechnicalDetails }))
)
const StepEquipment = lazy(() => 
  import('./steps/step-equipment').then(m => ({ default: m.StepEquipment }))
)
const StepAvailability = lazy(() => 
  import('./steps/step-availability').then(m => ({ default: m.StepAvailability }))
)
const StepFinancing = lazy(() => 
  import('./steps/step-financing').then(m => ({ default: m.StepFinancing }))
)
const StepContact = lazy(() => 
  import('./steps/step-contact').then(m => ({ default: m.StepContact }))
)
const StepMarketing = lazy(() => 
  import('./steps/step-marketing').then(m => ({ default: m.StepMarketing }))
)

// Step loading component
const StepLoader = () => (
  <div className="flex items-center justify-center py-8">
    <LoadingIndicator />
  </div>
)

interface WizardContainerProps {
  isOpen: boolean
  onClose: () => void
}

export function WizardContainer({ isOpen, onClose }: WizardContainerProps) {
  const { currentStep, steps, isSaving, isAnalyzing, analysisResults } = useWizardContext()

  const handleClose = () => {
    if (isSaving) return
    
    // TODO: Add confirmation dialog if there are unsaved changes
    onClose()
  }

  const renderCurrentStep = () => {
    const StepComponent = (() => {
      switch (currentStep) {
        case 1:
          return StepVehicleBasics
        case 2:
          return StepTechnicalDetails
        case 3:
          return StepEquipment
        case 4:
          return StepAvailability
        case 5:
          return StepFinancing
        case 6:
          return StepContact
        case 7:
          return StepMarketing
        default:
          return StepVehicleBasics
      }
    })()

    return (
      <Suspense fallback={<StepLoader />}>
        <StepComponent />
      </Suspense>
    )
  }

  const currentStepData = steps.find(s => s.id === currentStep)

  return (
    <>
      {/* Analysis Status Banner - außerhalb des SlideoutMenu für bessere Positionierung */}
      <AnalysisStatus 
        isAnalyzing={isAnalyzing}
        fieldsIdentified={analysisResults?.fieldsIdentified || null}
      />
      
      <SlideoutMenu isOpen={isOpen}>
        <SlideoutMenu.Header onClose={handleClose}>
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-display-sm font-semibold text-primary">
                Landing Page konfigurieren
              </h2>
              {currentStepData && (
                <p className="mt-1 text-sm text-secondary">
                  {currentStepData.description}
                </p>
              )}
            </div>
          </div>
        </SlideoutMenu.Header>

        <div className="py-4">
          <WizardNavigation />
        </div>

        <SlideoutMenu.Content>
          <div className="px-6 py-4">
            {renderCurrentStep()}
          </div>
        </SlideoutMenu.Content>

        <SlideoutMenu.Footer>
          <WizardFooter />
        </SlideoutMenu.Footer>
      </SlideoutMenu>
    </>
  )
}