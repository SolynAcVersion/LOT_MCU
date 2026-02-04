module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1770126800981, function(require, module, exports) {

var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.InterceptorContextResponse = exports.InterceptorContextConfiguration = exports.InterceptorContextRequest = exports.AttributeMap = exports.InterceptorContext = void 0;
// This file is auto-generated, don't edit it
const credentials_1 = __importDefault(require("@alicloud/credentials"));
const $tea = __importStar(require("@alicloud/tea-typescript"));
class InterceptorContext extends $tea.Model {
    constructor(map) {
        super(map);
    }
    static names() {
        return {
            request: 'request',
            configuration: 'configuration',
            response: 'response',
        };
    }
    static types() {
        return {
            request: InterceptorContextRequest,
            configuration: InterceptorContextConfiguration,
            response: InterceptorContextResponse,
        };
    }
}
exports.InterceptorContext = InterceptorContext;
class AttributeMap extends $tea.Model {
    constructor(map) {
        super(map);
    }
    static names() {
        return {
            attributes: 'attributes',
            key: 'key',
        };
    }
    static types() {
        return {
            attributes: { 'type': 'map', 'keyType': 'string', 'valueType': 'any' },
            key: { 'type': 'map', 'keyType': 'string', 'valueType': 'string' },
        };
    }
}
exports.AttributeMap = AttributeMap;
class InterceptorContextRequest extends $tea.Model {
    constructor(map) {
        super(map);
    }
    static names() {
        return {
            headers: 'headers',
            query: 'query',
            body: 'body',
            stream: 'stream',
            hostMap: 'hostMap',
            pathname: 'pathname',
            productId: 'productId',
            action: 'action',
            version: 'version',
            protocol: 'protocol',
            method: 'method',
            authType: 'authType',
            bodyType: 'bodyType',
            reqBodyType: 'reqBodyType',
            style: 'style',
            credential: 'credential',
            signatureVersion: 'signatureVersion',
            signatureAlgorithm: 'signatureAlgorithm',
            userAgent: 'userAgent',
        };
    }
    static types() {
        return {
            headers: { 'type': 'map', 'keyType': 'string', 'valueType': 'string' },
            query: { 'type': 'map', 'keyType': 'string', 'valueType': 'string' },
            body: 'any',
            stream: 'Readable',
            hostMap: { 'type': 'map', 'keyType': 'string', 'valueType': 'string' },
            pathname: 'string',
            productId: 'string',
            action: 'string',
            version: 'string',
            protocol: 'string',
            method: 'string',
            authType: 'string',
            bodyType: 'string',
            reqBodyType: 'string',
            style: 'string',
            credential: credentials_1.default,
            signatureVersion: 'string',
            signatureAlgorithm: 'string',
            userAgent: 'string',
        };
    }
}
exports.InterceptorContextRequest = InterceptorContextRequest;
class InterceptorContextConfiguration extends $tea.Model {
    constructor(map) {
        super(map);
    }
    static names() {
        return {
            regionId: 'regionId',
            endpoint: 'endpoint',
            endpointRule: 'endpointRule',
            endpointMap: 'endpointMap',
            endpointType: 'endpointType',
            network: 'network',
            suffix: 'suffix',
        };
    }
    static types() {
        return {
            regionId: 'string',
            endpoint: 'string',
            endpointRule: 'string',
            endpointMap: { 'type': 'map', 'keyType': 'string', 'valueType': 'string' },
            endpointType: 'string',
            network: 'string',
            suffix: 'string',
        };
    }
}
exports.InterceptorContextConfiguration = InterceptorContextConfiguration;
class InterceptorContextResponse extends $tea.Model {
    constructor(map) {
        super(map);
    }
    static names() {
        return {
            statusCode: 'statusCode',
            headers: 'headers',
            body: 'body',
            deserializedBody: 'deserializedBody',
        };
    }
    static types() {
        return {
            statusCode: 'number',
            headers: { 'type': 'map', 'keyType': 'string', 'valueType': 'string' },
            body: 'Readable',
            deserializedBody: 'any',
        };
    }
}
exports.InterceptorContextResponse = InterceptorContextResponse;
class Client {
    constructor() {
    }
}
exports.default = Client;
//# sourceMappingURL=client.js.map
}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1770126800981);
})()
//miniprogram-npm-outsideDeps=["@alicloud/credentials","@alicloud/tea-typescript"]
//# sourceMappingURL=index.js.map