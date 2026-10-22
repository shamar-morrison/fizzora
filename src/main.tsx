import '@fontsource-variable/inter'
import '@fontsource-variable/unbounded'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import './index.css'
import { detectDevice } from './lib/device'
import { useAppStore } from './store/useAppStore'

const device = detectDevice()
useAppStore.setState({
  tier: device.tier,
  tierCeiling: device.ceiling,
  isSmallScreen: device.isSmallScreen,
  reducedMotion: device.reducedMotion,
  webgl: device.webglSupported ? 'pending' : 'failed',
})

const root = document.getElementById('root')
if (!root) throw new Error('Missing #root element')

createRoot(root).render(
  <StrictMode>
    <App webglSupported={device.webglSupported} tierLocked={device.tierLocked} />
  </StrictMode>,
)
