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
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.isSerializable = isSerializable;
exports.createSnapshotSerializer = createSnapshotSerializer;
exports.createSnapshotDeserializer = createSnapshotDeserializer;
exports.roundTripSnapshot = roundTripSnapshot;
exports.snapshotsEqual = snapshotsEqual;
var serialize_1 = require("./serialize");
var deserialize_1 = require("./deserialize");
var constants_1 = require("./constants");
/**
 * Deep equality check for serialized values
 * Handles special types like Date, RegExp, Map, Set, BigInt, etc.
 */
function deepEqualSerialized(a, b) {
    // Strict equality for primitives and same references
    if (a === b)
        return true;
    // Handle NaN separately (NaN !== NaN)
    if (typeof a === 'number' && typeof b === 'number' && isNaN(a) && isNaN(b)) {
        return true;
    }
    // Handle Infinity
    if (typeof a === 'number' && typeof b === 'number') {
        if (a === Infinity && b === Infinity)
            return true;
        if (a === -Infinity && b === -Infinity)
            return true;
        if (a === Infinity && b === -Infinity)
            return false;
        if (a === -Infinity && b === Infinity)
            return false;
    }
    // Handle null/undefined explicitly
    if (a === null || b === null)
        return a === b;
    if (a === undefined || b === undefined)
        return a === b;
    // Date comparison
    if (a instanceof Date && b instanceof Date) {
        return a.getTime() === b.getTime();
    }
    if (a instanceof Date || b instanceof Date) {
        return false;
    }
    // RegExp comparison
    if (a instanceof RegExp && b instanceof RegExp) {
        return a.source === b.source && a.flags === b.flags;
    }
    if (a instanceof RegExp || b instanceof RegExp) {
        return false;
    }
    // Map comparison
    if (a instanceof Map && b instanceof Map) {
        if (a.size !== b.size)
            return false;
        for (var _i = 0, a_1 = a; _i < a_1.length; _i++) {
            var _a = a_1[_i], k = _a[0], v = _a[1];
            if (!b.has(k))
                return false;
            if (!deepEqualSerialized(v, b.get(k)))
                return false;
        }
        return true;
    }
    if (a instanceof Map || b instanceof Map) {
        return false;
    }
    // Set comparison
    if (a instanceof Set && b instanceof Set) {
        if (a.size !== b.size)
            return false;
        var bValues = __spreadArray([], b, true);
        var _loop_1 = function (v) {
            if (!bValues.some(function (bv) { return deepEqualSerialized(v, bv); }))
                return { value: false };
        };
        for (var _b = 0, a_2 = a; _b < a_2.length; _b++) {
            var v = a_2[_b];
            var state_1 = _loop_1(v);
            if (typeof state_1 === "object")
                return state_1.value;
        }
        return true;
    }
    if (a instanceof Set || b instanceof Set) {
        return false;
    }
    // BigInt comparison
    if (typeof a === "bigint" && typeof b === "bigint") {
        return a === b;
    }
    if (typeof a === "bigint" || typeof b === "bigint") {
        return false;
    }
    // Error comparison
    if (a instanceof Error && b instanceof Error) {
        return a.name === b.name && a.message === b.message;
    }
    if (a instanceof Error || b instanceof Error) {
        return false;
    }
    // Array comparison
    if (Array.isArray(a) && Array.isArray(b)) {
        if (a.length !== b.length)
            return false;
        return a.every(function (val, i) { return deepEqualSerialized(val, b[i]); });
    }
    if (Array.isArray(a) || Array.isArray(b)) {
        return false;
    }
    // Object comparison
    if (typeof a === "object" && typeof b === "object" && a && b) {
        var keysA = Object.keys(a);
        var keysB = Object.keys(b);
        if (keysA.length !== keysB.length)
            return false;
        return keysA.every(function (key) { return deepEqualSerialized(a[key], b[key]); });
    }
    // Fallback to strict equality
    return a === b;
}
function isSerializable(value, options, depth, seen) {
    var _a;
    if (options === void 0) { options = {}; }
    if (depth === void 0) { depth = 0; }
    if (seen === void 0) { seen = new WeakSet(); }
    var opts = __assign(__assign({}, constants_1.DEFAULT_SERIALIZE_OPTIONS), options);
    // Primitives are always serializable regardless of depth
    if (value === null || value === undefined)
        return true;
    if (typeof value === "boolean" ||
        typeof value === "number" ||
        typeof value === "string")
        return true;
    if (typeof value === "bigint")
        return true;
    if (value instanceof Date ||
        value instanceof RegExp ||
        value instanceof Error)
        return true;
    // Check depth for containers that have children
    if (depth > opts.maxDepth)
        return false;
    if (value instanceof Map || value instanceof Set) {
        var items = value instanceof Map ? __spreadArray([], value.entries(), true).flat() : __spreadArray([], value.values(), true);
        return items.every(function (item) {
            return isSerializable(item, opts, depth + 1, seen);
        });
    }
    if (typeof value === "function")
        return true;
    if (typeof value === "object") {
        if (seen.has(value))
            return true;
        seen.add(value);
        try {
            if (Array.isArray(value)) {
                var result = value.every(function (item) {
                    return isSerializable(item, opts, depth + 1, seen);
                });
                seen.delete(value);
                return result;
            }
            var keys = Object.keys(value);
            for (var _i = 0, keys_1 = keys; _i < keys_1.length; _i++) {
                var key = keys_1[_i];
                if ((_a = opts.skipKeys) === null || _a === void 0 ? void 0 : _a.includes(key))
                    continue;
                var val = value[key];
                if (!isSerializable(val, opts, depth + 1, seen)) {
                    seen.delete(value);
                    return false;
                }
            }
            seen.delete(value);
            return true;
        }
        catch (_b) {
            seen.delete(value);
            return false;
        }
    }
    return false;
}
function createSnapshotSerializer(options) {
    if (options === void 0) { options = {}; }
    return function (obj) { return (0, serialize_1.snapshotSerialization)(obj, options); };
}
function createSnapshotDeserializer(options) {
    if (options === void 0) { options = {}; }
    return function (data) { return (0, deserialize_1.deserializeSnapshot)(data, options); };
}
function roundTripSnapshot(obj, serializeOptions, deserializeOptions) {
    if (serializeOptions === void 0) { serializeOptions = {}; }
    if (deserializeOptions === void 0) { deserializeOptions = {}; }
    var serialized = (0, serialize_1.snapshotSerialization)(obj, serializeOptions);
    return (0, deserialize_1.deserializeSnapshot)(serialized, deserializeOptions);
}
function snapshotsEqual(a, b, options) {
    if (options === void 0) { options = {}; }
    var serializedA = (0, serialize_1.snapshotSerialization)(a, options);
    var serializedB = (0, serialize_1.snapshotSerialization)(b, options);
    return deepEqualSerialized(serializedA, serializedB);
}
