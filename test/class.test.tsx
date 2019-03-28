import { action, computed, configure, observable, reaction, runInAction } from "mobx"
import * as React from "react"
import { PropsWithChildren } from "react"
import { act, cleanup, render } from "react-testing-library"
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
    expect(n).toBe(r)
}

it("with props and effects", () => {
    const [obsChanges, expectObsChangesToBe] = changesList()

    let disposerCalled = 0

    class MyComponent extends MobxComponent<IProps> {
        @computed
        get addXY() {
            return this.props.x + this.props.y
        }

        fx_1 = () =>
            reaction(
                () => this.props,
                () => {
                    obsChanges.push("obsProps changed")
                }
            )
        fx_2 = () =>
            reaction(
                () => this.props.x,
                () => {
                    obsChanges.push("obsProps.x changed")
                }
            )
        fx_3 = () =>
            reaction(
                () => this.props.y,
                () => {
                    obsChanges.push("obsProps.y changed")
                }
            )
        fx_4 = () =>
            reaction(
                () => this.props.obj,
                () => {
                    obsChanges.push("obsProps.obj changed")
                }
            )
        fx_5 = () =>
            reaction(
                () => this.props.obj.x,
                () => {
                    obsChanges.push("obsProps.obj.x changed")
                }
            )
        fx_6 = () => () => {
            disposerCalled++
        }

        render(props: PropsWithChildren<IProps>) {
            renders++
            return (
                <div>
                    {props.x}-{props.x} {props.y}-{props.y} {this.addXY} {props.obj.x}
                </div>
            )
        }
    }

    const TestComponent = mobxComponent(MyComponent)

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
    class MyComponent extends MobxComponent {
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

    const TestComponent = mobxComponent(MyComponent)

    const { container } = render(<TestComponent />)
    const div = container.querySelector("div")!

    expect(div.textContent).toBe("10 5")
})

it("ref forwarding works", () => {
    class C extends MobxComponent<{}, HTMLInputElement> {
        render(props: {}, ref: React.Ref<HTMLInputElement>) {
            return <input ref={ref} />
        }
    }
    const TestComponent = mobxComponent(C)

    const inputRef = React.createRef<HTMLInputElement>()
    render(<TestComponent ref={inputRef} />)
    expect(inputRef.current instanceof HTMLInputElement).toBeTruthy()
})

it("statics works", () => {
    interface IProps2 {
        x: number
    }

    class C extends MobxComponent<IProps2> {
        render(props: IProps2) {
            return <div>{props.x}</div>
        }
    }
    const TestComponent = mobxComponent(C, {
        defaultProps: {
            x: 5
        },
        displayName: "My component"
    })
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

    class C extends MobxComponent {
        @injectContext(Context)
        contextValue!: number

        fx_context() {
            return reaction(
                () => this.contextValue,
                v => {
                    obsChanges.push(`contextValue changed to ${v}`)
                },
                { fireImmediately: true }
            )
        }

        render() {
            renders++
            return <div>{this.contextValue}</div>
        }
    }
    const TestComponent = mobxComponent(C)

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
    class MyComponent extends MobxComponent {
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
    const TestComponent = mobxComponent(MyComponent)

    const { container } = render(<TestComponent />)

    let span = container.querySelector("span")!
    expect(span.textContent).toBe("1")

    const button = container.querySelector("button")!
    button.click()

    span = container.querySelector("span")!
    expect(span.textContent).toBe("2")
})
