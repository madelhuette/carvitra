'use client'

import { SlideoutMenu } from '@/components/application/slideout-menus/slideout-menu'
import { WizardNavigation, WizardFooter } from './wizard-navigation'
import { useWizardContext } from './wizard-context'
import { AnalysisStatus } from './analysis-status'

// Import all steps
import { StepVehicleBasics } from './steps/step-vehicle-basics'
import { StepTechnicalDetails } from './steps/step-technical-details'
import { StepEquipment } from './steps/step-equipment'
import { StepAvailability } from './steps/step-availability'
import { StepFinancing } from './steps/step-financing'
import { StepContact } from './steps/step-contact'
import { StepMarketing } from './steps/step-marketing'

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
    switch (currentStep) {
      case 1:
        return <StepVehicleBasics />
      case 2:
        return <StepTechnicalDetails />
      case 3:
        return <StepEquipment />
      case 4:
        return <StepAvailability />
      case 5:
        return <StepFinancing />
      case 6:
        return <StepContact />
      case 7:
        return <StepMarketing />
      default:
        return <StepVehicleBasics />
    }
  }

  const currentStepData = steps.find(s => s.id === currentStep)

  return (
    <>
      {/* Analysis Status Banner - außerhalb des SlideoutMenu für bessere Positionierung */}
      <AnalysisStatus 
        isAnalyzing={isAnalyzing}
        fieldsIdentified={analysisResults?.fieldsIdentified || null}
      />
      
      <SlideoutMenu isOpen={isOpen} aria-label="Landingpage-Assistent">
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