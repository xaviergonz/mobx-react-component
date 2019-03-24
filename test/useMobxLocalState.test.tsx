import { computed, reaction } from "mobx"
import { observer, useObserver } from "mobx-react"
import * as React from "react"
import { cleanup, render } from "react-testing-library"
import { MobxLocalState, useMobxLocalState } from "../src"
import { changesList } from "./utils"

afterEach(cleanup)

interface IProps {
    x: number
    y: number
    obj: {
        x: number
    }
}

let disposerCalled = 0

class MyState extends MobxLocalState<IProps> {
    constructor(readonly obsChanges: string[]) {
        super()
    }

    @computed
    get addXY() {
        return this.props.x + this.props.y
    }

    public effects = () => [
        reaction(
            () => this.props,
            () => {
                this.obsChanges.push("obsProps changed")
            }
        ),
        reaction(
            () => this.props.x,
            () => {
                this.obsChanges.push("obsProps.x changed")
            }
        ),
        reaction(
            () => this.props.y,
            () => {
                this.obsChanges.push("obsProps.y changed")
            }
        ),
        reaction(
            () => this.props.obj,
            () => {
                this.obsChanges.push("obsProps.obj changed")
            }
        ),
        reaction(
            () => this.props.obj.x,
            () => {
                this.obsChanges.push("obsProps.obj.x changed")
            }
        ),
        () => {
            disposerCalled++
        }
    ]
}

beforeEach(() => {
    disposerCalled = 0
})

it("with useObserver - deep", () => {
    let renders = 0
    const [obsChanges, expectObsChangesToBe] = changesList()

    const TestComponent = (props: IProps) => {
        const myState = useMobxLocalState(() => new MyState(obsChanges), props, {
            propsMode: "deep"
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
    expect(div.textContent).toBe("0-0 0-0 0 10")
    expectObsChangesToBe(["obsProps.obj.x changed"])
    expect(renders).toBe(3) // TODO: sadly this is double rendered

    // re-render with different props
    rerender(<TestComponent x={1} y={0} obj={obj} />)
    expect(div.textContent).toBe("1-1 0-0 1 10")
    expect(renders).toBe(5) // TODO: sadly this is double rendered
    expectObsChangesToBe(["obsProps.x changed"])

    // re-render with different props
    rerender(<TestComponent x={2} y={1} obj={obj} />)
    expect(div.textContent).toBe("2-2 1-1 3 10")
    expect(renders).toBe(7) // TODO: sadly this is double rendered
    expectObsChangesToBe(["obsProps.x changed", "obsProps.y changed"])

    // disposer must be called
    expect(disposerCalled).toBe(0)
    unmount()
    expect(disposerCalled).toBe(1)
})

it("with observer - shallow", () => {
    let renders = 0
    const [obsChanges, expectObsChangesToBe] = changesList()

    const TestComponent = observer((props: IProps) => {
        const myState = useMobxLocalState(() => new MyState(obsChanges), props, {
            propsMode: "shallow"
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
