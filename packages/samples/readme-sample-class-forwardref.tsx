import { MobxComponent, mobxComponent } from "mobx-react-component"
import * as React from "react"

interface IMyComponentProps {
    children: React.ReactNode
}

class MyComponentClass extends MobxComponent<IMyComponentProps, HTMLButtonElement> {
    render() {
        const { ref, props } = this
        return <button ref={ref}>{props.children}</button>
    }
}

export const MyComponent = mobxComponent(MyComponentClass)

// You can now get a ref directly to the DOM button:
// const ref = React.createRef<HTMLButtonElement>();
// <MyComponent ref={ref}/>
