import { useRef } from "react"

export function useLazyInit<T>(fn: () => T): T {
    const ref = useRef<T | null>(null)
    if (!ref.current) {
        ref.current = fn()
    }
    return ref.current
}
