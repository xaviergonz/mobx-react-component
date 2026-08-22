// based on https://github.com/mridgway/hoist-non-react-statics/blob/master/src/index.js
const hoistBlackList: Record<string, boolean> = {
    $$typeof: true,
    render: true,
    compare: true,
    type: true,
}

export function copyStaticProperties(base: any, target: any) {
    Object.keys(base).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(base, key) && !hoistBlackList[key]) {
            Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(base, key)!)
        }
    })
}
