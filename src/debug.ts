import { getState } from './store/sceneStore'

/** Live read-only view of the scene for tests: window.__scene */
export function installDebugHook() {
  const s = getState
  Object.defineProperty(window, '__scene', {
    configurable: true,
    value: {
      get elements() { return s().elements },
      get selection() { return s().selection },
      get marquee() { return s().marquee },
      get tool() { return s().tool },
      get zoom() { return s().zoom },
      get spaceHeld() { return s().spaceHeld },
      get scroll() { return { x: s().scrollX, y: s().scrollY } },
    },
  })
}
