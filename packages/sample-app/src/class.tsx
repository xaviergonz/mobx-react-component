import { action, computed, makeObservable, observable, when } from "mobx"
import {
    injectContext,
    MobxComponent,
    mobxComponent,
    ReactContextValue,
} from "mobx-react-component"
import * as React from "react"
import { SomeContext } from "./SomeContext"

interface IMyComponentProps {
    x: number
}

@mobxComponent()
export class MyComponent extends MobxComponent<IMyComponentProps> {
    // only required if using MobX 6
    constructor() {
        super()
        makeObservable(this)
    }

    // statics (defaultProps, displayName, propTypes, etc.) can be declared here
    static displayName = "MyComponent"
    static defaultProps = {
        x: 1,
    }

    // this.props will become an observable reference version of props

    // note: its ref will be kept immutable, so when using hooks pass the actual
    // single props it depends on, not just "props"
    // if you really need to access the original props object for some reason
    // you can still use `this.originalProps` or `getOriginalProps(this.props)`

    // this.ref will contain the forward reference (if any)

    // this.someContext will become an observable reference
    @injectContext(SomeContext)
    someContext!: ReactContextValue<typeof SomeContext>

    @observable
    y = 0

    @action.bound
    incY() {
        this.y++
    }

    @computed
    get sum() {
        return this.props.x + this.y + this.someContext.z
    }

    // effects will be run on first render and auto disposed on unmount
    getEffects() {
        return [
            when(
                () => this.sum === 10,
                () => {
                    alert("you reached 10! (class)")
                }
            ),
        ]
    }

    render() {
        // this is a function component render, so hooks can be used as usual
        // the only difference is that everything above (the logic) is available in "this"
        // additionally the component will auto-rerender when any observable changes
        const { props } = this
        return (
            <div>
                <div>
                    x + y + z = {props.x} + {this.y} + {this.someContext.z} = {this.sum}
                </div>
                <button onClick={this.incY}>Increment Y (state)</button>
            </div>
        )
    }
}

// usage
// <MyComponent x={5}/>
