import { action, observable } from "mobx"
import { useRef } from "react"
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
    const act = useRef<O | null>(null)
    if (!act.current) {
        // create actions object
        const actions = actionsFn()

        const decorators: any = {}
        Object.keys(actions).forEach(k => {
            decorators[k] = action.bound
        })

        act.current = observable(actions, decorators)
    }

    return act.current!
}
