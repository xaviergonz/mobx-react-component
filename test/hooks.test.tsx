import { configure, observable, reaction, runInAction } from "mobx"
import * as React from "react"
import { memo } from "react"
import { act, cleanup, render } from "react-testing-library"
import {
    getOriginalProps,
    mobxObserver,
    useMobxActions,
    useMobxEffects,
    useMobxObservable,
    useMobxObservableRefs
} from "../src"
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

    const TestComponent = memo(
        mobxObserver((props: IProps) => {
            const state = useMobxObservable(() =>
                observable({
                    get addXY() {
                        return props.x + props.y
                    }
                })
            )

            useMobxEffects(() => [
                reaction(
                    () => props,
                    () => {
                        obsChanges.push("obsProps changed")
                    }
                ),
                reaction(
                    () => props.x,
                    () => {
                        obsChanges.push("obsProps.x changed")
                    }
                ),
                reaction(
                    () => props.y,
                    () => {
                        obsChanges.push("obsProps.y changed")
                    }
                ),
                reaction(
                    () => props.obj,
                    () => {
                        obsChanges.push("obsProps.obj changed")
                    }
                ),
                reaction(
                    () => props.obj.x,
                    () => {
                        obsChanges.push("obsProps.obj.x changed")
                    }
                ),
                () => {
                    disposerCalled++
                }
            ])

            renders++
            return (
                <div>
                    {props.x}-{props.x} {props.y}-{props.y} {state.addXY} {props.obj.x}
                </div>
            )
        })
    )

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
    const TestComponent = memo(
        mobxObserver(() => {
            const state = useMobxObservable(() =>
                observable({
                    x: 10
                })
            )

            const [s] = React.useState(5)

            return (
                <div>
                    {state.x} {s}
                </div>
            )
        })
    )

    const { container } = render(<TestComponent />)
    const div = container.querySelector("div")!

    expect(div.textContent).toBe("10 5")
})

it("ref forwarding works", () => {
    const TestComponent = memo(
        React.forwardRef(
            mobxObserver((props: {}, ref: React.Ref<HTMLInputElement>) => {
                return <input ref={ref} />
            })
        )
    )

    const inputRef = React.createRef<HTMLInputElement>()
    render(<TestComponent ref={inputRef} />)
    expect(inputRef.current instanceof HTMLInputElement).toBeTruthy()
})

it("statics works", () => {
    interface IProps2 {
        x: number
    }

    const WrappedTestComponent = (props: IProps2) => {
        const obs = useMobxObservableRefs({
            props
        })

        return <div>{obs.props.x}</div>
    }
    WrappedTestComponent.defaultProps = {
        x: 5
    }

    const TestComponent = memo(mobxObserver(WrappedTestComponent))
    TestComponent.displayName = "My component"

    expect(TestComponent.displayName).toBe("My component")

    const { container, rerender } = render(<TestComponent />)
    let div = container.querySelector("div")!
    expect(div.textContent).toBe("5")
    rerender(<TestComponent x={6} />)
    div = container.querySelector("div")!
    expect(div.textContent).toBe("6")
})

it("actions", () => {
    const TestComponent = memo(
        mobxObserver(() => {
            const state = useMobxObservable(() =>
                observable({
                    x: 1
                })
            )

            const actions = useMobxActions(() => ({
                incX() {
                    state.x++
                }
            }))

            return (
                <div>
                    <span>{state.x}</span>
                    <button onClick={actions.incX}>Inc</button>
                </div>
            )
        })
    )

    const { container } = render(<TestComponent />)

    let span = container.querySelector("span")!
    expect(span.textContent).toBe("1")

    const button = container.querySelector("button")!
    button.click()

    span = container.querySelector("span")!
    expect(span.textContent).toBe("2")
})

it("original props are there", () => {
    interface IProps2 {
        x: number
    }

    const TestComponent = mobxObserver((props: IProps2) => {
        const originalProps = getOriginalProps(props)
        expect(props.x).toBe(originalProps.x)
        expect(props).not.toBe(originalProps)
        return null
    })

    render(<TestComponent x={5} />)
})
