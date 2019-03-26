import * as mobx from "mobx"
import { configure } from "mobx"
import { useObserver } from "mobx-react-lite"
import * as React from "react"
import { memo, useState } from "react"
import { act, cleanup, render } from "react-testing-library"
import { updateableObservable, UpdateableObservableMode } from "../src"
import { useForceUpdate, useSkippingForceUpdate } from "../src/utils"

configure({
    enforceActions: "always"
})

function useComputed<T>(func: () => T, inputs: ReadonlyArray<any> = []) {
    const computed = React.useMemo(() => mobx.computed(func), inputs)
    return () => computed.get()
}

function toJson(val: any): string {
    if (val instanceof Map) {
        return JSON.stringify([...val])
    }
    return JSON.stringify(val)
}

function doTest(options: UpdateableObservableMode<any>) {
    describe(`options: ${JSON.stringify(options)}`, () => {
        const shallow = options === "shallow"

        let computedCalls: string[] = []
        let renders!: number

        let rerender: (ui: React.ReactElement<any>) => void
        beforeAll(() => {
            cleanup()
            const ret = render(<div />)
            rerender = ret.rerender
        })

        beforeEach(() => {
            computedCalls = []
            renders = 0
        })

        const Component = memo((nonObsProps: any) => {
            const [obsProps] = useState(() => updateableObservable<any>(undefined, options))
            useSkippingForceUpdate(() => {
                obsProps.update(nonObsProps)
            })
            const props = obsProps.get()

            const computedWithProp1 = useComputed(() => {
                const prop1Value = props.prop1
                computedCalls.push("prop1: " + toJson(prop1Value))
                return prop1Value
            })

            const computedWithProp2 = useComputed(() => {
                const prop2Value = props.prop2
                computedCalls.push("prop2: " + toJson(prop2Value))
                return prop2Value
            })

            const deepComputed = useComputed(() => {
                const prop3Value = props.prop3 && props.prop3.x
                computedCalls.push("prop3.x: " + toJson(prop3Value))
                return prop3Value
            })

            const computedComponent = useComputed(() => {
                const value = props.componentProp
                computedCalls.push("componentProp: " + toJson(!!value))
                return value
            })

            // render
            return useObserver(
                () => {
                    const p1 = computedWithProp1()
                    toJson(p1) // just to deeply read it
                    const p2 = computedWithProp2()
                    const deepC = deepComputed()
                    const str = `${p1} ${p2} ${deepC}`

                    renders++
                    return computedComponent() || props.children || str
                },
                undefined,
                {
                    useForceUpdate
                }
            )
        })

        it("initial state", () => {
            rerender(<Component prop1={1} />)
            expect(computedCalls).toEqual([
                "prop1: 1",
                "prop2: undefined",
                "prop3.x: undefined",
                "componentProp: false"
            ])
            expect(renders).toBe(1)
        })

        it("prop1 changed from 1 to 2, prop2 is untouched", () => {
            rerender(<Component prop1={2} />)
            expect(computedCalls).toEqual(["prop1: 2"])
            expect(renders).toBe(1)
        })

        it("props untouched, unobserved property added", () => {
            rerender(<Component prop1={2} unused={10} />)
            expect(computedCalls).toEqual([])
            expect(renders).toBe(1) // TODO: wish this could be optimized to avoid the unecessary re-render
        })

        it("props untouched, unobserved property removed", () => {
            rerender(<Component prop1={2} />)
            expect(computedCalls).toEqual([])
            expect(renders).toBe(1) // TODO: wish this could be optimized to avoid the unecessary re-render
        })

        it("prop1 is untouched, prop2 appears", () => {
            rerender(<Component prop1={2} prop2={1} />)
            expect(computedCalls).toEqual(["prop2: 1"])
            expect(renders).toBe(1)
        })

        it("prop1 is untouched, prop2 changes from 1 to 2", () => {
            rerender(<Component prop1={2} prop2={2} />)
            expect(computedCalls).toEqual(["prop2: 2"])
            expect(renders).toBe(1)
        })

        it("prop2 is untouched, prop1 changes from 2 to 1", () => {
            rerender(<Component prop1={1} prop2={2} />)
            expect(computedCalls).toEqual(["prop1: 1"])
            expect(renders).toBe(1)
        })

        it("nothing changed - no recalc", () => {
            rerender(<Component prop1={1} prop2={2} />)
            expect(computedCalls).toEqual([])
            expect(renders).toBe(0) // no re-render needed
        })

        it("prop1 disappear, prop2 is untouched", () => {
            rerender(<Component prop2={2} />)
            expect(computedCalls).toEqual(["prop1: undefined"])
            expect(renders).toBe(1)
        })

        it("if we replace prop2 to prop1, both computeds should be recalculated", () => {
            rerender(<Component prop1={2} />)
            expect(computedCalls).toEqual(["prop1: 2", "prop2: undefined"])
            expect(renders).toBe(1)
        })

        it("remove prop1 should only recalc prop1", () => {
            rerender(<Component />)
            expect(computedCalls).toEqual(["prop1: undefined"])
            expect(renders).toBe(1)
        })

        it("correctly catch prop1 appearing after disappearing", () => {
            rerender(<Component prop1={2} />)
            expect(computedCalls).toEqual(["prop1: 2"])
            expect(renders).toBe(1)
        })

        it("swap again - all recalculated", () => {
            rerender(<Component prop2={2} />)
            expect(computedCalls).toEqual(["prop1: undefined", "prop2: 2"])
            expect(renders).toBe(1)
        })

        it("remove all", () => {
            rerender(<Component />)
            expect(computedCalls).toEqual(["prop2: undefined"])
            expect(renders).toBe(1)
        })

        // already observable objects
        const dp = mobx.observable({})

        it("(obs object) deep prop with empty object", () => {
            rerender(<Component prop3={dp} />)
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1) // TODO: wish this could be optimized to avoid the unecessary re-render
        })

        it("(obs object) deep prop with value set", () => {
            act(() => {
                mobx.runInAction(() => {
                    mobx.set(dp, "x", 5)
                })
            })
            rerender(<Component prop3={dp} />)
            expect(computedCalls).toEqual(["prop3.x: 5"])
            expect(renders).toBe(1)
        })

        it("(obs object) deep prop with value removed", () => {
            act(() => {
                mobx.runInAction(() => {
                    mobx.remove(dp, "x")
                })
            })
            rerender(<Component prop3={dp} />)
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1)
        })

        // non observable objects
        it("(new obj) deep prop with empty object", () => {
            rerender(<Component prop3={{}} />)
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1) // TODO: wish this could be optimized to avoid the unecessary re-render
        })

        it("(new obj) deep prop with value set", () => {
            rerender(<Component prop3={{ x: 5, y: { z: [6] }, m: new Map([[1, 2]]) }} />)
            expect(computedCalls).toEqual(["prop3.x: 5"])
            expect(renders).toBe(1)
        })

        it("(new obj) deep prop with value set to the same one as before", () => {
            rerender(<Component prop3={{ x: 5, y: { z: [6] }, m: new Map([[1, 2]]) }} />)
            expect(computedCalls).toEqual(shallow ? ["prop3.x: 5"] : [])
            expect(renders).toBe(1) // TODO: wish this could be optimized to avoid the unecessary re-render
        })

        it("(new obj) deep prop with value removed", () => {
            rerender(<Component prop3={{}} />)
            expect(computedCalls).toEqual(["prop3.x: undefined"])
            expect(renders).toBe(1)
        })

        // component and children
        it("passing a component works", () => {
            let innerRenders = 0
            function InnerC() {
                innerRenders++
                return null
            }
            rerender(<Component componentProp={<InnerC />} />)
            expect(innerRenders).toBe(1)
            expect(computedCalls).toEqual(["prop3.x: undefined", "componentProp: true"])
            expect(renders).toBe(1)
        })

        it("passing a children component works", () => {
            let innerRenders = 0
            function InnerC() {
                innerRenders++
                return null
            }
            rerender(
                <Component>
                    <InnerC />
                </Component>
            )
            expect(innerRenders).toBe(1)
            expect(computedCalls).toEqual(["componentProp: false"])
            expect(renders).toBe(1)
        })

        // array
        it("array", () => {
            rerender(<Component prop1={[1, 2]} />)
            expect(computedCalls).toEqual(["prop1: [1,2]"])
            expect(renders).toBe(1)
        })

        it("array (same)", () => {
            rerender(<Component prop1={[1, 2]} />)
            expect(computedCalls).toEqual(shallow ? ["prop1: [1,2]"] : [])
            expect(renders).toBe(shallow ? 1 : 1) // should be 1 : 0, but since a prop changed...
        })

        it("array (mutate)", () => {
            rerender(<Component prop1={[1, 3]} />)
            expect(computedCalls).toEqual(["prop1: [1,3]"])
            expect(renders).toBe(1)
        })

        it("array (add item)", () => {
            rerender(<Component prop1={[1, 2, 3]} />)
            expect(computedCalls).toEqual(["prop1: [1,2,3]"])
            expect(renders).toBe(1)
        })

        it("array (remove item)", () => {
            rerender(<Component prop1={[1, 2]} />)
            expect(computedCalls).toEqual(["prop1: [1,2]"])
            expect(renders).toBe(1)
        })

        // map
        it("map", () => {
            rerender(<Component prop1={new Map([[1, 1], [2, 2]])} />)
            expect(computedCalls).toEqual(
                shallow ? ["prop1: [[1,1],[2,2]]"] : ['prop1: {"1":1,"2":2}']
            )
            expect(renders).toBe(1)
        })

        it("map (same)", () => {
            rerender(<Component prop1={new Map([[1, 1], [2, 2]])} />)
            expect(computedCalls).toEqual(shallow ? ["prop1: [[1,1],[2,2]]"] : [])
            expect(renders).toBe(shallow ? 1 : 1) // should be 1 : 0, but since a prop changed...
        })

        it("map (mutate)", () => {
            rerender(<Component prop1={new Map([[1, 1], [3, 3]])} />)
            expect(computedCalls).toEqual(
                shallow ? ["prop1: [[1,1],[3,3]]"] : ['prop1: {"1":1,"3":3}']
            )
            expect(renders).toBe(1)
        })

        it("map (add item)", () => {
            rerender(<Component prop1={new Map([[1, 1], [2, 2], [3, 3]])} />)
            expect(computedCalls).toEqual(
                shallow ? ["prop1: [[1,1],[2,2],[3,3]]"] : ['prop1: {"1":1,"2":2,"3":3}']
            )
            expect(renders).toBe(1)
        })

        it("map (remove item)", () => {
            rerender(<Component prop1={new Map([[1, 1], [2, 2]])} />)
            expect(computedCalls).toEqual(
                shallow ? ["prop1: [[1,1],[2,2]]"] : ['prop1: {"1":1,"2":2}']
            )
            expect(renders).toBe(1)
        })
    })
}

doTest("shallow")
doTest("deep")
