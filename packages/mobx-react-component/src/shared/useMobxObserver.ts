import { getDependencyTree, Reaction } from "mobx"
import { useDebugValue, useEffect, useRef, useState } from "react"
import { isUsingStaticRendering } from "./staticRendering"

export function useMobxObserver<T>(fn: () => T, baseComponentName: string = "observed"): T {
    if (isUsingStaticRendering()) {
        return fn()
    }

    const [, setTick] = useState(0)

    const reaction1 = useRef<Reaction | null>(null)
    const reaction2 = useRef<Reaction | null>(null)
    const currentReaction = useRef<1 | 2>(1)
    useEffect(
        () => () => {
            disposeReaction(reaction1)
            disposeReaction(reaction2)
        },
        []
    )

    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes

    // we use two reactions to ensure we don't react to observables set in the render phase
    // this is different from how mobx-react-lite does, where it uses a single reaction
    // however we will reset the old reaction after this one is done tracking so any
    // cached computeds won't die early
    if (!reaction1.current) {
        reaction1.current = createReaction(baseComponentName, 1, currentReaction, setTick)
    }
    if (!reaction2.current) {
        reaction2.current = createReaction(baseComponentName, 2, currentReaction, setTick)
    }

    let reaction
    let oldReaction
    if (currentReaction.current === 1) {
        currentReaction.current = 2
        reaction = reaction2.current
        oldReaction = reaction1.current
    } else {
        currentReaction.current = 1
        reaction = reaction1.current
        oldReaction = reaction2.current
    }

    let rendering!: T
    let exception
    reaction.track(() => {
        try {
            rendering = fn()
        } catch (e) {
            exception = e
        }
    })

    useDebugValue(reaction, printDebugValue)

    // clear dependencies of old reaction
    oldReaction.track(emptyFn)

    if (exception) {
        disposeReaction(reaction1)
        disposeReaction(reaction2)
        throw exception // re-throw any exceptions catched during rendering
    }
    return rendering
}

function createReaction(
    baseComponentName: string,
    reactionNumber: number,
    currentReaction: React.MutableRefObject<number>,
    setTick: (fn: (n: number) => number) => void
) {
    return new Reaction(`mobxObserver(${baseComponentName})`, () => {
        if (currentReaction.current === reactionNumber) {
            setTick(t => t + 1)
        }
    })
}

const emptyFn = () => {
    // do nothing
}

function printDebugValue(v: Reaction) {
    if (!v) {
        return "<unknown>"
    }
    const deps = getDependencyTree(v).dependencies || []
    return deps.map(d => d.name).join(", ")
}

function disposeReaction(reaction: React.MutableRefObject<Reaction | null>) {
    if (reaction.current) {
        reaction.current.dispose()
        reaction.current = null
    }
}
