// with classes

import { action, computed, observable, when } from "mobx"
import { observer, useObserver } from "mobx-react"
import * as React from "react"
import { Effects, injectedProperty, useMobxLocalState } from "../src"

interface IMyComponentProps {
    x: number
}

class MyComponentState {
    // an injected property is a property that gets injected from the component
    // and transformed into a mutable observable
    props = injectedProperty<IMyComponentProps>() // "shallow" observable by default

    @observable
    y = 0

    @action.bound
    incY() {
        this.y++
    }

    @computed
    get sum() {
        return this.props.x + this.y
    }

    // effects will be auto disposed on unmount,
    // they need to be named "effects"
    effects: Effects = () => [
        when(
            () => this.sum > 10,
            () => {
                console.log("you reached ten!")
            }
        )
    ]
}

// with observer
const MyComponent1 = observer((props: IMyComponentProps) => {
    const state = useMobxLocalState(() => new MyComponentState(), {
        // inject the following values as observables in the state
        props
    })

    return (
        <div>
            <div>
                x + y = {state.props.x} + {state.y} = {state.sum}
            </div>
            <button onClick={state.incY}>Increment Y</button>
        </div>
    )
})

// with useObserver and memo
const MyComponent2 = React.memo((props: IMyComponentProps) => {
    const state = useMobxLocalState(() => new MyComponentState(), {
        // inject the following values as observables in the state
        props
    })

    return useObserver(() => (
        <div>
            <div>
                x + y = {state.props.x} + {state.y} = {state.sum}
            </div>
            <button onClick={state.incY}>Increment Y</button>
        </div>
    ))
})
