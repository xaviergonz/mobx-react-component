import { getDependencyTree, Reaction } from "mobx"
import { useDebugValue, useEffect, useRef, useState } from "react"
import { isUsingMobxStaticRendering } from "./staticRendering"

let forceUpdateEnabled = true

export function withoutForceUpdate<F extends (...args: any[]) => any>(fn: F): F {
    const newFn = function(this: any) {
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

export function useMobxObserver<T>(fn: () => T, baseComponentName: string = "observed"): T {
    if (isUsingMobxStaticRendering()) {
        return fn()
    }

    const [, setTick] = useState(0)

    // render the original component, but have the
    // reaction track the observables, so that rendering
    // can be invalidated (see above) once a dependency changes

    // we use two reactions to ensure we don't react to observables set in the render phase
    // this is different from how mobx-react-lite does, where it uses a single reaction
    // however we will reset the old reaction after this one is done tracking so any
    // cached computeds won't die early
    const reactions = useRef<RoundRobinReaction | null>(null)
    if (!reactions.current) {
        reactions.current = new RoundRobinReaction(`mobxObserver(${baseComponentName})`, () =>
            setTick(t => t + 1)
        )
    }

    useEffect(
        () => () => {
            reactions.current!.dispose()
        },
        []
    )

    let rendering!: T
    let exception
    reactions.current!.track(() => {
        try {
            rendering = fn()
        } catch (e) {
            exception = e
        }
    })

    useDebugValue(reactions.current!.currentReaction, printDebugValue)

    if (exception) {
        reactions.current!.dispose()
        throw exception // re-throw any exceptions catched during rendering
    }
    return rendering
}

class RoundRobinReaction {
    private reactions?: [Reaction, Reaction]
    private current: 0 | 1 = 1

    get currentReaction() {
        return this.reactions ? this.reactions[this.current] : undefined
    }

    constructor(private readonly reactionName: string, private readonly run: () => any) {}

    private createReactionsIfNeeded() {
        if (this.reactions) {
            return
        }

        const run = this.run

        const reaction1 = new Reaction(this.reactionName, () => {
            if (this.current === 0 && forceUpdateEnabled) {
                run()
            }
        })
        const reaction2 = new Reaction(this.reactionName, () => {
            if (this.current === 1 && forceUpdateEnabled) {
                run()
            }
        })

        this.reactions = [reaction1, reaction2]
    }

    track<T>(fn: () => T): T {
        this.createReactionsIfNeeded()

        const oldReaction = this.currentReaction!
        this.current = ((this.current + 1) % 2) as 0 | 1 // swap current reaction
        const reaction = this.currentReaction!

        let result!: T
        reaction.track(() => {
            result = fn()
        })

        // clear dependencies of old reaction
        oldReaction.track(emptyFn)

        return result
    }

    dispose() {
        if (this.reactions) {
            this.reactions.forEach(r => r.dispose())
            this.reactions = undefined
        }
    }
}

const emptyFn = () => {
    // do nothing
}

function printDebugValue(v: Reaction | undefined) {
    if (!v) {
        return "<unknown>"
    }
    const deps = getDependencyTree(v).dependencies || []
    return deps.map(d => d.name).join(", ")
}
