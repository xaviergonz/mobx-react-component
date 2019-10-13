import { action, computed, observable, when } from "mobx"
import { MobxLocalState, mobxObserver, useMobxLocalState } from "mobx-react-component"
import * as React from "react"
import { memo, useContext } from "react"
import { SomeContext } from "./SomeContext"

interface IMyComponentProps {
    x: number
}

// here we define the "mobx local state" of the component
// dependencies (usually just props, but might include inputs from other hooks)
// are declared here and are turned into observables accessible through either
// this.props.NAME or this.NAME

class MyComponentState extends MobxLocalState<IMyComponentProps & { z: number }>() {
    @observable y = 0

    @computed
    get sum() {
        // x comes from component props
        // y comes from local observable
        // z comes from context
        return this.x + this.y + this.z
    }

    @action
    incY = () => {
        this.y++
    }

    getEffects() {
        // effects will be started on first render and auto disposed on unmount
        // you might use getBeforeMountEffects() instead if you want to run them
        // before the component is first mounted
        return [
            when(
                () => this.sum === 10,
                () => {
                    alert("you reached ten! (hooks / useMobxLocalState)")
                }
            )
        ]
    }
}

export const MyComponent = memo(
    mobxObserver((props: IMyComponentProps) => {
        const ctx = useContext(SomeContext)

        const s = useMobxLocalState(
            MyComponentState,
            {
                ...props,
                ...ctx
            },
            // the way to turn the object above into an observable is shallow by default,
            // but you can also specify "deep" or an object to cherry pick which properties
            // need to be turned into deep observables
            "shallow"
        )

        return (
            <div>
                <div>
                    x + y + z = {s.x} + {s.y} + {s.z} = {s.sum}
                </div>
                <button onClick={s.incY}>Increment Y (state)</button>
            </div>
        )
    })
)

MyComponent.displayName = "MyComponent"

// usage
// <MyComponent x={5}/>
