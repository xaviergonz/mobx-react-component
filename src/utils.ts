import { useCallback, useState } from "react"

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
