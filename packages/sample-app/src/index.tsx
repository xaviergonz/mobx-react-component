import * as React from "react"
import { render } from "react-dom"
import { MyComponent as ClassComponent } from "./class"
import { MyComponent as HooksComponent } from "./hooks"
import { SomeContext } from "./SomeContext"

function App() {
    const [x, setX] = React.useState(0)
    const [z, setZ] = React.useState(2)
    return (
        <React.Fragment>
            <SomeContext.Provider value={{ z }}>
                <h3>Hooks component</h3>
                <HooksComponent x={x} />

                <h3>Class component</h3>
                <ClassComponent x={x} />
            </SomeContext.Provider>
            <br />
            <br />
            <button onClick={() => setX(o => o + 1)}>Increment X (prop)</button>
            <br />
            <button onClick={() => setZ(o => o + 1)}>Increment Z (context)</button>
        </React.Fragment>
    )
}

const rootElement = document.getElementById("root")
render(<App />, rootElement)
