import { action } from "mobx"
import { newObservableWrapper, ObservableWrapperMode } from "../shared/observableWrapper"
import { useLazyInit } from "../shared/useLazyInit"

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
    const data = useLazyInit(() => {
        const { get, update } = newObservableWrapper(value, mode)
        const updateAction = action("updateMobxObservableSource", update)

        return {
            get,
            updateAction,
            needsUpdating: true
        }
    })

    if (data.needsUpdating) {
        data.updateAction(value)
    }
    data.needsUpdating = true

    return data.get
}
