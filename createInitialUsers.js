"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var mongoose_1 = require("mongoose");
var User_1 = require("./src/models/User");
var bcrypt_1 = require("bcrypt");
var DATABASE_URL = 'mongodb+srv://admin:LogaXP%402024@cluster0.gnxxepv.mongodb.net/service-desk?retryWrites=true&w=majority';
// Connect to the cloud-based MongoDB
var connectToDatabase = function () { return __awaiter(void 0, void 0, void 0, function () {
    var error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, mongoose_1.default.connect(DATABASE_URL)];
            case 1:
                _a.sent();
                console.log('Connected to MongoDB');
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error('Failed to connect to MongoDB:', error_1);
                process.exit(1);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); };
// Create the initial admin user
var createAdminUser = function () { return __awaiter(void 0, void 0, void 0, function () {
    var adminData, salt, _a, admin, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                adminData = {
                    name: 'Kolapo John',
                    email: 'kolapo@gmail.com',
                    role: 'admin',
                    status: 'Active',
                    password_hash: '',
                };
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                return [4 /*yield*/, bcrypt_1.default.genSalt(10)];
            case 2:
                salt = _b.sent();
                _a = adminData;
                return [4 /*yield*/, bcrypt_1.default.hash('Password@123', salt)];
            case 3:
                _a.password_hash = _b.sent();
                admin = new User_1.default(adminData);
                return [4 /*yield*/, admin.save()];
            case 4:
                _b.sent();
                console.log('Admin user created:', admin);
                return [3 /*break*/, 6];
            case 5:
                error_2 = _b.sent();
                console.error('Failed to create admin user:', error_2);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
// Create an active user
var createActiveUser = function () { return __awaiter(void 0, void 0, void 0, function () {
    var userData, salt, _a, user, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                userData = {
                    name: 'Nonso Paul',
                    email: 'nonso@gmail.com',
                    role: 'admin',
                    status: 'Active',
                    password_hash: '',
                };
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                return [4 /*yield*/, bcrypt_1.default.genSalt(10)];
            case 2:
                salt = _b.sent();
                _a = userData;
                return [4 /*yield*/, bcrypt_1.default.hash('Password@123', salt)];
            case 3:
                _a.password_hash = _b.sent();
                user = new User_1.default(userData);
                return [4 /*yield*/, user.save()];
            case 4:
                _b.sent();
                console.log('Active user created:', user);
                return [3 /*break*/, 6];
            case 5:
                error_3 = _b.sent();
                console.error('Failed to create active user:', error_3);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
// Run the script
var runScript = function () { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, connectToDatabase()];
            case 1:
                _a.sent();
                return [4 /*yield*/, createAdminUser()];
            case 2:
                _a.sent();
                return [4 /*yield*/, createActiveUser()];
            case 3:
                _a.sent();
                mongoose_1.default.disconnect();
                return [2 /*return*/];
        }
    });
}); };
runScript();
