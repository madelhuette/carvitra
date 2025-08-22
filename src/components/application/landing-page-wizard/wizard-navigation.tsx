'use client'

import { Button } from '@/components/base/buttons/button'
import { ProgressBar } from '@/components/base/progress-indicators/progress-indicators'
import { Tabs } from '@/components/application/tabs/tabs'
import { ArrowLeft, ArrowRight, CheckCircle } from '@untitledui/icons'
import { useWizardContext } from './wizard-context'

export function WizardNavigation() {
  const { currentStep, steps, goToStep, goNext, goPrevious, isSaving } = useWizardContext()
  
  // Berechne Fortschritt mit Mindestfortschritt für Schritt 1
  const progressValue = currentStep === 1 
    ? 14 // Mindestfortschritt für Schritt 1 (etwa 1/7)
    : ((currentStep - 1) / (steps.length - 1)) * 100

  return (
    <div className="space-y-6">
      {/* Progress Bar */}
      <div className="px-6">
        <ProgressBar 
          value={progressValue}
          max={100}
          labelPosition="right"
          valueFormatter={(value) => `Schritt ${currentStep} von ${steps.length}`}
          className="w-full"
        />
      </div>

      {/* Tab Navigation */}
      <div className="px-6 overflow-x-auto">
        <Tabs selectedKey={`step-${currentStep}`}>
          <Tabs.List type="button-gray" size="sm">
            {steps.map((step) => (
              <Tabs.Item
                key={`step-${step.id}`}
                id={`step-${step.id}`}
                onClick={() => goToStep(step.id)}
                className="flex items-center gap-2"
              >
                {step.completed && (
                  <CheckCircle className="h-4 w-4 text-success-600" />
                )}
                <span className={step.current ? 'font-semibold' : ''}>
                  {step.label}
                </span>
              </Tabs.Item>
            ))}
          </Tabs.List>
        </Tabs>
      </div>

      {/* Status indicator */}
      {isSaving && (
        <div className="px-6">
          <div className="text-sm text-secondary flex items-center gap-2">
            <div className="h-2 w-2 bg-brand rounded-full animate-pulse" />
            Automatisch gespeichert
          </div>
        </div>
      )}
    </div>
  )
}

export function WizardFooter() {
  const { currentStep, steps, goNext, goPrevious, saveProgress, publishLandingPage, isSaving } = useWizardContext()
  
  const isFirstStep = currentStep === 1
  const isLastStep = currentStep === steps.length

  return (
    <div className="flex items-center justify-between gap-3 px-6 py-4">
      <Button
        variant="secondary"
        size="lg"
        iconLeading={ArrowLeft}
        onClick={goPrevious}
        disabled={isFirstStep || isSaving}
      >
        Zurück
      </Button>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          size="lg"
          onClick={saveProgress}
          loading={isSaving}
        >
          Speichern
        </Button>
        
        {isLastStep ? (
          <Button
            variant="primary"
            size="lg"
            onClick={async () => {
              const success = await publishLandingPage()
              if (success) {
                // Close wizard on success
                window.location.href = '/dashboard/landingpages'
              }
            }}
            loading={isSaving}
          >
            Landing Page veröffentlichen
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            iconTrailing={ArrowRight}
            onClick={goNext}
            disabled={isSaving}
          >
            Weiter
          </Button>
        )}
      </div>
    </div>
  )
}