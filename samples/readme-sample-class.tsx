import { action, computed, observable, when } from "mobx"
import * as React from "react"
import { IMobxComponent, injectContext, mobxComponent, ReactContextValue } from "../src"

interface IMyComponentProps {
    x: number
}

const SomeContext = React.createContext({ z: 2 }) // might be a root store

class MyComponentClass implements IMobxComponent<IMyComponentProps> {
    // this.props will become an observable reference version of props
    props!: IMyComponentProps

    // note: its ref will be kept immutable, so when using hooks pass the actual
    // single props it depends on, not just "props"
    // if you really need to access the original props object for some reason
    // you can still use `getOriginalProps(props)`

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
                    // you reached ten!
                }
            )
        ]
    }

    render(props: IMyComponentProps) {
        // this is a function component render, so hooks can be used as usual
        // the only difference is that everything above (the logic) is available in "this"
        // additionally the component will auto-rerender when any observable changes
        return (
            <div>
                <div>
                    x + y + z = {props.x} + {this.y} + {this.someContext.z} = {this.sum}
                </div>
                <button onClick={this.incY}>Increment Y</button>
            </div>
        )
    }
}

export const MyComponent = mobxComponent(
    MyComponentClass,
    // statics (defaultProps, displayName, propTypes, etc. can be declared here)
    {
        displayName: "MyComponent",
        defaultProps: {
            x: 1
        }
    }
)

// usage
// <MyComponent x={5}/>