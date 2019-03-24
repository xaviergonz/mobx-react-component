# mobx-react-localstate <!-- omit in toc -->

[![Build Status](https://travis-ci.org/mobxjs/mobx-react-localstate.svg?branch=master)](https://travis-ci.org/mobxjs/mobx-react-localstate)[![Coverage Status](https://coveralls.io/repos/github/mobxjs/mobx-react-localstate/badge.svg)](https://coveralls.io/github/mobxjs/mobx-react-localstate)

React local state made easy with [mobx](https://github.com/mobxjs/mobx) and [mobx-react](https://github.com/mobxjs/mobx-react).

**You need React version 16.8.0 and above and mobx-react 6.0.0 and above**

Class based components **are not supported** except using `<Observer>` directly in its `render` method. If you want to transition existing projects from classes to hooks (as most of us do), you can use this package alongside the [mobx-react](https://github.com/mobxjs/mobx-react) just fine. The only conflict point is about the `observer` HOC. Subscribe [to this issue](https://github.com/mobxjs/mobx-react/issues/640) for a proper migration guide.

[![NPM](https://nodei.co/npm/mobx-react-localstate.png)](https://www.npmjs.com/package/mobx-react-localstate)

Project is written in TypeScript and provides type safety out of the box. No Flow Type support is planned at this moment, but feel free to contribute.

- [API documentation](#api-documentation)
  - [`observer<P>(baseComponent: FunctionComponent<P>, options?: IObserverOptions): FunctionComponent<P>`](#observerpbasecomponent-functioncomponentp-options-iobserveroptions-functioncomponentp)
  - [`useObservable<T>(initialValue: T): T`](#useobservabletinitialvalue-t-t)
  - [`useDisposable<D extends TDisposable>(disposerGenerator: () => D, inputs: ReadonlyArray<any> = []): D`](#usedisposabled-extends-tdisposabledisposergenerator---d-inputs-readonlyarrayany---d)

## API documentation

### `observer<P>(baseComponent: FunctionComponent<P>, options?: IObserverOptions): FunctionComponent<P>`

Function that converts a function component into a reactive component, which tracks which observables are used automatically re-renders the component when one of these values changes. Observables can be passed through props, accessed from context or created locally with `useObservable`.

As for options, it is an optional object with the following optional properties:

-   `forwardRef`: pass `true` to use [`forwardRef`](https://reactjs.org/docs/forwarding-refs.html) over the inner component, pass `false` (the default) otherwise.

```tsx
import { observer, useObservable } from "mobx-react-lite"

const FriendlyComponent = observer(() => {
    const friendNameRef = React.useRef()
    const data = useObservable({
        friends: [] as string[],
        addFriend(favorite: boolean = false) {
            if (favorite === true) {
                data.friends.unshift(friendNameRef.current.value + " * ")
            } else {
                data.friends.push(friendNameRef.current.value)
            }
            friendNameRef.current.value = ""
        },
        get friendsCount() {
            return data.friends.length
        }
    })

    return (
        <div>
            <b>Count of friends: {data.friendsCount} </b>
            {data.friends.map(friend => (
                <div>{friend}</div>
            ))}
            <hr />
            <input ref={friendNameRef} />
            <button onClick={data.addFriend}>Add friend </button>
            <button onClick={() => data.addFriend(true)}>Add favorite friend</button>
        </div>
    )
})
```

[![Edit FriendlyComponent](https://codesandbox.io/static/img/play-codesandbox.svg)](https://codesandbox.io/s/jzj48v2xry?module=%2Fsrc%2FFriendlyComponent.tsx)

### `useObservable<T>(initialValue: T): T`

React hook that allows creating observable object within a component body and keeps track of it over renders. Gets all the benefits from [observable objects](https://mobx.js.org/refguide/object.html) including computed properties and methods. You can also use arrays, Map and Set.

Warning: With current implementation you also need to wrap your component to `observer`. It's also possible to have `useObserver` only in case you are not expecting rerender of the whole component.

```tsx
import { observer, useObservable, useObserver } from "mobx-react-lite"

const TodoList = () => {
    const todos = useObservable(new Map<string, boolean>())
    const todoRef = React.useRef()
    const addTodo = React.useCallback(() => {
        todos.set(todoRef.current.value, false)
        todoRef.current.value = ""
    }, [])
    const toggleTodo = React.useCallback((todo: string) => {
        todos.set(todo, !todos.get(todo))
    }, [])

    return useObserver(() => (
        <div>
            {Array.from(todos).map(([todo, done]) => (
                <div onClick={() => toggleTodo(todo)} key={todo}>
                    {todo}
                    {done ? " ✔" : " ⏲"}
                </div>
            ))}
            <input ref={todoRef} />
            <button onClick={addTodo}>Add todo</button>
        </div>
    ))
}
```

### `useDisposable<D extends TDisposable>(disposerGenerator: () => D, inputs: ReadonlyArray<any> = []): D`

The disposable is any kind of function that returns another function to be called on a component unmount to clean up used resources. Use MobX related functions like [`reaction`](https://mobx.js.org/refguide/reaction.html), [`autorun`](https://mobx.js.org/refguide/autorun.html), [`when`](https://mobx.js.org/refguide/when.html), [`observe`](https://mobx.js.org/refguide/observe.html), or anything else that returns a disposer.
Returns the generated disposer for early disposal.

Example (TypeScript):

```typescript
import { reaction } from "mobx"
import { observer, useComputed, useDisposable } from "mobx-react-lite"

const Name = observer((props: { firstName: string; lastName: string }) => {
    const fullName = useComputed(() => `${props.firstName} ${props.lastName}`, [
        props.firstName,
        props.lastName
    ])

    // when the name changes then send this info to the server
    useDisposable(() =>
        reaction(
            () => fullName,
            () => {
                // send this to some server
            }
        )
    )

    // render phase
    return `Your full name is ${props.firstName} ${props.lastName}`
})
```
