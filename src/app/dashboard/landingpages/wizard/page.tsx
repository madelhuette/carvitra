'use client'

import { WizardProvider } from '@/components/application/landing-page-wizard/wizard-context'
import { WizardContainer } from '@/components/application/landing-page-wizard/wizard-container'
import { useRouter, useSearchParams } from 'next/navigation'
import { useEffect } from 'react'

export default function WizardPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const offerId = searchParams.get('offerId')
  
  const handleClose = () => {
    router.push('/dashboard/landingpages')
  }

  // Pass the offerId to the WizardProvider
  return (
    <WizardProvider initialOfferId={offerId}>
      <WizardContainer isOpen={true} onClose={handleClose} />
    </WizardProvider>
  )
}