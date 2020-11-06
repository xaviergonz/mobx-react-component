import { cleanup, render } from "@testing-library/react"
// @ts-ignore
import gc from "expose-gc/function"
import * as mobx from "mobx"
import * as React from "react"
import { FinalizationRegistry } from "../src/shared/FinalizationRegistryWrapper"
import { useMobxObserver } from "../src/shared/useMobxObserver"
import { globalSetup, sleep } from "./utils"

globalSetup()

afterEach(cleanup)

test("uncommitted components should not leak observations", async () => {
    if (!FinalizationRegistry) {
        throw new Error("This test must run with node >= 14")
    }

    const store = mobx.observable({ count1: 0, count2: 0 })

    // Track whether counts are observed
    let count1IsObserved = false
    let count2IsObserved = false
    mobx.onBecomeObserved(store, "count1", () => (count1IsObserved = true))
    mobx.onBecomeUnobserved(store, "count1", () => (count1IsObserved = false))
    mobx.onBecomeObserved(store, "count2", () => (count2IsObserved = true))
    mobx.onBecomeUnobserved(store, "count2", () => (count2IsObserved = false))

    const TestComponent1 = () => useMobxObserver(() => <div>{store.count1}</div>)
    const TestComponent2 = () => useMobxObserver(() => <div>{store.count2}</div>)

    // Render, then remove only #2
    const rendering = render(
        <React.StrictMode>
            <TestComponent1 />
            <TestComponent2 />
        </React.StrictMode>
    )
    rendering.rerender(
        <React.StrictMode>
            <TestComponent1 />
        </React.StrictMode>
    )

    // Allow gc to kick in in case to let finalization registry cleanup
    gc()
    await sleep(50)

    // count1 should still be being observed by Component1,
    // but count2 should have had its reaction cleaned up.
    expect(count1IsObserved).toBeTruthy()
    expect(count2IsObserved).toBeFalsy()
})
