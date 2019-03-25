import { computed, configure, observable, reaction, runInAction } from "mobx"
import { observer, useObserver } from "mobx-react"
import * as React from "react"
import { cleanup, render } from "react-testing-library"
import { Effects, injectedProperty, useMobxLocalState } from "../src"
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

describe("state with props and effects", () => {
    it("with useObserver - deep - classes", () => {
        let renders = 0
        const [obsChanges, expectObsChangesToBe] = changesList()
        let disposerCalled = 0

        class MyState {
            props = injectedProperty<IProps>("deep")

            @computed
            get addXY() {
                return this.props.x + this.props.y
            }

            effects: Effects = () => [
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

        const TestComponent = (props: IProps) => {
            const myState = useMobxLocalState(() => new MyState(), {
                props
            })

            renders++
            return useObserver(() => (
                <div>
                    {props.x}-{myState.props.x} {props.y}-{myState.props.y} {myState.addXY}{" "}
                    {myState.props.obj.x}
                </div>
            ))
        }
        const obj = {
            x: 9
        }
        const { container, rerender, unmount } = render(<TestComponent x={0} y={0} obj={obj} />)
        const div = container.querySelector("div")!

        expect(div.textContent).toBe("0-0 0-0 0 9")
        expect(renders).toBe(1)
        expectObsChangesToBe([])

        // re-render with same props, but change deep prop
        obj.x = 10
        rerender(<TestComponent x={0} y={0} obj={obj} />)
        expectObsChangesToBe(["obsProps.obj.x changed"]) // change is found since we are in deep mode
        expect(div.textContent).toBe("0-0 0-0 0 10")
        expect(renders).toBe(3) // TODO: sadly this is double rendered

        // re-render with different props
        rerender(<TestComponent x={1} y={0} obj={obj} />)
        expect(div.textContent).toBe("1-1 0-0 1 10")
        expectObsChangesToBe(["obsProps.x changed"])
        expect(renders).toBe(5) // TODO: sadly this is double rendered

        // re-render with different props
        rerender(<TestComponent x={2} y={1} obj={obj} />)
        expect(div.textContent).toBe("2-2 1-1 3 10")
        expectObsChangesToBe(["obsProps.x changed", "obsProps.y changed"])
        expect(renders).toBe(7) // TODO: sadly this is double rendered

        // disposer must be called
        expect(disposerCalled).toBe(0)
        unmount()
        expect(disposerCalled).toBe(1)
    })

    it("with observer - shallow - objects", () => {
        let renders = 0
        const [obsChanges, expectObsChangesToBe] = changesList()
        let disposerCalled = 0

        const newMyState = () =>
            observable({
                props: injectedProperty<IProps>("shallow"),

                get addXY() {
                    return this.props.x + this.props.y
                },

                effects() {
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
            })

        const TestComponent = observer((props: IProps) => {
            const myState = useMobxLocalState(() => newMyState(), {
                props
            })

            renders++
            return (
                <div>
                    {props.x}-{myState.props.x} {props.y}-{myState.props.y} {myState.addXY}{" "}
                    {myState.props.obj.x}
                </div>
            )
        })
        const obj = {
            x: 9
        }
        const { container, rerender, unmount } = render(<TestComponent x={0} y={0} obj={obj} />)
        const div = container.querySelector("div")!

        expect(div.textContent).toBe("0-0 0-0 0 9")
        expect(renders).toBe(1)
        expectObsChangesToBe([])

        // re-render with same props, but change deep prop
        obj.x = 10
        rerender(<TestComponent x={0} y={0} obj={obj} />)
        expect(div.textContent).toBe("0-0 0-0 0 9") // 9 since memo will prevent the re-render at all
        expect(renders).toBe(1)
        expectObsChangesToBe([])

        // re-render with different props
        rerender(<TestComponent x={1} y={0} obj={obj} />)
        expect(div.textContent).toBe("1-1 0-0 1 10")
        expect(renders).toBe(3) // TODO: sadly this is double rendered
        expectObsChangesToBe(["obsProps.x changed"])

        // re-render with different props
        rerender(<TestComponent x={2} y={1} obj={obj} />)
        expect(div.textContent).toBe("2-2 1-1 3 10")
        expect(renders).toBe(5) // TODO: sadly this is double rendered
        expectObsChangesToBe(["obsProps.x changed", "obsProps.y changed"])

        // disposer must be called
        expect(disposerCalled).toBe(0)
        unmount()
        expect(disposerCalled).toBe(1)
    })
})

it("state without props and effects", () => {
    class MyState {
        @observable
        x!: number

        constructor() {
            runInAction(() => {
                this.x = 10
            })
        }
    }

    const TestComponent = observer(() => {
        const myState = useMobxLocalState(() => new MyState())

        return <div>{myState.x}</div>
    })

    const { container } = render(<TestComponent />)
    const div = container.querySelector("div")!

    expect(div.textContent).toBe("10")
})
