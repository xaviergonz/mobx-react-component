# mobx-react-component <!-- omit in toc -->

[![npm version](https://badge.fury.io/js/mobx-react-component.svg)](https://badge.fury.io/js/mobx-react-component)
[![Build Status](https://travis-ci.org/xaviergonz/mobx-react-component.svg?branch=master)](https://travis-ci.org/xaviergonz/mobx-react-component)
[![Coverage Status](https://coveralls.io/repos/github/xaviergonz/mobx-react-component/badge.svg?branch=master)](https://coveralls.io/github/xaviergonz/mobx-react-component?branch=master)

### Write React functional components (with hooks) + MobX for local state in a fancy way

```
npm install mobx-react-component
yarn add mobx-react-component
```

**Requires React version 16.8.0 and above**

Project is written in TypeScript and provides type safety out of the box. No Flow Type support is planned at this moment, but feel free to contribute.

If you know how to use mobx and how to use hooks the example should be pretty much self explanatory.

### Examples

[Edit in CodeSandbox](https://stackblitz.com/edit/mobx-react-component-sample)

#### Using hooks

```tsx
import { action, computed, observable, when, makeObservable } from "mobx"
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
    // only required if using MobX 6
    constructor() {
        makeObservable(this)
    }

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
            ),
        ]
    }
}

export const MyComponent = mobxObserver(
    memo((props: IMyComponentProps) => {
        const ctx = useContext(SomeContext)

        const s = useMobxLocalState(
            MyComponentState,
            {
                ...props,
                ...ctx,
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
    }),
    {
        displayName: "MyComponent",
        defaultProps: {
            x: 1,
        },
    }
)

// usage
// <MyComponent x={5}/>
```

#### Using a "hook-enabled" class

```tsx
import { action, computed, observable, when } from "mobx"
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
```

References to the class instance are supported as well

```tsx
import * as React from "react"
import { MobxComponent, mobxComponent } from "mobx-react-component"

@mobxComponent()
class MyComponent extends MobxComponent<{}> {
    someMethod() {
        // some imperative method
    }

    render() {
        return null
    }
}

// You can now get a ref to the class instance:
// const ref = React.createRef<MyComponent>();
// <MyComponent ref={ref}/>
// ref.current.someMethod()
```

If for some reason you want to turn off ref emulation (for example some incompability or a slight speed bump) you
can do so using `@mobxComponent({refEmulation: false})`

If you are using SSR, then when using it do this:

```tsx
enableMobxStaticRendering(true)
```
