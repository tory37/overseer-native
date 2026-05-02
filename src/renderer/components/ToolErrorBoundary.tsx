import React from 'react'

interface Props {
  toolName: string
  children: React.ReactNode
}

interface State {
  hasError: boolean
  errorMessage: string
}

export class ToolErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false, errorMessage: '' }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, errorMessage: error.message || '' }
  }

  componentDidCatch(error: Error) {
    console.error(`[ToolErrorBoundary] ${this.props.toolName} threw:`, error)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          padding: '12px',
          margin: '8px',
          background: 'var(--bg-main)',
          border: '1px solid #f44747',
          borderRadius: '4px',
          color: '#f44747',
          fontFamily: 'monospace',
          fontSize: '12px',
        }}>
          <div style={{ fontWeight: 600, marginBottom: '4px' }}>
            {this.props.toolName} failed to load
          </div>
          {this.state.errorMessage && (
            <div style={{ opacity: 0.8 }}>{this.state.errorMessage}</div>
          )}
        </div>
      )
    }
    return this.props.children
  }
}
