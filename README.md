# mobx-react-component <!-- omit in toc -->

[![npm version](https://badge.fury.io/js/mobx-react-component.svg)](https://badge.fury.io/js/mobx-react-component)
[![Build Status](https://travis-ci.org/xaviergonz/mobx-react-component.svg?branch=master)](https://travis-ci.org/xaviergonz/mobx-react-component)
[![Coverage Status](https://coveralls.io/repos/github/xaviergonz/mobx-react-component/badge.svg?branch=master)](https://coveralls.io/github/xaviergonz/mobx-react-component?branch=master)

### Write React functional components (with hooks) + MobX for local state in a fancy way

```
npm install mobx-react-component
yarn add mobx-react-component
```

**You need React version 16.8.0 and above and mobx-react-lite 1.2.0 and above**

Project is written in TypeScript and provides type safety out of the box. No Flow Type support is planned at this moment, but feel free to contribute.

If you know how to use mobx and how to use hooks the example should be pretty much self explanatory.

### Examples

#### Using hooks

[Edit in CodeSandbox](https://codesandbox.io/s/jlmx7jk779)

```tsx
import { when } from "mobx"
import * as React from "react"
import { memo, useContext } from "react"
import {
    mobxObserver,
    useMobxActions,
    useMobxEffects,
    useMobxObservable,
    useMobxObsRefs
} from "mobx-react-component"

interface IMyComponentProps {
    x: number
}

const SomeContext = React.createContext({ z: 2 }) // might be a root store

export const MyComponent = memo(
    mobxObserver((props: IMyComponentProps) => {
        // props is a shallowly observable object

        // note 1: its ref will be kept immutable, so when using hooks pass the actual
        // single props it depends on, not just "props"
        // if you really need to access the original props object for some reason
        // you can still use `getOriginalProps(props)`

        // note 2: do NOT ever destructure this when using or else the observability
        // will be lost! (in other words, always use props.X to access the value)

        // observable refs of the given data

        // note 1: do NOT ever destructure this when using or else the observability
        // will be lost! (in other words, always use obs.X to access the value)
        // note 2: if the context value is actually an observable that will never
        // change its ref then this is not needed
        const obs = useMobxObsRefs({
            someContextValue: useContext(SomeContext)
        })

        const state = useMobxObservable(
            () => ({
                // observable value
                y: 0,

                // computed
                get sum() {
                    return props.x + this.y + obs.someContextValue.z
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
                    x + y + z = {props.x} + {state.y} + {obs.someContextValue.z} = {state.sum}
                </div>
                <button onClick={actions.incY}>Increment Y</button>
            </div>
        )
    })
)

MyComponent.displayName = "MyComponent"

// usage
// <MyComponent x={5}/>
```

#### Using a "hook-enabled" class

```tsx
import { action, computed, observable, when } from "mobx"
import * as React from "react"
import {
    injectContext,
    MobxComponent,
    mobxComponent,
    ReactContextValue
} from "mobx-react-component"

interface IMyComponentProps {
    x: number
}

const SomeContext = React.createContext({ z: 2 }) // might be a root store

class MyComponentClass extends MobxComponent<IMyComponentProps> {
    // this.props will become an observable reference version of props

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

    // effects will be auto disposed on unmount,
    // the need to start with the name "fx_"
    fx_when10() {
        return when(
            () => this.sum === 10,
            () => {
                // you reached ten!
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
```

Forward references are supported as well

```tsx
import * as React from "react"
import { MobxComponent, mobxComponent } from "mobx-react-component"

interface IMyComponentProps {
    children: React.ReactNode
}

class MyComponentClass extends MobxComponent<IMyComponentProps, HTMLButtonElement> {
    render(props: IMyComponentProps, ref: React.Ref<HTMLButtonElement>) {
        return <button ref={ref}>{props.children}</button>
    }
}

export const MyComponent = mobxComponent(MyComponentClass)

// You can now get a ref directly to the DOM button:
// const ref = React.createRef<HTMLButtonElement>();
// <MyComponent ref={ref}/>
```
