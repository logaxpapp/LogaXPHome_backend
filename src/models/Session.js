"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var SessionSchema = new mongoose_1.Schema({
    userId: { type: mongoose_1.default.Types.ObjectId, ref: 'User', required: true },
    isActive: { type: Boolean, default: true },
    lastAccessed: { type: Date, default: Date.now },
}, { timestamps: true });
var Session = mongoose_1.default.model('Session', SessionSchema);
exports.default = Session;
