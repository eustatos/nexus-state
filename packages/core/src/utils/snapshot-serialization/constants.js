"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_DESERIALIZE_OPTIONS = exports.DEFAULT_SERIALIZE_OPTIONS = void 0;
exports.DEFAULT_SERIALIZE_OPTIONS = {
    maxDepth: 50,
    skipKeys: [],
    customTransformers: new Map(),
    preserveType: true,
    escapePrefix: "__esc_",
};
exports.DEFAULT_DESERIALIZE_OPTIONS = {
    allowedConstructors: ["Object", "Array"],
    restoreSpecialTypes: true,
    customRevivers: new Map(),
};
