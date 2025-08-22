'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { Button } from '@/components/base/buttons/button'
import { AlertTriangle, RefreshCcw05 } from '@untitledui/icons'
import { createLogger } from '@/lib/logger'

const logger = createLogger('ErrorBoundary')

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, error: null, errorInfo: null }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to monitoring service
    logger.error('React Error Boundary caught an error', {
      error: error.toString(),
      errorStack: error.stack,
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })

    this.setState({
      error,
      errorInfo
    })
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null })
    // Optionally reload the page
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return <>{this.props.fallback}</>
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6">
              <div className="flex items-center justify-center w-12 h-12 mx-auto bg-error-subtle rounded-full mb-4">
                <AlertTriangle className="w-6 h-6 text-error" />
              </div>
              
              <h1 className="text-display-xs font-semibold text-center text-primary mb-2">
                Etwas ist schiefgelaufen
              </h1>
              
              <p className="text-sm text-secondary text-center mb-6">
                Ein unerwarteter Fehler ist aufgetreten. Bitte versuchen Sie es erneut oder kontaktieren Sie den Support, wenn das Problem weiterhin besteht.
              </p>

              {/* Show error details in development */}
              {process.env.NODE_ENV === 'development' && this.state.error && (
                <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                  <p className="text-xs font-mono text-error mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.error.stack && (
                    <details className="text-xs">
                      <summary className="cursor-pointer text-secondary hover:text-primary">
                        Stack Trace
                      </summary>
                      <pre className="mt-2 overflow-auto text-tertiary">
                        {this.state.error.stack}
                      </pre>
                    </details>
                  )}
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  color="secondary"
                  className="flex-1"
                  onClick={() => window.history.back()}
                >
                  Zurück
                </Button>
                <Button
                  color="primary"
                  className="flex-1"
                  iconLeading={RefreshCcw05}
                  onClick={this.handleReset}
                >
                  Neu laden
                </Button>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Async Error Boundary for Suspense
export function AsyncErrorBoundary({ children }: { children: ReactNode }) {
  return (
    <ErrorBoundary>
      <React.Suspense
        fallback={
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-sm text-secondary">Laden...</p>
            </div>
          </div>
        }
      >
        {children}
      </React.Suspense>
    </ErrorBoundary>
  )
}