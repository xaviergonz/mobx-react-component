const path = require("path")
const filesize = require("rollup-plugin-filesize")
const typescript = require("rollup-plugin-typescript2")
const commonjs = require("rollup-plugin-commonjs")
const resolve = require("rollup-plugin-node-resolve")
const { terser } = require("rollup-plugin-terser")
const alias = require("rollup-plugin-alias")
const replace = require("rollup-plugin-replace")
const { rollup } = require("rollup")

const emptyModulePath = path.resolve(__dirname, "empty.js")

function getExternals(target) {
    switch (target) {
        case "browser":
            return ["react", "mobx", "mobx-react", "react-dom"]
        case "native":
            return ["react", "mobx", "mobx-react", "react-native"]
        case "custom":
            return ["react", "mobx", "mobx-react"]
    }
}

async function build(target, mode, filename) {
    const plugins = [
        replace({
            // for depencencies such as react-is
            "process.env.NODE_ENV": JSON.stringify("production")
        }),
        alias({ "react-native": emptyModulePath }),
        typescript({
            tsconfig: "tsconfig.build.json",
            clean: true,
            check: true,
            useTsconfigDeclarationDir: true
        }),
        resolve({
            module: true,
            main: true
        }),
        commonjs()
    ]

    if (mode.endsWith(".min")) {
        plugins.push(terser())
    }

    plugins.push(filesize())

    const bundle = await rollup({
        input: "src/index.ts",
        external: getExternals(target),
        plugins: plugins
    })

    const options = {
        file: path.resolve(__dirname, "dist", filename),
        format: mode.endsWith(".min") ? mode.slice(0, -".min".length) : mode,
        globals: {
            react: "React",
            "react-dom": "ReactDOM",
            "react-native": "ReactNative",
            mobx: "mobx"
        },
        name: "mobxReact",
        exports: "named"
    }

    await bundle.write(options)
}

const main = async () => {
    await build("browser", "umd", "index.js")
    await build("browser", "umd.min", "index.min.js")
    await build("browser", "es", "index.module.js")
    await build("native", "cjs", "native.js")
    await build("custom", "umd", "custom.js")
    await build("custom", "es", "custom.module.js")
}

main()
