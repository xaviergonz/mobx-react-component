import * as React from "react"
import { MobxComponent, mobxComponent } from "../src"

interface IMyComponentProps {
    children: React.ReactNode
}

class MyComponentClass extends MobxComponent<IMyComponentProps, HTMLButtonElement> {
    render(props: IMyComponentProps, ref: React.Ref<HTMLButtonElement>) {
        return <button ref={ref}>{props.children}</button>
    }
}

const MyComponent = mobxComponent(MyComponentClass)

// You can now get a ref directly to the DOM button:
// const ref = React.createRef<HTMLButtonElement>();
// <MyComponent ref={ref}/>
