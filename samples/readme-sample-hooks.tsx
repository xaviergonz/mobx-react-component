import { when } from "mobx"
import * as React from "react"
import { memo, useContext } from "react"
import {
    mobxObserver,
    useMobxActions,
    useMobxEffects,
    useMobxObservable,
    useMobxObsRefs
} from "../src"

interface IMyComponentProps {
    x: number
}

const SomeContext = React.createContext({ x: 5 }) // might be a root store

export const MyComponent = memo(
    mobxObserver((unobsProps: IMyComponentProps) => {
        // observable refs of the given data
        // note: do NOT ever destructure this when using or else the observability
        // will be lost! (in other words, always use obs.X to access the value)
        const obs = useMobxObsRefs({
            props: unobsProps,
            someContextValue: useContext(SomeContext)
        })

        const state = useMobxObservable(
            () => ({
                // observable value
                y: 0,

                // computed
                get sum() {
                    return obs.props.x + this.y
                }
            }),
            // decorators (optional)
            {
                // properties will default to observables / computed
            }
        )

        const actions = useMobxActions(() => ({
            incY() {
                state.y++
            }
        }))

        // effects will be started on first render and auto disposed on unmount
        useMobxEffects(() => [
            when(
                () => state.sum === 10,
                () => {
                    // you reached ten!
                }
            )
        ])

        return (
            <div>
                <div>
                    x + y = {obs.props.x} + {state.y} = {state.sum}
                </div>
                <button onClick={actions.incY}>Increment Y</button>
            </div>
        )
    })
)

MyComponent.displayName = "MyComponent"

// usage
// <MyComponent x={5}/>
