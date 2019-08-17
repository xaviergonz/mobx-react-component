import { act, cleanup, render } from "@testing-library/react"
import hoistNonReactStatics from "hoist-non-react-statics"
import { action, computed, configure, observable, reaction, runInAction } from "mobx"
import * as React from "react"
import { injectContext, MobxComponent, mobxComponent } from "../src"
import { changesList } from "./utils"

configure({
    enforceActions: "always"
})

afterEach(cleanup)

interface IProps {
    x: number
    y: number
    obj: {
        x: number
    }
}

let renders = 0
function expectRendersToBe(n: number) {
    const r = renders
    renders = 0
    expect(r).toBe(n)
}

it("with props and effects", () => {
    const [obsChanges, expectObsChangesToBe] = changesList()

    let disposerCalled = 0

    @mobxComponent()
    class TestComponent extends MobxComponent<IProps> {
        @computed
        get addXY() {
            return this.props.x + this.props.y
        }

        getEffects() {
            return [
                reaction(
                    () => this.props,
                    () => {
                        obsChanges.push("obsProps changed")
                    }
                ),
                reaction(
                    () => this.props.x,
                    () => {
                        obsChanges.push("obsProps.x changed")
                    }
                ),
                reaction(
                    () => this.props.y,
                    () => {
                        obsChanges.push("obsProps.y changed")
                    }
                ),
                reaction(
                    () => this.props.obj,
                    () => {
                        obsChanges.push("obsProps.obj changed")
                    }
                ),
                reaction(
                    () => this.props.obj.x,
                    () => {
                        obsChanges.push("obsProps.obj.x changed")
                    }
                ),
                () => {
                    disposerCalled++
                }
            ]
        }

        render() {
            const { props } = this
            renders++
            return (
                <div>
                    {props.x}-{props.x} {props.y}-{props.y} {this.addXY} {props.obj.x}
                </div>
            )
        }
    }

    let obj = {
        x: 9
    }
    const { container, rerender, unmount } = render(<TestComponent x={0} y={0} obj={obj} />)
    const div = container.querySelector("div")!

    expect(div.textContent).toBe("0-0 0-0 0 9")
    expectRendersToBe(1)
    expectObsChangesToBe([])

    // re-render with same props, but change deep prop
    obj = {
        x: 10
    }
    rerender(<TestComponent x={0} y={0} obj={obj} />)
    expect(div.textContent).toBe("0-0 0-0 0 10")
    expectRendersToBe(1)
    expectObsChangesToBe(["obsProps.obj changed", "obsProps.obj.x changed"])

    // re-render with different props
    rerender(<TestComponent x={1} y={0} obj={obj} />)
    expect(div.textContent).toBe("1-1 0-0 1 10")
    expectRendersToBe(1)
    expectObsChangesToBe(["obsProps.x changed"])

    // re-render with different props
    rerender(<TestComponent x={2} y={1} obj={obj} />)
    expect(div.textContent).toBe("2-2 1-1 3 10")
    expectRendersToBe(1)
    expectObsChangesToBe(["obsProps.x changed", "obsProps.y changed"])

    // use an observable object
    obj = observable({
        x: 10
    })
    rerender(<TestComponent x={2} y={1} obj={obj} />)
    expect(div.textContent).toBe("2-2 1-1 3 10")
    expectRendersToBe(1)
    expectObsChangesToBe(["obsProps.obj changed"])

    // mutate an observable object
    act(() => {
        runInAction(() => {
            obj.x = 11
        })
    })
    // rerender(<TestComponent x={2} y={1} obj={obj} />) // no need to re-render
    expect(div.textContent).toBe("2-2 1-1 3 11")
    expectRendersToBe(1)
    expectObsChangesToBe(["obsProps.obj.x changed"])

    // disposer must be called
    expect(disposerCalled).toBe(0)
    unmount()
    expect(disposerCalled).toBe(1)
})

