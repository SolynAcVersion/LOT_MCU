module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1770126800986, function(require, module, exports) {

Object.defineProperty(exports, "__esModule", { value: true });
const xml2js_1 = require("xml2js");
class Client {
    static parseXml(body, response) {
        let ret = this._parseXML(body);
        if (response !== null && typeof response !== 'undefined') {
            ret = this._xmlCast(ret, response);
        }
        return ret;
    }
    static toXML(body) {
        const builder = new xml2js_1.Builder();
        return builder.buildObject(body);
    }
    static _parseXML(body) {
        let parser = new xml2js_1.Parser({ explicitArray: false });
        let result = {};
        parser.parseString(body, function (err, output) {
            result.err = err;
            result.output = output;
        });
        if (result.err) {
            throw result.err;
        }
        return result.output;
    }
    static _xmlCast(obj, clazz) {
        obj = obj || {};
        let ret = {};
        let clz = clazz;
        let names = clz.names();
        let types = clz.types();
        Object.keys(names).forEach((key) => {
            let originName = names[key];
            let value = obj[originName];
            let type = types[key];
            switch (type) {
                case 'boolean':
                    if (!value) {
                        ret[originName] = false;
                        return;
                    }
                    ret[originName] = value === 'false' ? false : true;
                    return;
                case 'number':
                    if (value != 0 && !value) {
                        ret[originName] = NaN;
                        return;
                    }
                    ret[originName] = +value;
                    return;
                case 'string':
                    if (!value) {
                        ret[originName] = '';
                        return;
                    }
                    ret[originName] = value.toString();
                    return;
                default:
                    if (type.type === 'array') {
                        if (!value) {
                            ret[originName] = [];
                            return;
                        }
                        if (!Array.isArray(value)) {
                            value = [value];
                        }
                        if (typeof type.itemType === 'function') {
                            ret[originName] = value.map((d) => {
                                return this._xmlCast(d, type.itemType);
                            });
                        }
                        else {
                            ret[originName] = value;
                        }
                    }
                    else if (typeof type === 'function') {
                        if (!value) {
                            value = {};
                        }
                        ret[originName] = this._xmlCast(value, type);
                    }
                    else {
                        ret[originName] = value;
                    }
            }
        });
        return ret;
    }
}
exports.default = Client;
//# sourceMappingURL=client.js.map
}, function(modId) {var map = {}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1770126800986);
})()
//miniprogram-npm-outsideDeps=["xml2js"]
//# sourceMappingURL=index.js.map