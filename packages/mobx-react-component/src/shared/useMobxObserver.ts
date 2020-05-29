import { getDependencyTree, Reaction } from "mobx"
import { useCallback, useDebugValue, useEffect, useRef, useState } from "react"
import {
    createTrackingData,
    IReactionTracking,
    recordReactionAsCommitted,
    scheduleCleanupOfReactionIfLeaked,
} from "./reactionCleanupTracking"
import { RoundRobinReaction } from "./RoundRobinReaction"
import { isUsingMobxStaticRendering } from "./staticRendering"

let forceUpdateEnabled = true

const isForceUpdateEnabled = () => forceUpdateEnabled

export function withoutForceUpdate<F extends (...args: any[]) => any>(fn: F): F {
    const newFn = function (this: any) {
        const old = forceUpdateEnabled
        forceUpdateEnabled = false
        try {
            return fn.apply(this, arguments as any)
        } finally {
            forceUpdateEnabled = old
        }
    }
    return newFn as F
}

function observerComponentNameFor(baseComponentName: string) {
    return `mobxObserver(${baseComponentName})`
}

function useForceUpdate() {
    const [, setTick] = useState(0)
    return useCallback(() => {
        setTick((t) => t + 1)
    }, [])
}

export function useMobxObserver<T>(fn: () => T, baseComponentName: string = "observed"): T {
    if (typeof fn !== "function") {
        return fn // for ObserverComponent
    }
    if (isUsingMobxStaticRendering()) {
        return fn()
    }

    /* eslint-disable react-hooks/rules-of-hooks */
    // it is ok to call them only when static rendering is not being used

    const forceUpdate = useForceUpdate()

    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes

    // we use two reactions to ensure we don't react to observables set in the render phase
    // this is different from how mobx-react-lite does, where it uses a single reaction
    // however we will reset the old reaction after this one is done tracking so any
    // cached computeds won't die early

    // StrictMode/ConcurrentMode/Suspense may mean that our component is
    // rendered and abandoned multiple times, so we need to track leaked
    // Reactions.
    const reactionTrackingRef = useRef<IReactionTracking | null>(null)

    if (!reactionTrackingRef.current) {
        // First render for this component (or first time since a previous
        // reaction from an abandoned render was disposed).

        const newReaction = new RoundRobinReaction(
            observerComponentNameFor(baseComponentName),
            () => {
                // Observable has changed, meaning we want to re-render
                // BUT if we're a component that hasn't yet got to the useEffect()
                // stage, we might be a component that _started_ to render, but
                // got dropped, and we don't want to make state changes then.
                // (It triggers warnings in StrictMode, for a start.)
                if (trackingData.mounted) {
                    // We have reached useEffect(), so we're mounted, and can trigger an update
                    forceUpdate()
                } else {
                    // We haven't yet reached useEffect(), so we'll need to trigger a re-render
                    // when (and if) useEffect() arrives.  The easiest way to do that is just to
                    // drop our current reaction and allow useEffect() to recreate it.
                    newReaction.dispose()
                    reactionTrackingRef.current = null
                    recordReactionAsCommitted(reactionTrackingRef)
                }
            },
            isForceUpdateEnabled
        )

        const trackingData = createTrackingData(newReaction)
        reactionTrackingRef.current = trackingData
        scheduleCleanupOfReactionIfLeaked(reactionTrackingRef)
    }

    const { reaction } = reactionTrackingRef.current!

    useEffect(() => {
        // Called on first mount only
        recordReactionAsCommitted(reactionTrackingRef)

        if (reactionTrackingRef.current) {
            // Great. We've already got our reaction from our render;
            // all we need to do is to record that it's now mounted,
            // to allow future observable changes to trigger re-renders
            reactionTrackingRef.current.mounted = true
        } else {
            // The reaction we set up in our render has been disposed.
            // This is either due to bad timings of renderings, e.g. our
            // component was paused for a _very_ long time, and our
            // reaction got cleaned up, or we got a observable change
            // between render and useEffect

            // Re-create the reaction
            reactionTrackingRef.current = {
                reaction: new RoundRobinReaction(
                    observerComponentNameFor(baseComponentName),
                    () => {
                        // We've definitely already been mounted at this point
                        forceUpdate()
                    },
                    isForceUpdateEnabled
                ),
                cleanAt: Infinity,
            }
            forceUpdate()
        }

        return () => {
            reactionTrackingRef.current!.reaction.dispose()
            reactionTrackingRef.current = null
        }
    }, [baseComponentName, forceUpdate])

    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes
    let rendering!: T
    let exception
    reaction.track(() => {
        try {
            rendering = fn()
        } catch (e) {
            exception = e
        }
    })

    useDebugValue(reaction.currentReaction, printDebugValue)

    if (exception) {
        throw exception // re-throw any exceptions catched during rendering
    }
    return rendering

    /* eslint-enable react-hooks/rules-of-hooks */
}

function printDebugValue(v: Reaction | undefined) {
    if (!v) {
        return "<unknown>"
    }
    const deps = getDependencyTree(v).dependencies || []
    return deps.map((d) => d.name).join(", ")
}
