export function handleObjectOrId(resource, objFunc) {
    const type = typeof resource;
    if (type === 'string') return resource;
    // @ts-ignore
    if (type === 'object') {
        if (resource._bsontype && resource._bsontype === 'ObjectID') return resource.toString();
        return objFunc(resource);
    }
}

export function getExceptionAsString(e) {
    return JSON.stringify({
        data: e.data,
        message: e.message || e.data.message,
        stack: e.stack || e.data.stack
    });
}

export default {
    handleObjectOrId,
    getExceptionAsString
}