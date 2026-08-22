import { expect } from "@jest/globals"
import { configure } from "mobx"
import { act } from "react"

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
    configure({ enforceActions: "never" })
}

export function sleep(time: number) {
    return new Promise<void>((res) => {
        setTimeout(() => {
            act(() => res())
        }, time)
    })
}
