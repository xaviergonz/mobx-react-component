import { observable } from "mobx"
import { useRef } from "react"

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
    const store = useRef<O | null>(null)
    if (!store.current) {
        store.current = observable(obsFn())
    }

    return store.current
}
