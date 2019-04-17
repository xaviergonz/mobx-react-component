import { MobxComponent, mobxComponent } from "mobx-react-component"

@mobxComponent()
class MyComponent extends MobxComponent<{}> {
    someMethod() {
        // some imperative method
    }

    render() {
        return null
    }
}

// You can now get a ref to the class instance:
// const ref = React.createRef<MyComponent>();
// <MyComponent ref={ref}/>
// ref.current.someMethod()
