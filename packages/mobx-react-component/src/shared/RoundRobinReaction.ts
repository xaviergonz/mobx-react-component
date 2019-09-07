import { Reaction } from "mobx"

const emptyFn = () => {
    // do nothing
}

export class RoundRobinReaction {
    private reactions?: [Reaction, Reaction]
    private current: 0 | 1 = 1

    get currentReaction() {
        return this.reactions ? this.reactions[this.current] : undefined
    }

    constructor(
        private readonly reactionName: string,
        private readonly run: () => any,
        private isForceUpdateEnabled: () => boolean
    ) {}

    private createReactionsIfNeeded() {
        if (this.reactions) {
            return
        }

        const run = this.run

        const reaction1 = new Reaction(this.reactionName, () => {
            if (this.current === 0 && this.isForceUpdateEnabled()) {
                run()
            }
        })
        const reaction2 = new Reaction(this.reactionName, () => {
            if (this.current === 1 && this.isForceUpdateEnabled()) {
                run()
            }
        })

        this.reactions = [reaction1, reaction2]
    }

    track<T>(fn: () => T): T {
        this.createReactionsIfNeeded()

        const oldReaction = this.currentReaction!
        this.current = ((this.current + 1) % 2) as 0 | 1 // swap current reaction
        const reaction = this.currentReaction!

        let result!: T
        reaction.track(() => {
            result = fn()
        })

        // clear dependencies of old reaction
        oldReaction.track(emptyFn)

        return result
    }

    dispose() {
        if (this.reactions) {
            for (let i = 0; i < 2; i++) {
                this.reactions[i].dispose()
            }
            this.reactions = undefined
        }
    }
}
