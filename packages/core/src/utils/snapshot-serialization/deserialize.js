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
exports.deserializeSnapshot = deserializeSnapshot;
var constants_1 = require("./constants");
function deserializeSnapshot(data, options, context) {
    if (options === void 0) { options = {}; }
    var opts = __assign(__assign({}, constants_1.DEFAULT_DESERIALIZE_OPTIONS), options);
    var ctx = context || { registry: new Map(), options: opts };
    if (data === null || data === undefined)
        return data;
    if (typeof data === "boolean" ||
        typeof data === "number" ||
        typeof data === "string")
        return data;
    if (typeof data === "object") {
        var obj = data;
        // Handle plain arrays first (before other object types)
        // This handles plain arrays passed directly to deserializeSnapshot
        if (Array.isArray(obj) && !obj.__id && !obj.__type) {
            var result_1 = [];
            for (var _i = 0, _a = Object.keys(obj); _i < _a.length; _i++) {
                var key = _a[_i];
                var index = parseInt(key, 10);
                if (!isNaN(index)) {
                    result_1[index] = deserializeSnapshot(obj[key], opts, ctx);
                }
            }
            return result_1;
        }
        // Check for circular reference marker first (before special types)
        if ("__ref" in obj && typeof obj.__ref === "string") {
            var refId = obj.__ref;
            if (ctx.registry.has(refId))
                return ctx.registry.get(refId);
            var placeholder = {};
            ctx.registry.set(refId, placeholder);
            return placeholder;
        }
        // Special Types
        if (opts.restoreSpecialTypes && "__type" in obj) {
            // Check custom revivers first
            if (opts.customRevivers.has(String(obj.__type))) {
                return opts.customRevivers.get(String(obj.__type))(obj, ctx);
            }
            switch (obj.__type) {
                case "Date": {
                    if (!("value" in obj) || typeof obj.value !== "string") {
                        return undefined;
                    }
                    return new Date(obj.value);
                }
                case "RegExp": {
                    if (!("source" in obj) || typeof obj.source !== "string") {
                        return undefined;
                    }
                    var source = obj.source;
                    var flags = "flags" in obj ? String(obj.flags) : "";
                    return new RegExp(source, flags);
                }
                case "Map": {
                    if ("entries" in obj && Array.isArray(obj.entries)) {
                        var map = new Map();
                        for (var _b = 0, _c = obj.entries; _b < _c.length; _b++) {
                            var entry = _c[_b];
                            var k = deserializeSnapshot(entry[0], opts, ctx);
                            var v = deserializeSnapshot(entry[1], opts, ctx);
                            map.set(k, v);
                        }
                        return map;
                    }
                    return undefined;
                }
                case "Set": {
                    if ("values" in obj && Array.isArray(obj.values)) {
                        var set = new Set();
                        for (var _d = 0, _e = obj.values; _d < _e.length; _d++) {
                            var v = _e[_d];
                            set.add(deserializeSnapshot(v, opts, ctx));
                        }
                        return set;
                    }
                    return undefined;
                }
                case "BigInt": {
                    if (!("value" in obj) || typeof obj.value !== "string") {
                        return undefined;
                    }
                    return BigInt(obj.value);
                }
                case "Error": {
                    if ("message" in obj && "name" in obj) {
                        var name_1 = obj.name;
                        var message = obj.message;
                        var Ctor = (globalThis[name_1] || Error);
                        var err = new Ctor(message);
                        if ("stack" in obj)
                            err.stack = obj.stack;
                        return err;
                    }
                    return undefined;
                }
                case "Function":
                    return null;
                case "MaxDepthExceeded":
                    return { __maxDepthExceeded: obj.__message };
                case "Array": {
                    // Check if this is a circular reference marker
                    if (ctx.registry.has(obj.__id)) {
                        return ctx.registry.get(obj.__id);
                    }
                    var objId = obj.__id;
                    var result_2;
                    if (objId) {
                        // Array with __id (for circular references)
                        result_2 = [];
                        ctx.registry.set(objId, result_2);
                        if ("elements" in obj && Array.isArray(obj.elements)) {
                            // New format with 'elements' property
                            for (var i = 0; i < obj.elements.length; i++) {
                                result_2[i] = deserializeSnapshot(obj.elements[i], opts, ctx);
                            }
                        }
                        else {
                            // Fallback: populate from numeric keys
                            for (var _f = 0, _g = Object.keys(obj); _f < _g.length; _f++) {
                                var key = _g[_f];
                                var index = parseInt(key, 10);
                                if (!isNaN(index) && key !== "__id" && key !== "__type") {
                                    result_2[index] = deserializeSnapshot(obj[key], opts, ctx);
                                }
                            }
                        }
                    }
                    else {
                        // Plain array without __id (backward compatible)
                        result_2 = [];
                        for (var _h = 0, _j = Object.keys(obj); _h < _j.length; _h++) {
                            var key = _j[_h];
                            var index = parseInt(key, 10);
                            if (!isNaN(index)) {
                                result_2[index] = deserializeSnapshot(obj[key], opts, ctx);
                            }
                        }
                    }
                    return result_2;
                }
            }
        }
        else if (opts.customRevivers.has(String(obj.__type))) {
            // Even if restoreSpecialTypes is false, apply custom revivers
            return opts.customRevivers.get(String(obj.__type))(obj, ctx);
        }
        // Regular Objects with ID
        if ("__id" in obj && typeof obj.__id === "string") {
            var objId = obj.__id;
            if (ctx.registry.has(objId)) {
                var existing = ctx.registry.get(objId);
                if (existing && typeof existing === "object" && !Array.isArray(existing)) {
                    // Update existing placeholder with properties
                    var result_3 = existing;
                    var escapePrefix_1 = constants_1.DEFAULT_SERIALIZE_OPTIONS.escapePrefix;
                    for (var _k = 0, _l = Object.entries(obj); _k < _l.length; _k++) {
                        var _m = _l[_k], key = _m[0], value = _m[1];
                        if (key === "__id" || key === "__type")
                            continue;
                        var originalKey = key.startsWith(escapePrefix_1)
                            ? key.slice(escapePrefix_1.length)
                            : key;
                        result_3[originalKey] = deserializeSnapshot(value, opts, ctx);
                    }
                    return result_3;
                }
                return existing;
            }
            var result_4 = {};
            var typeName = obj.__type;
            if (opts.allowedConstructors.includes(typeName) &&
                typeName !== "Object") {
                var Ctor = globalThis[typeName];
                if (typeof Ctor === "function" && Ctor.prototype) {
                    result_4 = Object.create(Ctor.prototype);
                }
            }
            ctx.registry.set(objId, result_4);
            var escapePrefix = constants_1.DEFAULT_SERIALIZE_OPTIONS.escapePrefix;
            for (var _o = 0, _p = Object.entries(obj); _o < _p.length; _o++) {
                var _q = _p[_o], key = _q[0], value = _q[1];
                if (key === "__id" || key === "__type")
                    continue;
                var originalKey = key.startsWith(escapePrefix)
                    ? key.slice(escapePrefix.length)
                    : key;
                result_4[originalKey] = deserializeSnapshot(value, opts, ctx);
            }
            return result_4;
        }
        // Plain Objects
        var result = {};
        for (var _r = 0, _s = Object.entries(obj); _r < _s.length; _r++) {
            var _t = _s[_r], key = _t[0], value = _t[1];
            result[key] = deserializeSnapshot(value, opts, ctx);
        }
        return result;
    }
    return data;
}
