import * as React from "react"
import { IMobxComponent, mobxComponent } from "../src"

interface IMyComponentProps {
    children: React.ReactNode
}

class MyComponentClass implements IMobxComponent<IMyComponentProps, HTMLButtonElement> {
    props!: IMyComponentProps

    render(props: IMyComponentProps, ref: React.Ref<HTMLButtonElement>) {
        return <button ref={ref}>{props.children}</button>
    }
}

export const MyComponent = mobxComponent(MyComponentClass)

// You can now get a ref directly to the DOM button:
// const ref = React.createRef<HTMLButtonElement>();
// <MyComponent ref={ref}/>
