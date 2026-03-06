"use strict";
/**
 * Debug logger that only works in development
 * @packageDocumentation
 */
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var _a, _b, _c;
Object.defineProperty(exports, "__esModule", { value: true });
exports.DebugLogger = exports.reactLogger = exports.atomLogger = exports.storeLogger = exports.logger = void 0;
// Check for multiple possible environments
var isTest = typeof process !== 'undefined' && ((_a = process.env) === null || _a === void 0 ? void 0 : _a.NODE_ENV) === 'test';
var isBenchmark = typeof process !== 'undefined' && ((_b = process.env) === null || _b === void 0 ? void 0 : _b.BENCHMARK) === 'true';
var DEBUG = typeof process !== 'undefined' &&
    ((_c = process.env) === null || _c === void 0 ? void 0 : _c.NODE_ENV) !== 'production' &&
    !isTest &&
    !isBenchmark;
/**
 * Debug logger class with conditional logging based on environment
 */
var DebugLogger = /** @class */ (function () {
    function DebugLogger(prefix) {
        if (prefix === void 0) { prefix = '[Nexus]'; }
        this.enabled = DEBUG;
        this.prefix = prefix;
    }
    DebugLogger.prototype.format = function (level) {
        var args = [];
        for (var _i = 1; _i < arguments.length; _i++) {
            args[_i - 1] = arguments[_i];
        }
        if (!this.enabled)
            return;
        var timestamp = new Date().toISOString().split('T')[1].slice(0, -1);
        console[level].apply(console, __spreadArray(["".concat(this.prefix, "[").concat(timestamp, "]")], args, false));
    };
    DebugLogger.prototype.log = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.format.apply(this, __spreadArray(['log'], args, false));
    };
    DebugLogger.prototype.warn = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.format.apply(this, __spreadArray(['warn'], args, false));
    };
    DebugLogger.prototype.error = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.format.apply(this, __spreadArray(['error'], args, false));
    };
    DebugLogger.prototype.info = function () {
        var args = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            args[_i] = arguments[_i];
        }
        this.format.apply(this, __spreadArray(['info'], args, false));
    };
    DebugLogger.prototype.group = function (label) {
        if (!this.enabled)
            return;
        console.group("".concat(this.prefix, " ").concat(label));
    };
    DebugLogger.prototype.groupEnd = function () {
        if (!this.enabled)
            return;
        console.groupEnd();
    };
    DebugLogger.prototype.enable = function () {
        this.enabled = true;
    };
    DebugLogger.prototype.disable = function () {
        this.enabled = false;
    };
    DebugLogger.prototype.isEnabled = function () {
        return this.enabled;
    };
    return DebugLogger;
}());
exports.DebugLogger = DebugLogger;
exports.logger = new DebugLogger('[Nexus]');
exports.storeLogger = new DebugLogger('[Nexus:Store]');
exports.atomLogger = new DebugLogger('[Nexus:Atom]');
exports.reactLogger = new DebugLogger('[Nexus:React]');
