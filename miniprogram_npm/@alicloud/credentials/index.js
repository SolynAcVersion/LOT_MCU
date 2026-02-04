module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1770126800956, function(require, module, exports) {

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
exports.Config = void 0;
const access_key_credential_1 = __importDefault(require("./access_key_credential"));
const sts_token_credential_1 = __importDefault(require("./sts_token_credential"));
const ecs_ram_role_credential_1 = __importDefault(require("./ecs_ram_role_credential"));
const ram_role_arn_credential_1 = __importDefault(require("./ram_role_arn_credential"));
const oidc_role_arn_credential_1 = __importDefault(require("./oidc_role_arn_credential"));
const rsa_key_pair_credential_1 = __importDefault(require("./rsa_key_pair_credential"));
const bearer_token_credential_1 = __importDefault(require("./bearer_token_credential"));
const DefaultProvider = __importStar(require("./provider/provider_chain"));
const config_1 = __importDefault(require("./config"));
exports.Config = config_1.default;
const uri_credential_1 = __importDefault(require("./uri_credential"));
class Credential {
    constructor(config = null, runtime = {}) {
        this.load(config, runtime);
    }
    getAccessKeyId() {
        return this.credential.getAccessKeyId();
    }
    getAccessKeySecret() {
        return this.credential.getAccessKeySecret();
    }
    getSecurityToken() {
        return this.credential.getSecurityToken();
    }
    getBearerToken() {
        return this.credential.getBearerToken();
    }
    getType() {
        return this.credential.getType();
    }
    getCredential() {
        return this.credential.getCredential();
    }
    load(config, runtime) {
        if (!config) {
            this.credential = DefaultProvider.getCredentials();
            return;
        }
        if (!config.type) {
            throw new Error('Missing required type option');
        }
        switch (config.type) {
            case 'access_key':
                this.credential = new access_key_credential_1.default(config.accessKeyId, config.accessKeySecret);
                break;
            case 'sts':
                this.credential = new sts_token_credential_1.default(config.accessKeyId, config.accessKeySecret, config.securityToken);
                break;
            case 'ecs_ram_role':
                this.credential = new ecs_ram_role_credential_1.default(config.roleName);
                break;
            case 'ram_role_arn':
                this.credential = new ram_role_arn_credential_1.default(config, runtime);
                break;
            case 'oidc_role_arn':
                this.credential = new oidc_role_arn_credential_1.default(config, runtime);
                break;
            case 'rsa_key_pair':
                this.credential = new rsa_key_pair_credential_1.default(config.publicKeyId, config.privateKeyFile);
                break;
            case 'bearer':
                this.credential = new bearer_token_credential_1.default(config.bearerToken);
                break;
            case 'credentials_uri':
                this.credential = new uri_credential_1.default(config.credentialsURI);
                break;
            default:
                throw new Error('Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, rsa_key_pair, credentials_uri');
        }
    }
}
exports.default = Credential;
//# sourceMappingURL=client.js.map
}, function(modId) {var map = {"./access_key_credential":1770126800957,"./sts_token_credential":1770126800961,"./ecs_ram_role_credential":1770126800962,"./ram_role_arn_credential":1770126800965,"./oidc_role_arn_credential":1770126800969,"./rsa_key_pair_credential":1770126800970,"./bearer_token_credential":1770126800971,"./provider/provider_chain":1770126800972,"./config":1770126800960,"./uri_credential":1770126800977}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800957, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const default_credential_1 = __importDefault(require("./default_credential"));
const config_1 = __importDefault(require("./config"));
class AccessKeyCredential extends default_credential_1.default {
    constructor(accessKeyId, accessKeySecret) {
        if (!accessKeyId) {
            throw new Error('Missing required accessKeyId option in config for access_key');
        }
        if (!accessKeySecret) {
            throw new Error('Missing required accessKeySecret option in config for access_key');
        }
        const conf = new config_1.default({
            type: 'access_key',
            accessKeyId,
            accessKeySecret
        });
        super(conf);
    }
}
exports.default = AccessKeyCredential;
//# sourceMappingURL=access_key_credential.js.map
}, function(modId) { var map = {"./default_credential":1770126800958,"./config":1770126800960}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800958, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const credential_model_1 = __importDefault(require("./credential_model"));
class DefaultCredential {
    constructor(config) {
        this.accessKeyId = config.accessKeyId || '';
        this.accessKeySecret = config.accessKeySecret || '';
        this.securityToken = config.securityToken || '';
        this.bearerToken = config.bearerToken || '';
        this.type = config.type || '';
    }
    async getAccessKeyId() {
        return this.accessKeyId;
    }
    async getAccessKeySecret() {
        return this.accessKeySecret;
    }
    async getSecurityToken() {
        return this.securityToken;
    }
    getBearerToken() {
        return this.bearerToken;
    }
    getType() {
        return this.type;
    }
    async getCredential() {
        return new credential_model_1.default({
            accessKeyId: this.accessKeyId,
            accessKeySecret: this.accessKeySecret,
            securityToken: this.securityToken,
            bearerToken: this.bearerToken,
            type: this.type,
        });
    }
}
exports.default = DefaultCredential;
//# sourceMappingURL=default_credential.js.map
}, function(modId) { var map = {"./credential_model":1770126800959}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800959, function(require, module, exports) {

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
Object.defineProperty(exports, "__esModule", { value: true });
const $tea = __importStar(require("@alicloud/tea-typescript"));
class CredentialModel extends $tea.Model {
    constructor(map) {
        super(map);
    }
    static names() {
        return {
            accessKeyId: 'accessKeyId',
            accessKeySecret: 'accessKeySecret',
            securityToken: 'securityToken',
            bearerToken: 'bearerToken',
            type: 'type',
        };
    }
    static types() {
        return {
            accessKeyId: 'string',
            accessKeySecret: 'string',
            securityToken: 'string',
            bearerToken: 'string',
            type: 'string',
        };
    }
}
exports.default = CredentialModel;
//# sourceMappingURL=credential_model.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800960, function(require, module, exports) {

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
Object.defineProperty(exports, "__esModule", { value: true });
const $tea = __importStar(require("@alicloud/tea-typescript"));
class Config extends $tea.Model {
    constructor(config) {
        super(config);
    }
    static names() {
        return {
            accessKeyId: 'accessKeyId',
            accessKeySecret: 'accessKeySecret',
            securityToken: 'securityToken',
            bearerToken: 'bearerToken',
            durationSeconds: 'durationSeconds',
            roleArn: 'roleArn',
            policy: 'policy',
            roleSessionExpiration: 'roleSessionExpiration',
            roleSessionName: 'roleSessionName',
            publicKeyId: 'publicKeyId',
            privateKeyFile: 'privateKeyFile',
            roleName: 'roleName',
            credentialsURI: 'credentialsURI',
            oidcProviderArn: 'oidcProviderArn',
            oidcTokenFilePath: 'oidcTokenFilePath',
            type: 'type',
        };
    }
    static types() {
        return {
            accessKeyId: 'string',
            accessKeySecret: 'string',
            securityToken: 'string',
            bearerToken: 'string',
            durationSeconds: 'number',
            roleArn: 'string',
            policy: 'string',
            roleSessionExpiration: 'number',
            roleSessionName: 'string',
            publicKeyId: 'string',
            privateKeyFile: 'string',
            roleName: 'string',
            credentialsURI: 'string',
            oidcProviderArn: 'string',
            oidcTokenFilePath: 'string',
            type: 'string',
        };
    }
}
exports.default = Config;
//# sourceMappingURL=config.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800961, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const default_credential_1 = __importDefault(require("./default_credential"));
const config_1 = __importDefault(require("./config"));
class StsTokenCredential extends default_credential_1.default {
    constructor(accessKeyId, accessKeySecret, securityToken) {
        if (!accessKeyId) {
            throw new Error('Missing required accessKeyId option in config for sts');
        }
        if (!accessKeySecret) {
            throw new Error('Missing required accessKeySecret option in config for sts');
        }
        if (!securityToken) {
            throw new Error('Missing required securityToken option in config for sts');
        }
        const conf = new config_1.default({
            type: 'sts',
            accessKeyId,
            accessKeySecret,
            securityToken
        });
        super(conf);
    }
}
exports.default = StsTokenCredential;
//# sourceMappingURL=sts_token_credential.js.map
}, function(modId) { var map = {"./default_credential":1770126800958,"./config":1770126800960}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800962, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const session_credential_1 = __importDefault(require("./session_credential"));
const httpx_1 = __importDefault(require("httpx"));
const config_1 = __importDefault(require("./config"));
const SECURITY_CRED_URL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';
class EcsRamRoleCredential extends session_credential_1.default {
    constructor(roleName = '', runtime = {}) {
        const conf = new config_1.default({
            type: 'ecs_ram_role',
        });
        super(conf);
        this.roleName = roleName;
        this.runtime = runtime;
        this.sessionCredential = null;
    }
    async getBody(url) {
        const response = await httpx_1.default.request(url, {});
        return (await httpx_1.default.read(response, 'utf8'));
    }
    async updateCredential() {
        const roleName = await this.getRoleName();
        const url = SECURITY_CRED_URL + roleName;
        const body = await this.getBody(url);
        const json = JSON.parse(body);
        this.sessionCredential = {
            AccessKeyId: json.AccessKeyId,
            AccessKeySecret: json.AccessKeySecret,
            Expiration: json.Expiration,
            SecurityToken: json.SecurityToken,
        };
    }
    async getRoleName() {
        if (this.roleName && this.roleName.length) {
            return this.roleName;
        }
        return await this.getBody(SECURITY_CRED_URL);
    }
}
exports.default = EcsRamRoleCredential;
//# sourceMappingURL=ecs_ram_role_credential.js.map
}, function(modId) { var map = {"./session_credential":1770126800963,"./config":1770126800960}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800963, function(require, module, exports) {

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
const default_credential_1 = __importDefault(require("./default_credential"));
const utils = __importStar(require("./util/utils"));
const config_1 = __importDefault(require("./config"));
const credential_model_1 = __importDefault(require("./credential_model"));
class SessionCredential extends default_credential_1.default {
    constructor(config) {
        const conf = new config_1.default({
            type: config.type,
            accessKeyId: config.accessKeyId,
            accessKeySecret: config.accessKeySecret,
            securityToken: config.securityToken
        });
        super(conf);
        this.sessionCredential = null;
        this.durationSeconds = config.durationSeconds || 3600;
    }
    async updateCredential() {
        throw new Error('need implemented in sub-class');
    }
    async ensureCredential() {
        const needUpdate = this.needUpdateCredential();
        if (needUpdate) {
            await this.updateCredential();
        }
    }
    async getAccessKeyId() {
        await this.ensureCredential();
        return this.sessionCredential.AccessKeyId;
    }
    async getAccessKeySecret() {
        await this.ensureCredential();
        return this.sessionCredential.AccessKeySecret;
    }
    async getSecurityToken() {
        await this.ensureCredential();
        return this.sessionCredential.SecurityToken;
    }
    needUpdateCredential() {
        if (!this.sessionCredential || !this.sessionCredential.Expiration || !this.sessionCredential.AccessKeyId || !this.sessionCredential.AccessKeySecret || !this.sessionCredential.SecurityToken) {
            return true;
        }
        const expireTime = utils.timestamp(new Date(), this.durationSeconds * 0.05 * 1000);
        if (this.sessionCredential.Expiration < expireTime) {
            return true;
        }
        return false;
    }
    async getCredential() {
        await this.ensureCredential();
        return new credential_model_1.default({
            accessKeyId: this.sessionCredential.AccessKeyId,
            accessKeySecret: this.sessionCredential.AccessKeySecret,
            securityToken: this.sessionCredential.SecurityToken,
            bearerToken: this.bearerToken,
            type: this.type,
        });
    }
}
exports.default = SessionCredential;
//# sourceMappingURL=session_credential.js.map
}, function(modId) { var map = {"./default_credential":1770126800958,"./util/utils":1770126800964,"./config":1770126800960,"./credential_model":1770126800959}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800964, function(require, module, exports) {

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
exports.parseFile = exports.timestamp = void 0;
const ini = __importStar(require("ini"));
const kitx = __importStar(require("kitx"));
const fs_1 = __importDefault(require("fs"));
function timestamp(dateStr, timeChange) {
    let date = new Date(dateStr);
    if (!dateStr || isNaN(date.getTime())) {
        date = new Date();
    }
    if (timeChange) {
        date.setTime(date.getTime() + timeChange);
    }
    const YYYY = date.getUTCFullYear();
    const MM = kitx.pad2(date.getUTCMonth() + 1);
    const DD = kitx.pad2(date.getUTCDate());
    const HH = kitx.pad2(date.getUTCHours());
    const mm = kitx.pad2(date.getUTCMinutes());
    const ss = kitx.pad2(date.getUTCSeconds());
    // 删除掉毫秒部分
    return `${YYYY}-${MM}-${DD}T${HH}:${mm}:${ss}Z`;
}
exports.timestamp = timestamp;
function parseFile(file, ignoreErr = false) {
    // check read permission
    try {
        fs_1.default.accessSync(file, fs_1.default.constants.R_OK);
    }
    catch (e) {
        if (ignoreErr) {
            return null;
        }
        throw new Error('Has no read permission to credentials file');
    }
    return ini.parse(fs_1.default.readFileSync(file, 'utf-8'));
}
exports.parseFile = parseFile;
//# sourceMappingURL=utils.js.map
}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800965, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const session_credential_1 = __importDefault(require("./session_credential"));
const http_1 = require("./util/http");
const config_1 = __importDefault(require("./config"));
class RamRoleArnCredential extends session_credential_1.default {
    constructor(config, runtime = {}) {
        if (!config.accessKeyId) {
            throw new Error('Missing required accessKeyId option in config for ram_role_arn');
        }
        if (!config.accessKeySecret) {
            throw new Error('Missing required accessKeySecret option in config for ram_role_arn');
        }
        if (!config.roleArn) {
            throw new Error('Missing required roleArn option in config for ram_role_arn');
        }
        const conf = new config_1.default({
            type: 'ram_role_arn',
            accessKeyId: config.accessKeyId,
            accessKeySecret: config.accessKeySecret,
            securityToken: config.securityToken
        });
        super(conf);
        this.roleArn = config.roleArn;
        this.policy = config.policy;
        this.durationSeconds = config.roleSessionExpiration || 3600;
        this.roleSessionName = config.roleSessionName || 'role_session_name';
        this.runtime = runtime;
        this.host = 'https://sts.aliyuncs.com';
    }
    async updateCredential() {
        const params = {
            accessKeyId: this.accessKeyId,
            securityToken: this.securityToken,
            roleArn: this.roleArn,
            action: 'AssumeRole',
            durationSeconds: this.durationSeconds,
            roleSessionName: this.roleSessionName
        };
        if (this.policy) {
            params.policy = this.policy;
        }
        const json = await http_1.request(this.host, params, this.runtime, this.accessKeySecret);
        this.sessionCredential = json.Credentials;
    }
}
exports.default = RamRoleArnCredential;
//# sourceMappingURL=ram_role_arn_credential.js.map
}, function(modId) { var map = {"./session_credential":1770126800963,"./util/http":1770126800966,"./config":1770126800960}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800966, function(require, module, exports) {

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
exports.request = void 0;
const httpx_1 = __importDefault(require("httpx"));
const kitx = __importStar(require("kitx"));
const helper = __importStar(require("./helper"));
const utils = __importStar(require("./utils"));
const STATUS_CODE = new Set([200, '200', 'OK', 'Success']);
function firstLetterUpper(str) {
    return str.slice(0, 1).toUpperCase() + str.slice(1);
}
function formatParams(params) {
    const keys = Object.keys(params);
    const newParams = {};
    for (const key of keys) {
        newParams[firstLetterUpper(key)] = params[key];
    }
    return newParams;
}
function encode(str) {
    const result = encodeURIComponent(str);
    return result.replace(/!/g, '%21')
        .replace(/'/g, '%27')
        .replace(/\(/g, '%28')
        .replace(/\)/g, '%29')
        .replace(/\*/g, '%2A');
}
function replaceRepeatList(target, key, repeat) {
    for (let i = 0; i < repeat.length; i++) {
        const item = repeat[i];
        if (item && typeof item === 'object') {
            const keys = Object.keys(item);
            for (const itemKey of keys) {
                target[`${key}.${i + 1}.${itemKey}`] = item[itemKey];
            }
        }
        else {
            target[`${key}.${i + 1}`] = item;
        }
    }
}
function flatParams(params) {
    const target = {};
    const keys = Object.keys(params);
    for (const key of keys) {
        const value = params[key];
        if (Array.isArray(value)) {
            replaceRepeatList(target, key, value);
        }
        else {
            target[key] = value;
        }
    }
    return target;
}
function normalize(params) {
    const list = [];
    const flated = flatParams(params);
    const keys = Object.keys(flated).sort();
    for (const key of keys) {
        const value = flated[key];
        list.push([encode(key), encode(value)]); // push []
    }
    return list;
}
function canonicalize(normalized) {
    const fields = [];
    for (const [key, value] of normalized) {
        fields.push(key + '=' + value);
    }
    return fields.join('&');
}
function _buildParams() {
    const defaultParams = {
        Format: 'JSON',
        SignatureMethod: 'HMAC-SHA1',
        SignatureNonce: kitx.makeNonce(),
        SignatureVersion: '1.0',
        Timestamp: utils.timestamp(),
        Version: '2015-04-01',
        RegionId: 'cn-hangzhou'
    };
    return defaultParams;
}
async function request(host, params = {}, opts = {}, accessKeySecret) {
    // 1. compose params and opts
    let options = Object.assign({ headers: {
            'x-sdk-client': helper.DEFAULT_CLIENT,
            'user-agent': helper.DEFAULT_UA
        } }, opts);
    // format params until formatParams is false
    if (options.formatParams !== false) {
        params = formatParams(params);
    }
    params = Object.assign(Object.assign({}, _buildParams()), params);
    // 2. calculate signature
    const method = (opts.method || 'GET').toUpperCase();
    const normalized = normalize(params);
    if (!options.anonymous) {
        const canonicalized = canonicalize(normalized);
        // 2.1 get string to sign
        const stringToSign = `${method}&${encode('/')}&${encode(canonicalized)}`;
        // 2.2 get signature
        const key = accessKeySecret + '&';
        const signature = kitx.sha1(stringToSign, key, 'base64');
        // add signature
        normalized.push(['Signature', encode(signature)]);
    }
    // 3. generate final url
    const url = opts.method === 'POST' ? `${host}/` : `${host}/?${canonicalize(normalized)}`;
    // 4. send request
    if (opts.method === 'POST') {
        opts.headers = opts.headers || {};
        opts.headers['content-type'] = 'application/x-www-form-urlencoded';
        opts.data = canonicalize(normalized);
    }
    const response = await httpx_1.default.request(url, opts);
    const buffer = await httpx_1.default.read(response, 'utf8');
    const json = JSON.parse(buffer);
    if (json.Code && !STATUS_CODE.has(json.Code)) {
        const err = new Error(`${json.Message}`);
        err.name = json.Code + 'Error';
        err.data = json;
        err.code = json.Code;
        err.url = url;
        throw err;
    }
    return json;
}
exports.request = request;
//# sourceMappingURL=http.js.map
}, function(modId) { var map = {"./helper":1770126800967,"./utils":1770126800964}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800967, function(require, module, exports) {

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
exports.DEFAULT_CLIENT = exports.DEFAULT_UA = void 0;
const os = __importStar(require("os"));
const package_json_1 = __importDefault(require("../../package.json"));
exports.DEFAULT_UA = `AlibabaCloud (${os.platform()}; ${os.arch()}) ` +
    `Node.js/${process.version} Core/${package_json_1.default.version}`;
exports.DEFAULT_CLIENT = `Node.js(${process.version}), ${package_json_1.default.name}: ${package_json_1.default.version}`;
//# sourceMappingURL=helper.js.map
}, function(modId) { var map = {"../../package.json":1770126800968}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800968, function(require, module, exports) {
module.exports = {
    "name": "@alicloud/credentials",
    "version": "2.3.0",
    "description": "alibaba cloud node.js sdk credentials",
    "main": "dist/src/client.js",
    "scripts": {
        "prepublishOnly": "tsc",
        "build": "tsc",
        "lint": "eslint --fix ./src --ext .ts",
        "test": "mocha -b -r ts-node/register test/**/*.test.ts test/*.test.ts --timeout 15000",
        "cov": "nyc -e .ts -r=html -r=text -r=lcov npm run test",
        "ci": "npm run cov",
        "test-integration": "mocha -b -r ts-node/register -R spec test/*.integration.ts",
        "clean": "rm -rf coverage"
    },
    "repository": {
        "type": "git",
        "url": "git+https://github.com/aliyun/nodejs-credentials.git"
    },
    "keywords": [
        "alibaba cloud",
        "sdk",
        "credentials"
    ],
    "author": "Alibaba Cloud SDK",
    "license": "MIT",
    "devDependencies": {
        "@types/expect.js": "^0.3.29",
        "@types/ini": "^1.3.30",
        "@types/mocha": "^7.0.1",
        "@types/rewire": "^2.5.28",
        "@typescript-eslint/eslint-plugin": "^4.31.2",
        "@typescript-eslint/parser": "^4.31.2",
        "eslint": "^7.32.0",
        "expect.js": "^0.3.1",
        "mm": "^2.4.1",
        "mocha": "^10.1.0",
        "nyc": "^13.1.0",
        "rewire": "^4.0.1",
        "ts-node": "^8.6.2",
        "typescript": "^3.7.5"
    },
    "dependencies": {
        "@alicloud/tea-typescript": "^1.5.3",
        "httpx": "^2.2.0",
        "ini": "^1.3.5",
        "kitx": "^2.0.0"
    },
    "bugs": {
        "url": "https://github.com/aliyun/nodejs-credentials/issues"
    },
    "homepage": "https://github.com/aliyun/nodejs-credentials#readme",
    "files": [
        "src",
        "dist"
    ]
}

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800969, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const session_credential_1 = __importDefault(require("./session_credential"));
const http_1 = require("./util/http");
const config_1 = __importDefault(require("./config"));
const fs_1 = __importDefault(require("fs"));
class OidcRoleArnCredential extends session_credential_1.default {
    constructor(config, runtime = {}) {
        if (!config.roleArn) {
            config.roleArn = process.env.ALIBABA_CLOUD_ROLE_ARN;
            if (!config.roleArn) {
                throw new Error('roleArn does not exist and env ALIBABA_CLOUD_ROLE_ARN is null.');
            }
        }
        if (!config.oidcProviderArn) {
            config.oidcProviderArn = process.env.ALIBABA_CLOUD_OIDC_PROVIDER_ARN;
            if (!config.oidcProviderArn) {
                throw new Error('oidcProviderArn does not exist and env ALIBABA_CLOUD_OIDC_PROVIDER_ARN is null.');
            }
        }
        if (!config.oidcTokenFilePath) {
            config.oidcTokenFilePath = process.env.ALIBABA_CLOUD_OIDC_TOKEN_FILE;
            if (!config.oidcTokenFilePath) {
                throw new Error('oidcTokenFilePath is not exists and env ALIBABA_CLOUD_OIDC_TOKEN_FILE is null.');
            }
        }
        if (!config.roleSessionName && process.env.ALIBABA_CLOUD_ROLE_SESSION_NAME) {
            config.roleSessionName = process.env.ALIBABA_CLOUD_ROLE_SESSION_NAME;
        }
        const conf = new config_1.default({
            type: 'oidc_role_arn'
        });
        super(conf);
        this.oidcTokenFilePath = config.oidcTokenFilePath;
        this.roleArn = config.roleArn;
        this.policy = config.policy;
        this.oidcProviderArn = config.oidcProviderArn;
        this.durationSeconds = config.roleSessionExpiration || 3600;
        this.roleSessionName = config.roleSessionName || 'role_session_name';
        runtime.method = 'POST';
        runtime.anonymous = true;
        this.runtime = runtime;
        this.host = 'https://sts.aliyuncs.com';
    }
    getOdicToken(oidcTokenFilePath) {
        if (!fs_1.default.existsSync(oidcTokenFilePath)) {
            throw new Error(`oidcTokenFilePath ${oidcTokenFilePath}  is not exists.`);
        }
        let oidcToken = null;
        try {
            oidcToken = fs_1.default.readFileSync(oidcTokenFilePath, 'utf-8');
        }
        catch (err) {
            throw new Error(`oidcTokenFilePath ${oidcTokenFilePath} cannot be read.`);
        }
        return oidcToken;
    }
    async updateCredential() {
        const oidcToken = this.getOdicToken(this.oidcTokenFilePath);
        const params = {
            Action: 'AssumeRoleWithOIDC',
            RoleArn: this.roleArn,
            OIDCProviderArn: this.oidcProviderArn,
            OIDCToken: oidcToken,
            DurationSeconds: this.durationSeconds,
            RoleSessionName: this.roleSessionName
        };
        if (this.policy) {
            params.policy = this.policy;
        }
        const json = await http_1.request(this.host, params, this.runtime);
        this.sessionCredential = json.Credentials;
    }
}
exports.default = OidcRoleArnCredential;
//# sourceMappingURL=oidc_role_arn_credential.js.map
}, function(modId) { var map = {"./session_credential":1770126800963,"./util/http":1770126800966,"./config":1770126800960}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800970, function(require, module, exports) {

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
const fs_1 = __importDefault(require("fs"));
const session_credential_1 = __importDefault(require("./session_credential"));
const utils = __importStar(require("./util/utils"));
const http_1 = require("./util/http");
const config_1 = __importDefault(require("./config"));
const SECURITY_CRED_URL = 'http://100.100.100.200/latest/meta-data/ram/security-credentials/';
class RsaKeyPairCredential extends session_credential_1.default {
    constructor(publicKeyId, privateKeyFile) {
        if (!publicKeyId) {
            throw new Error('Missing required publicKeyId option in config for rsa_key_pair');
        }
        if (!privateKeyFile) {
            throw new Error('Missing required privateKeyFile option in config for rsa_key_pair');
        }
        if (!fs_1.default.existsSync(privateKeyFile)) {
            throw new Error(`privateKeyFile ${privateKeyFile} cannot be empty`);
        }
        const conf = new config_1.default({
            type: 'rsa_key_pair'
        });
        super(conf);
        this.privateKey = utils.parseFile(privateKeyFile);
        this.publicKeyId = publicKeyId;
    }
    async updateCredential() {
        const url = SECURITY_CRED_URL + this.roleName;
        const json = await http_1.request(url, {
            accessKeyId: this.publicKeyId,
            action: 'GenerateSessionAccessKey',
            durationSeconds: 3600,
            signatureMethod: 'SHA256withRSA',
            signatureType: 'PRIVATEKEY',
        }, {}, this.privateKey);
        this.sessionCredential = json.Credentials;
    }
}
exports.default = RsaKeyPairCredential;
//# sourceMappingURL=rsa_key_pair_credential.js.map
}, function(modId) { var map = {"./session_credential":1770126800963,"./util/utils":1770126800964,"./util/http":1770126800966,"./config":1770126800960}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800971, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const default_credential_1 = __importDefault(require("./default_credential"));
const config_1 = __importDefault(require("./config"));
class BearerTokenCredential extends default_credential_1.default {
    constructor(bearerToken) {
        if (!bearerToken) {
            throw new Error('Missing required bearerToken option in config for bearer');
        }
        const conf = new config_1.default({
            type: 'bearer'
        });
        super(conf);
        this.bearerToken = bearerToken;
    }
}
exports.default = BearerTokenCredential;
//# sourceMappingURL=bearer_token_credential.js.map
}, function(modId) { var map = {"./default_credential":1770126800958,"./config":1770126800960}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800972, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCredentials = void 0;
const environment_variable_credentials_provider_1 = __importDefault(require("./environment_variable_credentials_provider"));
const profile_credentials_provider_1 = __importDefault(require("./profile_credentials_provider"));
const instance_ram_role_credentials_provider_1 = __importDefault(require("./instance_ram_role_credentials_provider"));
const credentials_uri_provider_1 = __importDefault(require("./credentials_uri_provider"));
const oidc_role_arn_credentials_provider_1 = __importDefault(require("./oidc_role_arn_credentials_provider"));
const defaultProviders = [
    environment_variable_credentials_provider_1.default,
    oidc_role_arn_credentials_provider_1.default,
    profile_credentials_provider_1.default,
    instance_ram_role_credentials_provider_1.default,
    credentials_uri_provider_1.default
];
function getCredentials(providers = null) {
    const providerChain = providers || defaultProviders;
    for (const provider of providerChain) {
        const credential = provider.getCredential();
        if (credential) {
            return credential;
        }
    }
    return null;
}
exports.getCredentials = getCredentials;
//# sourceMappingURL=provider_chain.js.map
}, function(modId) { var map = {"./environment_variable_credentials_provider":1770126800973,"./profile_credentials_provider":1770126800974,"./instance_ram_role_credentials_provider":1770126800975,"./credentials_uri_provider":1770126800976,"./oidc_role_arn_credentials_provider":1770126800978}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800973, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const access_key_credential_1 = __importDefault(require("../access_key_credential"));
exports.default = {
    getCredential() {
        const accessKeyId = process.env.ALIBABA_CLOUD_ACCESS_KEY_ID;
        const accessKeySecret = process.env.ALIBABA_CLOUD_ACCESS_KEY_SECRET;
        if (accessKeyId === undefined || accessKeySecret === undefined) {
            return null;
        }
        if (accessKeyId === null || accessKeyId === '') {
            throw new Error('Environment variable ALIBABA_CLOUD_ACCESS_KEY_ID cannot be empty');
        }
        if (accessKeySecret === null || accessKeySecret === '') {
            throw new Error('Environment variable ALIBABA_CLOUD_ACCESS_KEY_SECRET cannot be empty');
        }
        return new access_key_credential_1.default(accessKeyId, accessKeySecret);
    }
};
//# sourceMappingURL=environment_variable_credentials_provider.js.map
}, function(modId) { var map = {"../access_key_credential":1770126800957}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800974, function(require, module, exports) {

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
const access_key_credential_1 = __importDefault(require("../access_key_credential"));
const sts_token_credential_1 = __importDefault(require("../sts_token_credential"));
const ecs_ram_role_credential_1 = __importDefault(require("../ecs_ram_role_credential"));
const ram_role_arn_credential_1 = __importDefault(require("../ram_role_arn_credential"));
const oidc_role_arn_credential_1 = __importDefault(require("../oidc_role_arn_credential"));
const rsa_key_pair_credential_1 = __importDefault(require("../rsa_key_pair_credential"));
const bearer_token_credential_1 = __importDefault(require("../bearer_token_credential"));
const utils = __importStar(require("../util/utils"));
const fs_1 = __importDefault(require("fs"));
const config_1 = __importDefault(require("../config"));
const DEFAULT_PATH = process.env.HOME + '/.alibabacloud/credentials';
exports.default = {
    getCredential(credentialName = 'default') {
        let fileContent = null;
        const credentialFile = process.env.ALIBABA_CLOUD_CREDENTIALS_FILE;
        if (credentialFile === undefined) {
            if (fs_1.default.existsSync(DEFAULT_PATH)) {
                const content = utils.parseFile(DEFAULT_PATH, true);
                if (content) {
                    fileContent = content;
                }
            }
        }
        else {
            if (credentialFile === null || credentialFile === '') {
                throw new Error('Environment variable credentialFile cannot be empty');
            }
            if (!fs_1.default.existsSync(credentialFile)) {
                throw new Error(`credentialFile ${credentialFile} cannot be empty`);
            }
            fileContent = utils.parseFile(credentialFile);
        }
        if (!fileContent) {
            return null;
        }
        const config = fileContent[credentialName] || {};
        if (!config.type) {
            throw new Error('Missing required type option in credentialFile');
        }
        switch (config.type) {
            case 'access_key':
                return new access_key_credential_1.default(config.access_key_id, config.access_key_secret);
            case 'sts':
                return new sts_token_credential_1.default(config.access_key_id, config.access_key_secret, config.security_token);
            case 'ecs_ram_role':
                return new ecs_ram_role_credential_1.default(config.role_name);
            case 'ram_role_arn': {
                const conf = new config_1.default({
                    roleArn: config.role_arn,
                    accessKeyId: config.access_key_id,
                    accessKeySecret: config.access_key_secret
                });
                return new ram_role_arn_credential_1.default(conf);
            }
            case 'oidc_role_arn':
                const conf = new config_1.default({
                    roleArn: config.role_arn,
                    oidcProviderArn: config.oidc_provider_arn,
                    oidcTokenFilePath: config.oidc_token_file_path
                });
                return new oidc_role_arn_credential_1.default(conf);
            case 'rsa_key_pair':
                return new rsa_key_pair_credential_1.default(config.public_key_id, config.private_key_file);
            case 'bearer':
                return new bearer_token_credential_1.default(config.bearer_token);
            default:
                throw new Error('Invalid type option, support: access_key, sts, ecs_ram_role, ram_role_arn, oidc_role_arn, rsa_key_pair, bearer');
        }
    }
};
//# sourceMappingURL=profile_credentials_provider.js.map
}, function(modId) { var map = {"../access_key_credential":1770126800957,"../sts_token_credential":1770126800961,"../ecs_ram_role_credential":1770126800962,"../ram_role_arn_credential":1770126800965,"../oidc_role_arn_credential":1770126800969,"../rsa_key_pair_credential":1770126800970,"../bearer_token_credential":1770126800971,"../util/utils":1770126800964,"../config":1770126800960}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800975, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ecs_ram_role_credential_1 = __importDefault(require("../ecs_ram_role_credential"));
exports.default = {
    getCredential() {
        const roleName = process.env.ALIBABA_CLOUD_ECS_METADATA;
        if (roleName && roleName.length) {
            return new ecs_ram_role_credential_1.default(roleName);
        }
        return null;
    }
};
//# sourceMappingURL=instance_ram_role_credentials_provider.js.map
}, function(modId) { var map = {"../ecs_ram_role_credential":1770126800962}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800976, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const uri_credential_1 = __importDefault(require("../uri_credential"));
exports.default = {
    getCredential() {
        const credentialsURI = process.env.ALIBABA_CLOUD_CREDENTIALS_URI;
        if (credentialsURI) {
            return new uri_credential_1.default(credentialsURI);
        }
        return null;
    }
};
//# sourceMappingURL=credentials_uri_provider.js.map
}, function(modId) { var map = {"../uri_credential":1770126800977}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800977, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const httpx_1 = __importDefault(require("httpx"));
const config_1 = __importDefault(require("./config"));
const session_credential_1 = __importDefault(require("./session_credential"));
class URICredential extends session_credential_1.default {
    constructor(uri) {
        const conf = new config_1.default({
            type: 'credentials_uri',
            credentialsURI: uri
        });
        super(conf);
        if (!uri) {
            this.credentialsURI = process.env['ALIBABA_CLOUD_CREDENTIALS_URI'];
        }
        else {
            this.credentialsURI = uri;
        }
        if (!this.credentialsURI) {
            throw new Error('Missing required credentialsURI option in config or environment variable for credentials_uri');
        }
    }
    async updateCredential() {
        const url = this.credentialsURI;
        const response = await httpx_1.default.request(url, {});
        if (response.statusCode !== 200) {
            throw new Error(`Get credentials from ${url} failed, status code is ${response.statusCode}`);
        }
        const body = (await httpx_1.default.read(response, 'utf8'));
        let json;
        try {
            json = JSON.parse(body);
        }
        catch (ex) {
            throw new Error(`Get credentials from ${url} failed, unmarshal response failed, JSON is: ${body}`);
        }
        if (json.Code !== 'Success') {
            throw new Error(`Get credentials from ${url} failed, Code is ${json.Code}`);
        }
        this.sessionCredential = {
            AccessKeyId: json.AccessKeyId,
            AccessKeySecret: json.AccessKeySecret,
            Expiration: json.Expiration,
            SecurityToken: json.SecurityToken,
        };
    }
}
exports.default = URICredential;
//# sourceMappingURL=uri_credential.js.map
}, function(modId) { var map = {"./config":1770126800960,"./session_credential":1770126800963}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126800978, function(require, module, exports) {

var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const oidc_role_arn_credential_1 = __importDefault(require("../oidc_role_arn_credential"));
const config_1 = __importDefault(require("../config"));
exports.default = {
    getCredential() {
        if (process.env.ALIBABA_CLOUD_ROLE_ARN
            && process.env.ALIBABA_CLOUD_OIDC_PROVIDER_ARN
            && process.env.ALIBABA_CLOUD_OIDC_TOKEN_FILE) {
            return new oidc_role_arn_credential_1.default(new config_1.default({}));
        }
        return null;
    }
};
//# sourceMappingURL=oidc_role_arn_credentials_provider.js.map
}, function(modId) { var map = {"../oidc_role_arn_credential":1770126800969,"../config":1770126800960}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1770126800956);
})()
//miniprogram-npm-outsideDeps=["@alicloud/tea-typescript","httpx","ini","kitx","fs","os"]
//# sourceMappingURL=index.js.map