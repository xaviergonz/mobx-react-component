import { getDependencyTree, Reaction } from "mobx"
import { useDebugValue, useEffect, useRef, useState } from "react"
import { isUsingStaticRendering } from "./staticRendering"

export function useMobxObserver<T>(fn: () => T, baseComponentName: string = "observed"): T {
    if (isUsingStaticRendering()) {
        return fn()
    }

    const [, setTick] = useState(0)

    const reaction = useRef<Reaction | null>(null)
    const oldReaction = useRef<Reaction | null>(null)
    useEffect(
        () => () => {
            disposeReaction(oldReaction)
            disposeReaction(reaction)
        },
        []
    )

    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes

    // we use a new reaction to ensure we don't react to observables set in the render phase
    // this is different from how mobx-react-lite does, where it reuses the reaction
    // however we will dispose of the old reaction after this one is done tracking so any
    // cached computeds won't die early
    oldReaction.current = reaction.current

    reaction.current = new Reaction(`mobxObserver(${baseComponentName})`, function(this: Reaction) {
        if (reaction.current === this) {
            setTick(t => t + 1)
        }
    })

    let rendering!: T
    let exception
    reaction.current.track(() => {
        try {
            rendering = fn()
        } catch (e) {
            exception = e
        }
    })

    useDebugValue(reaction, printDebugValue)

    disposeReaction(oldReaction)

    if (exception) {
        disposeReaction(reaction)
        throw exception // re-throw any exceptions catched during rendering
    }
    return rendering
}

function printDebugValue(v: React.MutableRefObject<Reaction | null>) {
    if (!v.current) {
        return "<unknown>"
    }
    return getDependencyTree(v.current)
}

function disposeReaction(reaction: React.MutableRefObject<Reaction | null>) {
    if (reaction.current) {
        reaction.current.dispose()
        reaction.current = null
    }
}
