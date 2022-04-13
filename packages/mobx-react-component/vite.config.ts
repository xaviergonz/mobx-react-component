import path from "path"
import typescript2 from "rollup-plugin-typescript2"
import { defineConfig } from "vite"

const resolvePath = (str: string) => path.resolve(__dirname, str)

export default defineConfig({
    build: {
        target: "node10",
        lib: {
            entry: resolvePath("./src/index.ts"),
            name: "mobxReactComponent",
        },
        sourcemap: "inline",
        minify: false,
        rollupOptions: {
            external: ["mobx", "react", "react-dom"],
            output: {
                globals: {
                    mobx: "mobx",
                    react: "React",
                    "react-dom": "ReactDOM",
                },
            },
        },
    },
    plugins: [{ ...typescript2({}), apply: "build", enforce: "pre" }],
})
