import { Canvas } from './svg/Canvas'
import { useKeyboard } from './hooks/useKeyboard'
import { Logo } from './ui/Logo'
import { FileMenu } from './ui/FileMenu'
import { Toolbar } from './ui/Toolbar'
import { ZoomIndicator } from './ui/ZoomIndicator'

export function App() {
  useKeyboard()
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      <Canvas />
      <Logo />
      <Toolbar />
      <FileMenu />
      <ZoomIndicator />
    </div>
  )
}
