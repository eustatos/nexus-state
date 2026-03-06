"use strict";
// Types for nexus-state core
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.RestorationError = exports.DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG = void 0;
exports.isPrimitiveAtom = isPrimitiveAtom;
exports.isComputedAtom = isComputedAtom;
exports.isWritableAtom = isWritableAtom;
// === TYPE GUARDS ===
/**
 * Type guard to check if an atom is a primitive atom
 * @template Value The type of value the atom holds
 * @param atom The atom to check
 * @returns True if the atom is a primitive atom
 */
function isPrimitiveAtom(atom) {
    return atom.type === 'primitive';
}
/**
 * Type guard to check if an atom is a computed atom
 * @template Value The type of value the atom holds
 * @param atom The atom to check
 * @returns True if the atom is a computed atom
 */
function isComputedAtom(atom) {
    return atom.type === 'computed';
}
/**
 * Type guard to check if an atom is a writable atom
 * @template Value The type of value the atom holds
 * @param atom The atom to check
 * @returns True if the atom is a writable atom
 */
function isWritableAtom(atom) {
    return atom.type === 'writable';
}
/**
 * Default configuration for incremental snapshots
 */
exports.DEFAULT_INCREMENTAL_SNAPSHOT_CONFIG = {
    enabled: true,
    fullSnapshotInterval: 10,
    maxDeltaChainLength: 20,
    maxDeltaChainAge: 5 * 60 * 1000, // 5 minutes
    maxDeltaChainSize: 1024 * 1024, // 1MB
    changeDetection: 'deep',
    reconstructOnDemand: true,
    cacheReconstructed: true,
    maxCacheSize: 100,
    compressionLevel: 'light',
};
/**
 * Error class for restoration failures
 */
var RestorationError = /** @class */ (function (_super) {
    __extends(RestorationError, _super);
    function RestorationError(message, details) {
        var _this = _super.call(this, message) || this;
        _this.details = details;
        _this.name = 'RestorationError';
        return _this;
    }
    return RestorationError;
}(Error));
exports.RestorationError = RestorationError;
