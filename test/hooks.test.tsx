import { configure, observable, reaction, runInAction } from "mobx"
import * as React from "react"
import { memo } from "react"
import { act, cleanup, render } from "react-testing-library"
import { useMobxEffects, useMobxObservable, useMobxObsRefs, useMobxRender } from "../src"
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

    const TestComponent = memo((unobsProps: IProps) => {
        const obs = useMobxObsRefs({
            props: unobsProps
        })

        const state = useMobxObservable(() => ({
            get addXY() {
                return obs.props.x + obs.props.y
            }
        }))

        useMobxEffects(() => [
            reaction(
                () => obs.props,
                () => {
                    obsChanges.push("obsProps changed")
                }
            ),
            reaction(
                () => obs.props.x,
                () => {
                    obsChanges.push("obsProps.x changed")
                }
            ),
            reaction(
                () => obs.props.y,
                () => {
                    obsChanges.push("obsProps.y changed")
                }
            ),
            reaction(
                () => obs.props.obj,
                () => {
                    obsChanges.push("obsProps.obj changed")
                }
            ),
            reaction(
                () => obs.props.obj.x,
                () => {
                    obsChanges.push("obsProps.obj.x changed")
                }
            ),
            () => {
                disposerCalled++
            }
        ])

        return useMobxRender(() => {
            renders++
            return (
                <div>
                    {obs.props.x}-{obs.props.x} {obs.props.y}-{obs.props.y} {state.addXY}{" "}
                    {obs.props.obj.x}
                </div>
            )
        })
    })

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
    expectObsChangesToBe(["obsProps changed", "obsProps.obj changed", "obsProps.obj.x changed"])

    // re-render with different props
    rerender(<TestComponent x={1} y={0} obj={obj} />)
    expect(div.textContent).toBe("1-1 0-0 1 10")
    expectRendersToBe(1)
    expectObsChangesToBe(["obsProps changed", "obsProps.x changed"])

    // re-render with different props
    rerender(<TestComponent x={2} y={1} obj={obj} />)
    expect(div.textContent).toBe("2-2 1-1 3 10")
    expectRendersToBe(1)
    expectObsChangesToBe(["obsProps changed", "obsProps.x changed", "obsProps.y changed"])

    // use an observable object
    obj = observable({
        x: 10
    })
    rerender(<TestComponent x={2} y={1} obj={obj} />)
    expect(div.textContent).toBe("2-2 1-1 3 10")
    expectRendersToBe(1)
    expectObsChangesToBe(["obsProps changed", "obsProps.obj changed"])

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
    const TestComponent = memo(() => {
        const state = useMobxObservable(() => ({
            x: 10
        }))

        const [s] = React.useState(5)

        return useMobxRender(() => {
            return (
                <div>
                    {state.x} {s}
                </div>
            )
        })
    })

    const { container } = render(<TestComponent />)
    const div = container.querySelector("div")!

    expect(div.textContent).toBe("10 5")
})

it("ref forwarding works", () => {
    const TestComponent = memo(
        React.forwardRef((props: {}, ref: React.Ref<HTMLInputElement>) => {
            return useMobxRender(() => {
                return <input ref={ref} />
            })
        })
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
        const obs = useMobxObsRefs({
            props
        })

        return useMobxRender(() => {
            return <div>{obs.props.x}</div>
        })
    }
    WrappedTestComponent.defaultProps = {
        x: 5
    }

    const TestComponent = memo(WrappedTestComponent)
    TestComponent.displayName = "My component"

    expect(TestComponent.displayName).toBe("My component")

    const { container, rerender } = render(<TestComponent />)
    let div = container.querySelector("div")!
    expect(div.textContent).toBe("5")
    rerender(<TestComponent x={6} />)
    div = container.querySelector("div")!
    expect(div.textContent).toBe("6")
})
