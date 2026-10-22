import { Component, type ReactNode } from 'react'

interface Props {
  onError: () => void
  children: ReactNode
}

/** Catches render errors from the 3D layer so the page can switch to its static fallback. */
export class WebGLBoundary extends Component<Props, { failed: boolean }> {
  state = { failed: false }

  static getDerivedStateFromError() {
    return { failed: true }
  }

  componentDidCatch() {
    this.props.onError()
  }

  render() {
    return this.state.failed ? null : this.props.children
  }
}
