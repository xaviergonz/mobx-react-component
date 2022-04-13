import { act, cleanup, render } from "@testing-library/react"
import * as mobx from "mobx"
import * as React from "react"
import { createRoot } from "react-dom/client"
import {
    forceCleanupTimerToRunNowForTests,
    resetCleanupScheduleForTests,
} from "../src/shared/reactionCleanupTracking"
import {
    CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS,
    CLEANUP_TIMER_LOOP_MILLIS,
} from "../src/shared/reactionCleanupTrackingCommon"
import { useMobxObserver } from "../src/shared/useMobxObserver"
import "./killFinalizationRegistry"
import { globalSetup } from "./utils"

globalSetup()

afterEach(cleanup)

const maxSkip = Math.max(CLEANUP_LEAKED_REACTIONS_AFTER_MILLIS, CLEANUP_TIMER_LOOP_MILLIS)
jest.setTimeout(maxSkip * 2)

const sleep = (ms: number) =>
    new Promise<void>((resolve) =>
        setTimeout(() => {
            resolve()
            act(() => {
                // no-op, but triggers effect flushing
            })
        }, ms)
    )

test("uncommitted components should not leak observations", async () => {
    resetCleanupScheduleForTests()

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

    // Allow any reaction-disposal cleanup timers to run
    await sleep(maxSkip + 100)

    // count1 should still be being observed by Component1,
    // but count2 should have had its reaction cleaned up.
    expect(count1IsObserved).toBeTruthy()
    expect(count2IsObserved).toBeFalsy()
})

test("cleanup timer should not clean up recently-pended reactions", async () => {
    // If we're not careful with timings, it's possible to get the
    // following scenario:
    // 1. Component instance A is being created; it renders, we put its reaction R1 into the cleanup list
    // 2. Strict/Concurrent mode causes that render to be thrown away
    // 3. Component instance A is being created; it renders, we put its reaction R2 into the cleanup list
    // 4. The MobX reaction timer from 5 seconds ago kicks in and cleans up all reactions from uncommitted
    //    components, including R1 and R2
    // 5. The commit phase runs for component A, but reaction R2 has already been disposed. Game over.

    // This unit test attempts to replicate that scenario:
    resetCleanupScheduleForTests()

    const store = mobx.observable({ count: 0 })

    // Track whether the count is observed
    let countIsObserved = false
    mobx.onBecomeObserved(store, "count", () => (countIsObserved = true))
    mobx.onBecomeUnobserved(store, "count", () => (countIsObserved = false))

    const TestComponent1 = () => useMobxObserver(() => <div>{store.count}</div>)

    // We're going to render directly using ReactDOM, not react-testing-library, because we want
    // to be able to get in and do nasty things before everything (including useEffects) have completed,
    // and react-testing-library waits for all that, using act().

    const rootNode = document.createElement("div")
    const root = createRoot(rootNode)
    root.render(
        // We use StrictMode here, but it would be helpful to switch this to use real
        // concurrent mode: we don't have a true async render right now so this test
        // isn't as thorough as it could be.
        <React.StrictMode>
            <TestComponent1 />
        </React.StrictMode>
    )

    // We need to trigger our cleanup timer to run. We can't do this simply
    // by running all jest's faked timers as that would allow the scheduled
    // `useEffect` calls to run, and we want to simulate our cleanup timer
    // getting in between those stages.

    // We force our cleanup loop to run even though enough time hasn't _really_
    // elapsed.  In theory, it won't do anything because not enough time has
    // elapsed since the reactions were queued, and so they won't be disposed.
    forceCleanupTimerToRunNowForTests()

    // Advance time enough to allow any timer-queued effects to run
    await sleep(500)

    // count should still be observed
    expect(countIsObserved).toBeTruthy()
})
