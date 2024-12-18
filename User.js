// "use strict";
// // src/models/User.ts
// var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
//     function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
//     return new (P || (P = Promise))(function (resolve, reject) {
//         function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
//         function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
//         function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
//         step((generator = generator.apply(thisArg, _arguments || [])).next());
//     });
// };
// var __generator = (this && this.__generator) || function (thisArg, body) {
//     var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
//     return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
//     function verb(n) { return function (v) { return step([n, v]); }; }
//     function step(op) {
//         if (f) throw new TypeError("Generator is already executing.");
//         while (g && (g = 0, op[0] && (_ = 0)), _) try {
//             if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
//             if (y = 0, t) op = [op[0] & 2, t.value];
//             switch (op[0]) {
//                 case 0: case 1: t = op; break;
//                 case 4: _.label++; return { value: op[1], done: false };
//                 case 5: _.label++; y = op[1]; op = [0]; continue;
//                 case 7: op = _.ops.pop(); _.trys.pop(); continue;
//                 default:
//                     if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
//                     if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
//                     if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
//                     if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
//                     if (t[2]) _.ops.pop();
//                     _.trys.pop(); continue;
//             }
//             op = body.call(thisArg, _);
//         } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
//         if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
//     }
// };
// Object.defineProperty(exports, "__esModule", { value: true });
// var mongoose_1 = require("mongoose");
// var bcrypt_1 = require("bcrypt");
// var enums_1 = require("./src/types/enums");
// var Session_1 = require("./src/models/Session");
// // Address Subdocument Schema
// var AddressSchema = new mongoose_1.Schema({
//     street: { type: String, trim: true },
//     city: { type: String, trim: true },
//     state: { type: String, trim: true },
//     zip: { type: String, trim: true },
//     country: { type: String, trim: true },
// }, { _id: false });
// // OnboardingStep Enum Array
// var OnboardingStepsEnum = Object.values(enums_1.OnboardingStep);
// // User Schema
// var UserSchema = new mongoose_1.Schema({
//     _id: { type: mongoose_1.Schema.Types.ObjectId, auto: true },
//     name: { type: String, required: true, trim: true },
//     email: { type: String, required: true, unique: true, lowercase: true, trim: true },
//     password_hash: { type: String, required: true },
//     passwordHistory: [
//         {
//             hash: { type: String, required: true },
//             changedAt: { type: Date, required: true },
//         },
//     ],
//     role: { type: String, enum: Object.values(enums_1.UserRole), required: true, default: enums_1.UserRole.User },
//     status: { type: String, enum: Object.values(enums_1.UserStatus), default: enums_1.UserStatus.Pending },
//     onlineStatus: { type: String, enum: Object.values(enums_1.OnlineStatus), default: enums_1.OnlineStatus.Offline },
//     applications_managed: [{ type: String, enum: Object.values(enums_1.Application), trim: true }],
//     deletionReason: { type: String, trim: true },
//     deletionApprovedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
//     deletionRejectedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User', default: null },
//     job_title: { type: String, trim: true },
//     employee_id: { type: String, unique: true, trim: true },
//     department: { type: String, trim: true },
//     manager: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
//     phone_number: { type: String, trim: true },
//     address: { type: AddressSchema },
//     profile_picture_url: { type: String, trim: true },
//     date_of_birth: { type: Date },
//     employment_type: { type: String, trim: true },
//     hourlyRate: { type: Number, default: 0 },
//     overtimeRate: { type: Number, default: 1.5 },
//     onboarding_steps_completed: [{ type: String, enum: OnboardingStepsEnum, trim: true, },],
//     googleConnected: { type: Boolean, default: false },
//     createdBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
//     updatedBy: { type: mongoose_1.Schema.Types.ObjectId, ref: 'User' },
//     googleAccessToken: { type: String },
//     googleRefreshToken: { type: String },
//     googleTokenExpiry: { type: Date },
//     lastLoginAt: { type: Date },
//     passwordChangedAt: { type: Date },
//     passwordExpiryNotified: { type: Boolean, default: false },
//     acknowledgedPolicies: [{ type: mongoose_1.Schema.Types.ObjectId, ref: 'Resource' }],
// }, { timestamps: true });
// // Method to check if the password is reused
// UserSchema.methods.isPasswordReused = function (newPassword) {
//     return __awaiter(this, void 0, void 0, function () {
//         var _i, _a, entry, isMatch;
//         return __generator(this, function (_b) {
//             switch (_b.label) {
//                 case 0:
//                     _i = 0, _a = this.passwordHistory;
//                     _b.label = 1;
//                 case 1:
//                     if (!(_i < _a.length)) return [3 /*break*/, 4];
//                     entry = _a[_i];
//                     return [4 /*yield*/, bcrypt_1.default.compare(newPassword, entry.hash)];
//                 case 2:
//                     isMatch = _b.sent();
//                     if (isMatch)
//                         return [2 /*return*/, true];
//                     _b.label = 3;
//                 case 3:
//                     _i++;
//                     return [3 /*break*/, 1];
//                 case 4: return [2 /*return*/, false];
//             }
//         });
//     });
// };
// // Password hashing middleware
// UserSchema.pre('save', function (next) {
//     return __awaiter(this, void 0, void 0, function () {
//         var user, salt, _a, error_1;
//         return __generator(this, function (_b) {
//             switch (_b.label) {
//                 case 0:
//                     // If the password field isn't modified, skip the middleware
//                     if (!this.isModified('password_hash'))
//                         return [2 /*return*/, next()];
//                     _b.label = 1;
//                 case 1:
//                     _b.trys.push([1, 6, , 7]);
//                     if (!!this.isNew) return [3 /*break*/, 3];
//                     return [4 /*yield*/, User.findById(this._id).select('password_hash')];
//                 case 2:
//                     user = _b.sent();
//                     if (user && user.password_hash) {
//                         this.passwordHistory.push({
//                             hash: user.password_hash, // Save the current hashed password
//                             changedAt: new Date(),
//                         });
//                         // Keep only the last 5 passwords
//                         if (this.passwordHistory.length > 5) {
//                             this.passwordHistory.shift();
//                         }
//                     }
//                     _b.label = 3;
//                 case 3: return [4 /*yield*/, bcrypt_1.default.genSalt(10)];
//                 case 4:
//                     salt = _b.sent();
//                     _a = this;
//                     return [4 /*yield*/, bcrypt_1.default.hash(this.password_hash, salt)];
//                 case 5:
//                     _a.password_hash = _b.sent();
//                     // Update the passwordChangedAt field
//                     this.passwordChangedAt = new Date();
//                     // Reset the passwordExpiryNotified flag
//                     this.passwordExpiryNotified = false;
//                     next();
//                     return [3 /*break*/, 7];
//                 case 6:
//                     error_1 = _b.sent();
//                     next(error_1);
//                     return [3 /*break*/, 7];
//                 case 7: return [2 /*return*/];
//             }
//         });
//     });
// });
// // Method to Compare Passwords
// UserSchema.methods.comparePassword = function (candidatePassword) {
//     return bcrypt_1.default.compare(candidatePassword, this.password_hash);
// };
// // Method to Record Login
// UserSchema.methods.recordLogin = function () {
//     return __awaiter(this, void 0, void 0, function () {
//         return __generator(this, function (_a) {
//             switch (_a.label) {
//                 case 0:
//                     this.lastLoginAt = new Date();
//                     return [4 /*yield*/, this.save()];
//                 case 1:
//                     _a.sent();
//                     // Update or create an active session
//                     return [4 /*yield*/, Session_1.default.findOneAndUpdate({ userId: this._id }, { userId: this._id, isActive: true, lastAccessed: new Date() }, { upsert: true })];
//                 case 2:
//                     // Update or create an active session
//                     _a.sent();
//                     return [2 /*return*/];
//             }
//         });
//     });
// };
// // Method to Record Logout
// UserSchema.methods.recordLogout = function () {
//     return __awaiter(this, void 0, void 0, function () {
//         return __generator(this, function (_a) {
//             switch (_a.label) {
//                 case 0: return [4 /*yield*/, Session_1.default.findOneAndUpdate({ userId: this._id, isActive: true }, { isActive: false })];
//                 case 1:
//                     _a.sent();
//                     return [2 /*return*/];
//             }
//         });
//     });
// };
// // Export the User Model
// var User = mongoose_1.default.model('User', UserSchema);
// exports.default = User;
