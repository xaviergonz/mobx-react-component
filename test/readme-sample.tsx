import { action, computed, observable, when } from "mobx"
import * as React from "react"
import { ContextValue, injectContext, MobxComponent, mobxComponent } from "../src"

interface IMyComponentProps {
    x: number
}

const SomeContext = React.createContext({})

class MyComponentClass extends MobxComponent<IMyComponentProps> {
    // this.props will become an observable reference version of props

    // this.someContext will become an observable reference
    @injectContext(SomeContext)
    someContext!: ContextValue<typeof SomeContext>

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
    // the need to start with the name "fx_"
    fx_when10() {
        return when(
            () => this.sum === 10,
            () => {
                console.log("you reached ten!")
            }
        )
    }

    render(props: IMyComponentProps) {
        // this is a function component render, so hooks can be used as usual
        // the only difference is that everything above (the logic) is available in "this"
        // additionally the component will auto-rerender when any observable changes
        return (
            <div>
                <div>
                    x + y = {props.x} + {this.y} = {this.sum}
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
