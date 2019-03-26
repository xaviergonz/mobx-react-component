import { useCallback, useEffect, useState } from "react"

const EMPTY_ARRAY: any[] = []

export function useUnmount(fn: () => void) {
    useEffect(() => fn, EMPTY_ARRAY)
}

export let skippingForceUpdate = 0

export function useSkippingForceUpdate<T>(fn: () => T): T {
    try {
        skippingForceUpdate++
        return fn()
    } finally {
        skippingForceUpdate--
    }
}

export function useForceUpdate() {
    const [, setTick] = useState(0)

    const update = useCallback(() => {
        if (!skippingForceUpdate) {
            setTick(tick => tick + 1)
        }
    }, [])

    return update
}
