import { action } from "mobx"
import { useRef } from "react"
import { newObservableWrapper, ObservableWrapperMode } from "./observableWrapper"
import { withoutForceUpdate } from "./useMobxObserver"

/**
 * Transforms a value into an observable value.
 * The `mode` parameter can be either `"shallow"`, `"deep"`, or `"ref"` indicating how
 * the transformation should be performed.
 * The function will return a function that will return the observable value.
 * Note that in order for observability to work properly this getter must be used before accessing
 * the data.
 *
 * Example:
 * ```ts
 * // given some context such as { name: string }
 *
 * const obsContext = useMobxAsObservableSource(useContext(SomeNonObservableContext))
 *
 * // then inside a computed, reaction, etc. use obsContext().name
 * ```
 */
export function useMobxAsObservableSource<V>(value: V, mode: ObservableWrapperMode): () => V {
    const data = useRef<{ get(): V; updateAction(newV: V): void } | null>(null)
    if (!data.current) {
        const { get, update } = newObservableWrapper(value, mode)
        const updateAction = withoutForceUpdate(action("updateMobxObservableSource", update))

        data.current = {
            get,
            updateAction
        }
    } else {
        data.current.updateAction(value)
    }

    return data.current.get
}
