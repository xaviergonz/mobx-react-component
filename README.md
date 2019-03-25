# mobx-react-localstate <!-- omit in toc -->

[![npm version](https://badge.fury.io/js/mobx-react-localstate.svg)](https://badge.fury.io/js/mobx-react-localstate)
[![Build Status](https://travis-ci.org/xaviergonz/mobx-react-localstate.svg?branch=master)](https://travis-ci.org/xaviergonz/mobx-react-localstate)
[![Coverage Status](https://coveralls.io/repos/github/xaviergonz/mobx-react-localstate/badge.svg)](https://coveralls.io/github/xaviergonz/mobx-react-localstate)

### React local state made easy with [mobx](https://github.com/mobxjs/mobx) and [mobx-react](https://github.com/mobxjs/mobx-react).

```
npm install mobx-react-localstate
yarn add mobx-react-localstate
```

**You need React version 16.8.0 and above and mobx-react 6.0.0 and above**

Project is written in TypeScript and provides type safety out of the box. No Flow Type support is planned at this moment, but feel free to contribute.

If you know how to use mobx and how to use hooks the example should be pretty much self explanatory.

### With classes

```tsx
import { action, computed, observable, when } from "mobx"
import { observer, useObserver } from "mobx-react"
import * as React from "react"
import { Effects, injectedProperty, useMobxLocalState } from "mobx-react-localstate"

interface IMyComponentProps {
    x: number
}

class MyComponentState {
    props = injectedProperty<IMyComponentProps>()

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
        props: {
            value: props,
            updateMode: "shallow" // how to transform the value into an observable
        }
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
        props: {
            value: props,
            updateMode: "shallow" // how to transform the value into an observable
        }
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
```

## With plain objects

```tsx
import { action, observable, when } from "mobx"
import { observer, useObserver } from "mobx-react"
import * as React from "react"
import { injectedProperty, useMobxLocalState } from "mobx-react-localstate"

interface IMyComponentProps {
    x: number
}

const newMyComponentState = () =>
    observable(
        {
            props: injectedProperty<IMyComponentProps>(),

            // observable
            y: 0,

            // action (decorated below)
            incY() {
                this.y++
            },

            // computed
            get sum() {
                return this.props.x + this.y
            },

            // effects will be auto disposed on unmount,
            // they need to be named "effects"
            effects() {
                return [
                    when(
                        () => this.sum > 10,
                        () => {
                            console.log("you reached ten!")
                        }
                    )
                ]
            }
        },
        {
            incY: action
        }
    )

// with observer
const MyComponent1 = observer((props: IMyComponentProps) => {
    const state = useMobxLocalState(() => newMyComponentState(), {
        // inject the following values as observables in the state
        props: {
            value: props,
            updateMode: "shallow" // how to transform the value into an observable
        }
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
    const state = useMobxLocalState(() => newMyComponentState(), {
        // inject the following values as observables in the state
        props: {
            value: props,
            updateMode: "shallow" // how to transform the value into an observable
        }
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
```

## useMobxLocalState

```ts
useMobxLocalState<T extends MobxLocalState>(
    constructFn: () => T,
    dependencies?: IDependencies<T>
): T

type IDependencies<T> = { [k in keyof T]?: IDependency<T[k]> }

interface IDependency<T> {
    value: T
    updateMode?: UpdateableObservableMode<T>
}

export type UpdateableObservableMode<T> =
    | "shallow" // the reference is not changed and the properties (primitives, objects, maps and arrays) are turned into a shallowly observable values
    | "deep" // the reference is not changed and properties (primitives, objects, maps and arrays) are turned into a deeply observable values
    | (T extends object
          ? {
                deepProps: Array<keyof T> // like 'shallow', except some properties are turned into deep observables 'opt-in'
            }
          : never)
```

`useMobxLocalState` second parameter (`dependencies`) is optional and allows you to inject into the state object any given observable or non-observable values as observable values.
This is specially useful when any of your computed values of reaction depend on some non-observable values (such as props or some context).
Each dependency is in the form:

```ts
{
    PROPERTY_INSIDE_STATE: {
        value: VALUE_TO_TRANSFORM,
        updateMode?: "shallow" | "deep" | { deepProps: [ORIGINAL_VALUE_PROP_NAMES] }
    }
}
```

Where the mode controls how the transformation into observable is made, being `shallow` the default. For example, if you only want to make certain props to be transformed into deep observables you can pass something like:

```ts
{
    props: {
        value: props,
        updateMode: {
            deepProps: ["propToMakeDeep1", "propToMakeDeep2"]
        }
    }
}
```

## FAQ

#### How do I use data from other hooks inside the state object?

```ts
// component
const contextData = useContext(...) // contextData type is IContextData for example
const state = useMobxLocalState(() => new MyComponentState(), {
    contextData: {
        value: contextData
        // shallow update mode when none is given
    }
})

// state
class MyComponentState extends MobxLocalState {
    contextData!: IContextData // it will be a shallow observable
}
```
