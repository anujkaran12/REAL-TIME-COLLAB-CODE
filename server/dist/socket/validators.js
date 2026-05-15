"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.isWithinLength = void 0;
const isWithinLength = (value, min, max) => {
    const length = value.trim().length;
    return length >= min && length <= max;
};
exports.isWithinLength = isWithinLength;
