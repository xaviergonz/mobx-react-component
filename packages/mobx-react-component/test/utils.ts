import { configure } from "mobx"
import { unstable_batchedUpdates } from "react-dom"
import { optimizeScheduler } from "../src"

export function changesList(): [string[], (newChanges: string[]) => void] {
    const changes: string[] = []
    function expectChangesToBe(newChanges: string[]) {
        try {
            expect(changes).toEqual(newChanges)
        } finally {
            changes.length = 0
        }
    }
    return [changes, expectChangesToBe]
}

export function globalSetup() {
    optimizeScheduler(unstable_batchedUpdates)
    configure({ enforceActions: "never" })
}
