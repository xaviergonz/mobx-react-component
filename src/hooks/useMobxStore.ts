import { isObservable, observable } from "mobx"
import { useLazyInit } from "../shared/useLazyInit"
/**
 * Uses an observable mobx store, which is an observable object.
 * The parameter can be either an observable, or if not an observable it will be
 * turned into one automatically.
 *
 * Example:
 * ```ts
 * const store = useMobxStore(() => ({
 *   x: 5
 * }))
 *
 * // alternatively
 * const store = useMobxStore(() => observable({
 *   x: 5
 * }))
 * ```
 */
export function useMobxStore<O>(obsFn: () => O): O {
    return useLazyInit(() => {
        let obs = obsFn()
        if (!isObservable(obs)) {
            obs = observable(obs)
        }
        return obs
    })
}
