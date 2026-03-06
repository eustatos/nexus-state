"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.snapshotSerialization = snapshotSerialization;
exports.serializeSnapshot = snapshotSerialization;
var constants_1 = require("./constants");
function snapshotSerialization(obj, options, context, depth, path) {
    if (options === void 0) { options = {}; }
    if (depth === void 0) { depth = 0; }
    if (path === void 0) { path = "root"; }
    var opts = __assign(__assign({}, constants_1.DEFAULT_SERIALIZE_OPTIONS), options);
    var ctx = context || {
        references: new Map(),
        serialized: new Map(),
        circularRefs: new Set(),
        nextId: 0,
        options: opts,
    };
    // Check depth for non-primitive types
    // Special case: maxDepth of 0 means allow root + direct children
    if (opts.maxDepth > 0 && depth > opts.maxDepth) {
        return {
            __type: "MaxDepthExceeded",
            __message: "Max depth ".concat(opts.maxDepth, " reached at path: ").concat(path),
        };
    }
    // Primitives are always returned directly, regardless of depth
    if (obj === null || obj === undefined)
        return obj;
    if (typeof obj === "boolean" ||
        typeof obj === "number" ||
        typeof obj === "string")
        return obj;
    if (typeof obj === "bigint")
        return { __type: "BigInt", value: obj.toString() };
    // Custom transformers
    if (obj.constructor) {
        var constructor = obj.constructor;
        if (opts.customTransformers.has(constructor)) {
            var transformer = opts.customTransformers.get(constructor);
            if (transformer)
                return transformer(obj, ctx);
        }
    }
    // Special Types (Date, RegExp, etc.)
    if (obj instanceof Date) {
        try {
            var isoString = obj.toISOString();
            return { __type: "Date", value: isoString };
        }
        catch (_a) {
            // Invalid Date - return a marker with the string representation
            return {
                __type: "Date",
                value: obj.toString(),
            };
        }
    }
    if (obj instanceof RegExp)
        return { __type: "RegExp", source: obj.source, flags: obj.flags };
    if (obj instanceof Map) {
        var entries = [];
        for (var _i = 0, _b = obj.entries(); _i < _b.length; _i++) {
            var _c = _b[_i], k = _c[0], v = _c[1];
            entries.push([
                snapshotSerialization(k, opts, ctx, depth + 1, "".concat(path, ".map_key")),
                snapshotSerialization(v, opts, ctx, depth + 1, "".concat(path, ".map_value")),
            ]);
        }
        return { __type: "Map", entries: entries };
    }
    if (obj instanceof Set) {
        var values = [];
        for (var _d = 0, _e = obj.values(); _d < _e.length; _d++) {
            var v = _e[_d];
            values.push(snapshotSerialization(v, opts, ctx, depth + 1, "".concat(path, ".set_value")));
        }
        return { __type: "Set", values: values };
    }
    if (obj instanceof Error) {
        return {
            __type: "Error",
            name: obj.name,
            message: obj.message,
            stack: opts.maxDepth > 0 ? obj.stack : undefined,
        };
    }
    if (typeof obj === "function") {
        return {
            __type: "Function",
            name: obj.name || "anonymous",
            source: obj.toString(),
        };
    }
    // Arrays (check for circular references first)
    if (Array.isArray(obj)) {
        // Check for circular references (self-reference)
        if (ctx.references.has(obj)) {
            var ref = ctx.references.get(obj);
            ctx.circularRefs.add(ref.id);
            return { __ref: ref.id };
        }
        // Register the array for circular reference tracking
        var refId = "arr_".concat(ctx.nextId++);
        var typeName = "Array";
        ctx.references.set(obj, {
            id: refId,
            type: typeName,
            path: path,
            createdAt: Date.now(),
        });
        // Serialize array elements
        var result = [];
        for (var index = 0; index < obj.length; index++) {
            var element = snapshotSerialization(obj[index], opts, ctx, depth + 1, "".concat(path, "[").concat(index, "]"));
            result[index] = element;
        }
        return result;
    }
    // Objects
    if (typeof obj === "object" && obj !== null) {
        if (ctx.references.has(obj)) {
            var ref = ctx.references.get(obj);
            ctx.circularRefs.add(ref.id);
            return { __ref: ref.id };
        }
        var refId = "obj_".concat(ctx.nextId++);
        var constructor = obj.constructor;
        var typeName = opts.preserveType
            ? ((constructor === null || constructor === void 0 ? void 0 : constructor.name) || "Object")
            : "Object";
        ctx.references.set(obj, {
            id: refId,
            type: typeName,
            path: path,
            createdAt: Date.now(),
        });
        var result = {
            __id: refId,
            __type: typeName,
        };
        for (var _f = 0, _g = Object.keys(obj); _f < _g.length; _f++) {
            var key = _g[_f];
            if (opts.skipKeys.includes(key))
                continue;
            var safeKey = key.startsWith("__") ? "".concat(opts.escapePrefix).concat(key) : key;
            try {
                var descriptor = Object.getOwnPropertyDescriptor(obj, key);
                // Check if this is an accessor (getter/setter)
                if (descriptor && (descriptor.get || descriptor.set)) {
                    // Accessor property - might throw
                    try {
                        var value = obj[key];
                        result[safeKey] = snapshotSerialization(value, opts, ctx, depth + 1, "".concat(path, ".").concat(key));
                    }
                    catch (err) {
                        // Store error info without re-accessing the getter
                        result[safeKey] = {
                            __error: "Serialization failed - getter threw error",
                            __originalType: "unknown",
                            __value: "Error: getter threw error",
                        };
                    }
                }
                else {
                    // Regular data property
                    var value = obj[key];
                    result[safeKey] = snapshotSerialization(value, opts, ctx, depth + 1, "".concat(path, ".").concat(key));
                }
            }
            catch (err) {
                result[safeKey] = {
                    __error: "Serialization failed",
                    __originalType: typeof obj[key],
                    __value: String(obj[key]),
                };
            }
        }
        return result;
    }
    return {
        __error: "Unknown type",
        __originalType: typeof obj,
        __value: String(obj),
    };
}
