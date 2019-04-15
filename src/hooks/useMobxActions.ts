import { action, observable } from "mobx"
import { useLazyInit } from "../shared/useLazyInit"
/**
 * Creates some mobx actions, which are already bound.
 *
 * Example:
 * ```ts
 * const actions = useMobxActions(() => {
 *   incX() {
 *     state.x++
 *   }
 * })
 *
 * // then use actions.incX()
 * ```
 */
export function useMobxActions<O extends object>(actionsFn: () => O): O {
    const act = useLazyInit(() => {
        // create actions object
        const actions = actionsFn()

        const decorators: any = {}
        Object.keys(actions).forEach(k => {
            decorators[k] = action.bound
        })

        return observable(actions, decorators)
    })

    return act
}