it("without props / effects", () => {
    @mobxComponent()
    class TestComponent extends MobxComponent {
        @observable
        x!: number

        constructor() {
            super()
            runInAction(() => {
                this.x = 10
            })
        }

        render() {
            const [s] = React.useState(5)
            return (
                <div>
                    {this.x} {s}
                </div>
            )
        }
    }

    const { container } = render(<TestComponent />)
    const div = container.querySelector("div")!

    expect(div.textContent).toBe("10 5")
})

it("ref works", () => {
    @mobxComponent({
        toObservablePropsMode: "shallow" // just to see this works
    })
    class TestComponent extends MobxComponent<{ forwardRef?: React.Ref<HTMLInputElement> }> {
        render() {
            const { forwardRef } = this.props
            return <input ref={forwardRef} />
        }
    }

    const inputRef = React.createRef<HTMLInputElement>()
    const cRef = React.createRef<TestComponent>()
    render(<TestComponent ref={cRef} forwardRef={inputRef} />)
    expect(inputRef.current instanceof HTMLInputElement).toBeTruthy()
    expect(cRef.current).toBeTruthy()
    expect(cRef.current!.render).toBeTruthy()
    expect(cRef.current instanceof TestComponent).toBeTruthy()
})

it("statics works", () => {
    interface IProps2 {
        x: number
    }

    @mobxComponent()
    class TestComponent extends MobxComponent<IProps2> {
        static defaultProps = {
            x: 5
        }
        static displayName = "My component"

        render() {
            const { props } = this
            return <div>{props.x}</div>
        }
    }
    expect(TestComponent.displayName).toBe("My component")

    const { container, rerender } = render(<TestComponent />)
    let div = container.querySelector("div")!
    expect(div.textContent).toBe("5")
    rerender(<TestComponent x={6} />)
    div = container.querySelector("div")!
    expect(div.textContent).toBe("6")
})

it("context injection", () => {
    const Context = React.createContext(5)
    const [obsChanges, expectObsChangesToBe] = changesList()

    @mobxComponent()
    class TestComponent extends MobxComponent {
        @injectContext(Context)
        contextValue!: number

        getEffects() {
            return [
                reaction(
                    () => this.contextValue,
                    v => {
                        obsChanges.push(`contextValue changed to ${v}`)
                    },
                    { fireImmediately: true }
                )
            ]
        }

        render() {
            renders++
            return <div>{this.contextValue}</div>
        }
    }

    const { container, rerender } = render(<TestComponent />)
    let div = container.querySelector("div")!

    expect(div.textContent).toBe("5")
    expectRendersToBe(1)
    expectObsChangesToBe(["contextValue changed to 5"]) // because of fire immediately

    rerender(
        <Context.Provider value={6}>
            <TestComponent />
        </Context.Provider>
    )
    div = container.querySelector("div")!
    expect(div.textContent).toBe("6")
    expectRendersToBe(1)
    expectObsChangesToBe(["contextValue changed to 6"])
})

it("actions", () => {
    @mobxComponent()
    class TestComponent extends MobxComponent {
        @observable
        x!: number

        constructor() {
            super()
            runInAction(() => {
                this.x = 1
            })
        }

        @action.bound
        incX() {
            this.x++
        }

        render() {
            return (
                <div>
                    <span>{this.x}</span>
                    <button onClick={this.incX}>Inc</button>
                </div>
            )
        }
    }

    const { container } = render(<TestComponent />)

    let span = container.querySelector("span")!
    expect(span.textContent).toBe("1")

    const button = container.querySelector("button")!
    button.click()

    span = container.querySelector("span")!
    expect(span.textContent).toBe("2")
})

it("works inside a HOC", () => {
    function hoc<T extends React.ComponentClass<P>, P>(WrappedComponent: T): T {
        class HOC extends React.Component<P> {
            render() {
                return <WrappedComponent {...(this.props as any)} />
            }
        }

        return hoistNonReactStatics(HOC, WrappedComponent) as any
    }

    @mobxComponent()
    class TestComponent extends MobxComponent<{ x: number }> {
        render() {
            return <span>{this.props.x}</span>
        }
    }

    const Wrapped = hoc(TestComponent)

    const { container } = render(<Wrapped x={1} />)
    const span = container.querySelector("span")!
    expect(span.textContent).toBe("1")
})
