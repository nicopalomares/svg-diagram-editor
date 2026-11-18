import { useEffect } from 'react'
import { deleteSelection } from '../store/actions'
import { redo, undo } from '../store/history'
import { setState } from '../store/sceneStore'

export function useKeyboard() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        e.preventDefault()
        setState({ spaceHeld: true })
        return
      }
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault()
        if (e.shiftKey) redo()
        else undo()
        return
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault()
        deleteSelection()
      }
    }
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') setState({ spaceHeld: false })
    }
    const onBlur = () => setState({ spaceHeld: false })
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    window.addEventListener('blur', onBlur)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
      window.removeEventListener('blur', onBlur)
    }
  }, [])
}
