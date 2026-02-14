import { Component, type ErrorInfo, type ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen items-center justify-center bg-[#f8fafc] p-6">
          <div className="w-full max-w-md rounded-lg border-2 border-[#0F172A] bg-white p-8 text-center">
            <AlertTriangle className="mx-auto h-12 w-12 text-[#F59E0B]" />
            <h1 className="mt-4 text-lg font-semibold text-[#0F172A]">
              Bir hata oluştu
            </h1>
            <p className="mt-2 text-sm text-[#64748B]">
              Beklenmeyen bir hata oluştu. Lütfen sayfayı yeniden yükleyip tekrar deneyin.
            </p>
            <button
              onClick={this.handleReload}
              className="mt-6 inline-flex items-center justify-center rounded-md border-2 border-[#0F172A] bg-[#2563EB] px-4 py-2 text-sm font-medium text-white hover:bg-[#1d4ed8] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563EB] focus-visible:ring-offset-2"
            >
              Sayfayı Yenile
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
