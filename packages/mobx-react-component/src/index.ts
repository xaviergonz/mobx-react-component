import { configure } from "mobx"
import { unstable_batchedUpdates } from "./shared/reactBatchedUpdates"

export * from "./class/mobxComponent"
export * from "./class/ReactContextValue"
export * from "./hooks/mobxObserver"
export * from "./hooks/useMobxLocalState"
export * from "./shared/MobxEffects"
export type { ToObservableMode, ToObservableModeWithoutRef } from "./shared/observableWrapper"
export * from "./shared/ObserverComponent"
export { getOriginalProps } from "./shared/originalProps"
export * from "./shared/staticRendering"

configure({ reactionScheduler: unstable_batchedUpdates })
