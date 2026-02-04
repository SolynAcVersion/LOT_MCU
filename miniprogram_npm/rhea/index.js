module.exports = (function() {
var __MODS__ = {};
var __DEFINE__ = function(modId, func, req) { var m = { exports: {}, _tempexports: {} }; __MODS__[modId] = { status: 0, func: func, req: req, m: m }; };
var __REQUIRE__ = function(modId, source) { if(!__MODS__[modId]) return require(source); if(!__MODS__[modId].status) { var m = __MODS__[modId].m; m._exports = m._tempexports; var desp = Object.getOwnPropertyDescriptor(m, "exports"); if (desp && desp.configurable) Object.defineProperty(m, "exports", { set: function (val) { if(typeof val === "object" && val !== m._exports) { m._exports.__proto__ = val.__proto__; Object.keys(val).forEach(function (k) { m._exports[k] = val[k]; }); } m._tempexports = val }, get: function () { return m._tempexports; } }); __MODS__[modId].status = 1; __MODS__[modId].func(__MODS__[modId].req, m, m.exports); } return __MODS__[modId].m.exports; };
var __REQUIRE_WILDCARD__ = function(obj) { if(obj && obj.__esModule) { return obj; } else { var newObj = {}; if(obj != null) { for(var k in obj) { if (Object.prototype.hasOwnProperty.call(obj, k)) newObj[k] = obj[k]; } } newObj.default = obj; return newObj; } };
var __REQUIRE_DEFAULT__ = function(obj) { return obj && obj.__esModule ? obj.default : obj; };
__DEFINE__(1770126801031, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var Connection = require('./connection.js');
var log = require('./log.js');
var sasl = require('./sasl.js');
var util = require('./util.js');
var eventTypes = require('./eventTypes.js');

var net = require('net');
var tls = require('tls');
var EventEmitter = require('events').EventEmitter;

var Container = function (options) {
    this.options = options ? Object.create(options) : {};
    if (!this.options.id) {
        this.options.id = util.generate_uuid();
    }
    this.id = this.options.id;
    this.sasl_server_mechanisms = sasl.server_mechanisms();
};

Container.prototype = Object.create(EventEmitter.prototype);
Container.prototype.constructor = Container;
Container.prototype.dispatch = function(name) {
    log.events('[%s] Container got event: ' + name, this.id);
    EventEmitter.prototype.emit.apply(this, arguments);
    if (this.listeners(name).length) {
        return true;
    } else {
        return false;
    }
};

Container.prototype.connect = function (options) {
    return new Connection(options, this).connect();
};

Container.prototype.create_connection = function (options) {
    return new Connection(options, this);
};

Container.prototype.listen = function (options) {
    var container = this;
    var server;
    if (options.transport === undefined || options.transport === 'tcp') {
        server = net.createServer(options);
        server.on('connection', function (socket) {
            new Connection(options, container).accept(socket);
        });
    } else if (options.transport === 'tls' || options.transport === 'ssl') {
        server = tls.createServer(options);
        server.on('secureConnection', function (socket) {
            new Connection(options, container).accept(socket);
        });
    } else {
        throw Error('Unrecognised transport: ' + options.transport);
    }
    if (process.version.match(/v0\.10\.\d+/)) {
        server.listen(options.port, options.host);
    } else {
        server.listen(options);
    }
    return server;
};

Container.prototype.create_container = function (options) {
    return new Container(options);
};

Container.prototype.get_option = function (name, default_value) {
    if (this.options[name] !== undefined) return this.options[name];
    else return default_value;
};

Container.prototype.generate_uuid = util.generate_uuid;
Container.prototype.string_to_uuid = util.string_to_uuid;
Container.prototype.uuid_to_string = util.uuid_to_string;
var ws = require('./ws.js');
Container.prototype.websocket_accept = function(socket, options) {
    new Connection(options, this).accept(ws.wrap(socket));
};
Container.prototype.websocket_connect = ws.connect;
Container.prototype.filter = require('./filter.js');
Container.prototype.types = require('./types.js');
Container.prototype.message = require('./message.js');
Container.prototype.sasl = sasl;
Container.prototype.ReceiverEvents = eventTypes.ReceiverEvents;
Container.prototype.SenderEvents = eventTypes.SenderEvents;
Container.prototype.SessionEvents = eventTypes.SessionEvents;
Container.prototype.ConnectionEvents = eventTypes.ConnectionEvents;

module.exports = new Container();

}, function(modId) {var map = {"./connection.js":1770126801032,"./log.js":1770126801037,"./sasl.js":1770126801038,"./util.js":1770126801034,"./eventTypes.js":1770126801045,"./ws.js":1770126801046,"./filter.js":1770126801047,"./types.js":1770126801036,"./message.js":1770126801043}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801032, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var errors = require('./errors.js');
var frames = require('./frames.js');
var log = require('./log.js');
var sasl = require('./sasl.js');
var util = require('./util.js');
var EndpointState = require('./endpoint.js');
var Session = require('./session.js');
var Transport = require('./transport.js');

var fs = require('fs');
var os = require('os');
var path = require('path');
var net = require('net');
var tls = require('tls');
var EventEmitter = require('events').EventEmitter;

var AMQP_PROTOCOL_ID = 0x00;

function find_connect_config() {
    var paths;
    if (process.env.MESSAGING_CONNECT_FILE) {
        paths = [process.env.MESSAGING_CONNECT_FILE];
    } else {
        paths = [process.cwd(), path.join(os.homedir(), '.config/messaging'),'/etc/messaging'].map(function (base) { return path.join(base, '/connect.json'); });
    }
    for (var i = 0; i < paths.length; i++) {
        if (fs.existsSync(paths[i])) {
            var obj = JSON.parse(fs.readFileSync(paths[i], 'utf8'));
            log.config('using config from %s: %j', paths[i], obj);
            return obj;
        }
    }
    return {};
}

function get_default_connect_config() {
    var config = find_connect_config();
    var options = {};
    if (config.scheme === 'amqps') options.transport = 'tls';
    if (config.host) options.host = config.host;
    if(config.port === 'amqp') options.port = 5672;
    else if(config.port === 'amqps') options.port = 5671;
    else options.port = config.port;
    if (!(config.sasl && config.sasl.enabled === false)) {
        if (config.user) options.username = config.user;
        else options.username = 'anonymous';
        if (config.password) options.password = config.password;
        if (config.sasl_mechanisms) options.sasl_mechanisms = config.sasl_mechanisms;
    }
    if (config.tls) {
        if (config.tls.key) options.key = fs.readFileSync(config.tls.key);
        if (config.tls.cert) options.cert = fs.readFileSync(config.tls.cert);
        if (config.tls.ca) options.ca = [ fs.readFileSync(config.tls.ca) ];
        if (config.verify === false || config.tls.verify === false) options.rejectUnauthorized = false;
    }
    if (options.transport === 'tls') {
        options.servername = options.host;
    }
    return options;
}

function get_socket_id(socket) {
    if (socket.get_id_string) return socket.get_id_string();
    return socket.localAddress + ':' + socket.localPort + ' -> ' + socket.remoteAddress + ':' + socket.remotePort;
}

function session_per_connection(conn) {
    var ssn = null;
    return {
        'get_session' : function () {
            if (!ssn) {
                ssn = conn.create_session();
                ssn.observers.on('session_close', function () { ssn = null; });
                ssn.begin();
            }
            return ssn;
        }
    };
}

function restrict(count, f) {
    if (count) {
        var current = count;
        var reset;
        return function (successful_attempts) {
            if (reset !== successful_attempts) {
                current = count;
                reset = successful_attempts;
            }
            if (current--) return f(successful_attempts);
            else return -1;
        };
    } else {
        return f;
    }
}

function backoff(initial, max) {
    var delay = initial;
    var reset;
    return function (successful_attempts) {
        if (reset !== successful_attempts) {
            delay = initial;
            reset = successful_attempts;
        }
        var current = delay;
        var next = delay*2;
        delay = max > next ? next : max;
        return current;
    };
}

function get_connect_fn(options) {
    if (options.transport === undefined || options.transport === 'tcp') {
        return net.connect;
    } else if (options.transport === 'tls' || options.transport === 'ssl') {
        return tls.connect;
    } else {
        throw Error('Unrecognised transport: ' + options.transport);
    }
}

function connection_details(options) {
    var details = {};
    details.connect = options.connect ? options.connect : get_connect_fn(options);
    details.host = options.host ? options.host : 'localhost';
    details.port = options.port ? options.port : 5672;
    details.options = options;
    return details;
}

var aliases = [
    'container_id',
    'hostname',
    'max_frame_size',
    'channel_max',
    'idle_time_out',
    'outgoing_locales',
    'incoming_locales',
    'offered_capabilities',
    'desired_capabilities',
    'properties'
];

function remote_property_shortcut(name) {
    return function() { return this.remote.open ? this.remote.open[name] : undefined; };
}

function connection_fields(fields) {
    var o = {};
    aliases.forEach(function (name) {
        if (fields[name] !== undefined) {
            o[name] = fields[name];
        }
    });
    return o;
}

function set_reconnect(reconnect, connection) {
    if (typeof reconnect === 'boolean') {
        if (reconnect) {
            var initial = connection.get_option('initial_reconnect_delay', 100);
            var max = connection.get_option('max_reconnect_delay', 60000);
            connection.options.reconnect = restrict(
                connection.get_option('reconnect_limit'),
                backoff(initial, max)
            );
        } else {
            connection.options.reconnect = false;
        }
    } else if (typeof reconnect === 'number') {
        var fixed = connection.options.reconnect;
        connection.options.reconnect = restrict(
            connection.get_option('reconnect_limit'),
            function() {
                return fixed;
            }
        );
    }
}

var conn_counter = 1;

var Connection = function (options, container) {
    this.options = {};
    if (options) {
        for (var k in options) {
            this.options[k] = options[k];
        }
        if ((options.transport === 'tls' || options.transport === 'ssl')
            && options.servername === undefined && options.host !== undefined) {
            this.options.servername = options.host;
        }
    } else {
        this.options = get_default_connect_config();
    }
    this.container = container;
    if (!this.options.id) {
        this.options.id = 'connection-' + conn_counter++;
    }
    if (!this.options.container_id) {
        this.options.container_id = container ? container.id : util.generate_uuid();
    }
    if (!this.options.connection_details) {
        var self = this;
        this.options.connection_details = function() { return connection_details(self.options); };
    }
    var reconnect = this.get_option('reconnect', true);
    set_reconnect(reconnect, this);
    this.registered = false;
    this.state = new EndpointState();
    this.local_channel_map = {};
    this.remote_channel_map = {};
    this.local = {};
    this.remote = {};
    this.local.open = frames.open(connection_fields(this.options));
    this.local.close = frames.close({});
    this.session_policy = session_per_connection(this);
    this.amqp_transport = new Transport(this.options.id, AMQP_PROTOCOL_ID, frames.TYPE_AMQP, this);
    this.sasl_transport = undefined;
    this.transport = this.amqp_transport;
    this.conn_established_counter = 0;
    this.heartbeat_out = undefined;
    this.heartbeat_in = undefined;
    this.abort_idle = undefined;
    this.socket_ready = false;
    this.scheduled_reconnect = undefined;
    this.default_sender = undefined;
    this.closed_with_non_fatal_error = false;

    var self = this;
    aliases.forEach(function (alias) { Object.defineProperty(self, alias, { get: remote_property_shortcut(alias) }); });
    Object.defineProperty(this, 'error', { get:  function() { return this.remote.close ? this.remote.close.error : undefined; }});
};

Connection.prototype = Object.create(EventEmitter.prototype);
Connection.prototype.constructor = Connection;
Connection.prototype.dispatch = function(name) {
    log.events('[%s] Connection got event: %s', this.options.id, name);
    if (this.listeners(name).length) {
        EventEmitter.prototype.emit.apply(this, arguments);
        return true;
    } else if (this.container) {
        return this.container.dispatch.apply(this.container, arguments);
    } else {
        return false;
    }
};

Connection.prototype._disconnect = function() {
    this.state.disconnected();
    for (var k in this.local_channel_map) {
        this.local_channel_map[k]._disconnect();
    }
    this.socket_ready = false;
};

Connection.prototype._reconnect = function() {
    if (this.abort_idle) {
        clearTimeout(this.abort_idle);
        this.abort_idle = undefined;
        this.local.close.error = undefined;
        this.state = new EndpointState();
        this.state.open();
    }

    this.state.reconnect();
    this._reset_remote_state();
};

Connection.prototype._reset_remote_state = function() {
    //reset transport
    this.amqp_transport = new Transport(this.options.id, AMQP_PROTOCOL_ID, frames.TYPE_AMQP, this);
    this.sasl_transport = undefined;
    this.transport = this.amqp_transport;

    //reset remote endpoint state
    this.remote = {};
    //reset sessions:
    this.remote_channel_map = {};
    var localChannelMap = this.local_channel_map;
    for (var k in localChannelMap) {
        localChannelMap[k]._reconnect();
    }
};

Connection.prototype.connect = function () {
    this.is_server = false;
    if (this.abort_idle) {
        clearTimeout(this.abort_idle);
        this.abort_idle = undefined;
    }
    this._reset_remote_state();
    this._connect(this.options.connection_details(this.conn_established_counter));
    this.open();
    return this;
};

Connection.prototype.reconnect = function () {
    this.scheduled_reconnect = undefined;
    log.reconnect('[%s] reconnecting...', this.options.id);
    this._reconnect();
    this._connect(this.options.connection_details(this.conn_established_counter));
    process.nextTick(this._process.bind(this));
    return this;
};

Connection.prototype.set_reconnect = function (reconnect) {
    set_reconnect(reconnect, this);
};

Connection.prototype._connect = function (details) {
    if (details.connect) {
        this.init(details.connect(details.port, details.host, details.options, this.connected.bind(this)));
    } else {
        this.init(get_connect_fn(details)(details.port, details.host, details.options, this.connected.bind(this)));
    }
    return this;
};

Connection.prototype.accept = function (socket) {
    this.is_server = true;
    log.io('[%s] client accepted: %s', this.id, get_socket_id(socket));
    this.socket_ready = true;
    return this.init(socket);
};


Connection.prototype.abort_socket = function (socket) {
    if (socket === this.socket) {
        this.abort_idle = undefined;
        log.io('[%s] aborting socket', this.options.id);
        this.socket.end();
        if (this.socket.removeAllListeners) {
            this.socket.removeAllListeners('data');
            this.socket.removeAllListeners('error');
            this.socket.removeAllListeners('end');
        }
        if (typeof this.socket.destroy === 'function') {
            this.socket.destroy();
        }
        this._disconnected();
    }
};

Connection.prototype.init = function (socket) {
    this.socket = socket;
    if (this.get_option('tcp_no_delay', false) && this.socket.setNoDelay) {
        this.socket.setNoDelay(true);
    }
    this.socket.on('data', this.input.bind(this));
    this.socket.on('error', this.on_error.bind(this));
    this.socket.on('end', this.eof.bind(this));

    if (this.is_server) {
        var mechs;
        if (this.container && Object.getOwnPropertyNames(this.container.sasl_server_mechanisms).length) {
            mechs = this.container.sasl_server_mechanisms;
        }
        if (this.socket.encrypted && this.socket.authorized && this.get_option('enable_sasl_external', false)) {
            mechs = sasl.server_add_external(mechs ? util.clone(mechs) : {});
        }
        if (mechs) {
            if (mechs.ANONYMOUS !== undefined && !this.get_option('require_sasl', false)) {
                this.sasl_transport = new sasl.Selective(this, mechs);
            } else {
                this.sasl_transport = new sasl.Server(this, mechs);
            }
        } else {
            if (!this.get_option('disable_sasl', false)) {
                var anon = sasl.server_mechanisms();
                anon.enable_anonymous();
                this.sasl_transport = new sasl.Selective(this, anon);
            }
        }
    } else {
        var mechanisms = this.get_option('sasl_mechanisms');
        if (!mechanisms) {
            var username = this.get_option('username');
            var password = this.get_option('password');
            var token = this.get_option('token');
            if (username) {
                mechanisms = sasl.client_mechanisms();
                if (password) mechanisms.enable_plain(username, password);
                else if (token) mechanisms.enable_xoauth2(username, token);
                else mechanisms.enable_anonymous(username);
            }
        }
        if (this.socket.encrypted && this.options.cert && this.get_option('enable_sasl_external', false)) {
            if (!mechanisms) mechanisms = sasl.client_mechanisms();
            mechanisms.enable_external();
        }

        if (mechanisms) {
            this.sasl_transport = new sasl.Client(this, mechanisms, this.options.sasl_init_hostname || this.options.servername || this.options.host);
        }
    }
    this.transport = this.sasl_transport ? this.sasl_transport : this.amqp_transport;
    return this;
};

Connection.prototype.attach_sender = function (options) {
    return this.session_policy.get_session().attach_sender(options);
};
Connection.prototype.open_sender = Connection.prototype.attach_sender;//alias

Connection.prototype.attach_receiver = function (options) {
    if (this.get_option('tcp_no_delay', true) && this.socket.setNoDelay) {
        this.socket.setNoDelay(true);
    }
    return this.session_policy.get_session().attach_receiver(options);
};
Connection.prototype.open_receiver = Connection.prototype.attach_receiver;//alias

Connection.prototype.get_option = function (name, default_value) {
    if (this.options[name] !== undefined) return this.options[name];
    else if (this.container) return this.container.get_option(name, default_value);
    else return default_value;
};

Connection.prototype.send = function(msg) {
    if (this.default_sender === undefined) {
        this.default_sender = this.open_sender({target:{}});
    }
    return this.default_sender.send(msg);
};

Connection.prototype.connected = function () {
    this.socket_ready = true;
    this.conn_established_counter++;
    log.io('[%s] connected %s', this.options.id, get_socket_id(this.socket));
    this.output();
};

Connection.prototype.sasl_failed = function (text, condition) {
    this.transport_error = new errors.ConnectionError(text, condition ? condition : 'amqp:unauthorized-access', this);
    this._handle_error();
    this.socket.end();
};

Connection.prototype._is_fatal = function (error_condition) {
    var all_errors_non_fatal = this.get_option('all_errors_non_fatal', false);
    if (all_errors_non_fatal) {
        return false;
    } else {
        var non_fatal = this.get_option('non_fatal_errors', ['amqp:connection:forced']);
        return non_fatal.indexOf(error_condition) < 0;
    }
};

Connection.prototype._handle_error = function () {
    var error = this.get_error();
    if (error) {
        var handled = this.dispatch('connection_error', this._context({error:error}));
        handled = this.dispatch('connection_close', this._context({error:error})) || handled;

        if (!this._is_fatal(error.condition)) {
            if (this.state.local_open) {
                this.closed_with_non_fatal_error = true;
            }
        } else if (!handled) {
            this.dispatch('error', new errors.ConnectionError(error.description, error.condition, this));
        }
        return true;
    } else {
        return false;
    }
};

Connection.prototype.get_error = function () {
    if (this.transport_error) return this.transport_error;
    if (this.remote.close && this.remote.close.error) {
        return new errors.ConnectionError(this.remote.close.error.description, this.remote.close.error.condition, this);
    }
    return undefined;
};

Connection.prototype._get_peer_details = function () {
    var s = '';
    if (this.remote.open && this.remote.open.container) {
        s += this.remote.open.container + ' ';
    }
    if (this.remote.open && this.remote.open.properties) {
        s += JSON.stringify(this.remote.open.properties);
    }
    return s;
};

Connection.prototype.output = function () {
    try {
        if (this.socket && this.socket_ready) {
            if (this.heartbeat_out) clearTimeout(this.heartbeat_out);
            this.transport.write(this.socket);
            if (((this.is_closed() && this.state.has_settled()) || this.abort_idle || this.transport_error) && !this.transport.has_writes_pending()) {
                this.socket.end();
            } else if (this.is_open() && this.remote.open.idle_time_out) {
                this.heartbeat_out = setTimeout(this._write_frame.bind(this), this.remote.open.idle_time_out / 2);
            }
            if (this.local.open.idle_time_out && this.heartbeat_in === undefined) {
                this.heartbeat_in = setTimeout(this.idle.bind(this), this.local.open.idle_time_out);
            }
        }
    } catch (e) {
        this.saved_error = e;
        if (e.name === 'ProtocolError') {
            console.error('[' + this.options.id + '] error on write: ' + e + ' ' + this._get_peer_details() + ' ' + e.name);
            this.dispatch('protocol_error', e) || console.error('[' + this.options.id + '] error on write: ' + e + ' ' + this._get_peer_details());
        } else {
            this.dispatch('error', e);
        }
        this.socket.end();
    }
};

function byte_to_hex(value) {
    if (value < 16) return '0x0' + Number(value).toString(16);
    else return '0x' + Number(value).toString(16);
}

function buffer_to_hex(buffer) {
    var bytes = [];
    for (var i = 0; i < buffer.length; i++) {
        bytes.push(byte_to_hex(buffer[i]));
    }
    return bytes.join(',');
}

Connection.prototype.input = function (buff) {
    var buffer;
    try {
        if (this.heartbeat_in) clearTimeout(this.heartbeat_in);
        log.io('[%s] read %d bytes', this.options.id, buff.length);
        if (this.frame_size) {
            this.received_bytes += buff.length;
            this.chunks.push(buff);
            if (this.frame_size <= this.received_bytes) {
                buffer = Buffer.concat(this.chunks, this.received_bytes);
                this.chunks = null;
                this.frame_size = undefined;
            } else {
                log.io('[%s] pushed %d bytes', this.options.id, buff.length);
                return;
            }
        } else if (this.previous_input) {
            buffer = Buffer.concat([this.previous_input, buff]);
            this.previous_input = null;
        } else {
            buffer = buff;
        }
        const read = this.transport.read(buffer, this);
        if (read < buffer.length) {
            const previous_input = buffer.slice(read);
            this.frame_size = this.transport.peek_size(previous_input);
            if (this.frame_size) {
                this.chunks = [previous_input];
                this.received_bytes = previous_input.length;
                log.io('[%s] waiting frame_size %s', this.options.id, this.frame_size);
            } else {
                this.previous_input = previous_input;
            }
        }
        if (this.local.open.idle_time_out) this.heartbeat_in = setTimeout(this.idle.bind(this), this.local.open.idle_time_out);
        if (this.transport.has_writes_pending()) {
            this.output();
        } else if (this.is_closed() && this.state.has_settled()) {
            this.socket.end();
        } else if (this.is_open() && this.remote.open.idle_time_out && !this.heartbeat_out) {
            this.heartbeat_out = setTimeout(this._write_frame.bind(this), this.remote.open.idle_time_out / 2);
        }
    } catch (e) {
        this.saved_error = e;
        if (e.name === 'ProtocolError') {
            this.dispatch('protocol_error', e) ||
                console.error('[' + this.options.id + '] error on read: ' + e + ' ' + this._get_peer_details() + ' (buffer:' + buffer_to_hex(buffer) + ')');
        } else {
            this.dispatch('error', e);
        }
        this.socket.end();
    }

};

Connection.prototype.idle = function () {
    if (!this.is_closed()) {
        this.closed_with_non_fatal_error = true;
        this.local.close.error = {condition:'amqp:resource-limit-exceeded', description:'max idle time exceeded'};
        this.close();
        this.abort_idle = setTimeout(this.abort_socket.bind(this, this.socket), 1000);
    }
};

Connection.prototype.on_error = function (e) {
    this._disconnected(e);
};

Connection.prototype.eof = function (e) {
    var error = e || this.saved_error;
    this.saved_error = undefined;
    this._disconnected(error);
};

Connection.prototype._disconnected = function (error) {
    if (this.heartbeat_out) {
        clearTimeout(this.heartbeat_out);
        this.heartbeat_out = undefined;
    }
    if (this.heartbeat_in) {
        clearTimeout(this.heartbeat_in);
        this.heartbeat_in = undefined;
    }
    if (this.abort_idle) {
        clearTimeout(this.abort_idle);
        this.abort_idle = undefined;
    }
    var was_closed_with_non_fatal_error = this.closed_with_non_fatal_error;
    if (this.closed_with_non_fatal_error) {
        this.closed_with_non_fatal_error = false;
        if (this.options.reconnect) this.open();
    }
    if ((!this.is_closed() || was_closed_with_non_fatal_error) && this.scheduled_reconnect === undefined) {
        this._disconnect();
        var disconnect_ctxt = {};
        if (error) {
            disconnect_ctxt.error = error;
        }
        if (!this.is_server && !this.transport_error && this.options.reconnect) {
            var delay = this.options.reconnect(this.conn_established_counter);
            if (delay >= 0) {
                log.reconnect('[%s] Scheduled reconnect in ' + delay + 'ms', this.options.id);
                this.scheduled_reconnect = setTimeout(this.reconnect.bind(this), delay);
                disconnect_ctxt.reconnecting = true;
            } else {
                disconnect_ctxt.reconnecting = false;
            }
        }
        if (!this.dispatch('disconnected', this._context(disconnect_ctxt))) {
            console.warn('[' + this.options.id + '] disconnected %s', disconnect_ctxt.error || '');
        }
    }
};

Connection.prototype.open = function () {
    if (this.state.open()) {
        this._register();
    }
};

Connection.prototype.close = function (error) {
    if (error) this.local.close.error = error;
    if (this.state.close()) {
        this._register();
    }
};

Connection.prototype.is_open = function () {
    return this.state.is_open();
};

Connection.prototype.is_remote_open = function () {
    return this.state.remote_open;
};

Connection.prototype.is_closed = function () {
    return this.state.is_closed();
};

Connection.prototype.create_session = function () {
    var i = 0;
    while (this.local_channel_map[i]) i++;
    var session = new Session(this, i);
    this.local_channel_map[i] = session;
    return session;
};

Connection.prototype.find_sender = function (filter) {
    return this.find_link(util.sender_filter(filter));
};

Connection.prototype.find_receiver = function (filter) {
    return this.find_link(util.receiver_filter(filter));
};

Connection.prototype.find_link = function (filter) {
    for (var channel in this.local_channel_map) {
        var session = this.local_channel_map[channel];
        var result = session.find_link(filter);
        if (result) return result;
    }
    return undefined;
};

Connection.prototype.each_receiver = function (action, filter) {
    this.each_link(action, util.receiver_filter(filter));
};

Connection.prototype.each_sender = function (action, filter) {
    this.each_link(action, util.sender_filter(filter));
};

Connection.prototype.each_link = function (action, filter) {
    for (var channel in this.local_channel_map) {
        var session = this.local_channel_map[channel];
        session.each_link(action, filter);
    }
};

Connection.prototype.on_open = function (frame) {
    if (this.state.remote_opened()) {
        this.remote.open = frame.performative;
        this.open();
        this.dispatch('connection_open', this._context());
    } else {
        throw new errors.ProtocolError('Open already received');
    }
};

Connection.prototype.on_close = function (frame) {
    if (this.state.remote_closed()) {
        this.remote.close = frame.performative;
        if (this.remote.close.error) {
            this._handle_error();
        } else {
            this.dispatch('connection_close', this._context());
        }
        if (this.heartbeat_out) clearTimeout(this.heartbeat_out);
        var self = this;
        process.nextTick(function () {
            self.close();
        });
    } else {
        throw new errors.ProtocolError('Close already received');
    }
};

Connection.prototype._register = function () {
    if (!this.registered) {
        this.registered = true;
        process.nextTick(this._process.bind(this));
    }
};

Connection.prototype._process = function () {
    this.registered = false;
    do {
        if (this.state.need_open()) {
            this._write_open();
        }
        var localChannelMap = this.local_channel_map;
        for (var k in localChannelMap) {
            localChannelMap[k]._process();
        }
        if (this.state.need_close()) {
            this._write_close();
        }
    } while (!this.state.has_settled());
};

Connection.prototype._write_frame = function (channel, frame, payload) {
    this.amqp_transport.encode(frames.amqp_frame(channel, frame, payload));
    this.output();
};

Connection.prototype._write_open = function () {
    this._write_frame(0, this.local.open);
};

Connection.prototype._write_close = function () {
    this._write_frame(0, this.local.close);
    this.local.close.error = undefined;
};

Connection.prototype.on_begin = function (frame) {
    var session;
    if (frame.performative.remote_channel === null || frame.performative.remote_channel === undefined) {
        //peer initiated
        session = this.create_session();
        session.local.begin.remote_channel = frame.channel;
    } else {
        session = this.local_channel_map[frame.performative.remote_channel];
        if (!session) throw new errors.ProtocolError('Invalid value for remote channel ' + frame.performative.remote_channel);
    }
    session.on_begin(frame);
    this.remote_channel_map[frame.channel] = session;
};

Connection.prototype.get_peer_certificate = function() {
    if (this.socket && this.socket.getPeerCertificate) {
        return this.socket.getPeerCertificate();
    } else {
        return undefined;
    }
};

Connection.prototype.get_tls_socket = function() {
    if (this.socket && (this.options.transport === 'tls' || this.options.transport === 'ssl')) {
        return this.socket;
    } else {
        return undefined;
    }
};

Connection.prototype._context = function (c) {
    var context = c ? c : {};
    context.connection = this;
    if (this.container) context.container = this.container;
    return context;
};

Connection.prototype.remove_session = function (session) {
    if (this.remote_channel_map[session.remote.channel] === session) {
        delete this.remote_channel_map[session.remote.channel];
    }
    if (this.local_channel_map[session.local.channel] === session) {
        delete this.local_channel_map[session.local.channel];
    }
};

Connection.prototype.remove_all_sessions = function () {
    clearObject(this.remote_channel_map);
    clearObject(this.local_channel_map);
};

function clearObject(obj) {
    for (var k in obj) {
        if (!Object.prototype.hasOwnProperty.call(obj, k)) {
            continue;
        }
        delete obj[k];
    }
}

function delegate_to_session(name) {
    Connection.prototype['on_' + name] = function (frame) {
        var session = this.remote_channel_map[frame.channel];
        if (!session) {
            throw new errors.ProtocolError(name + ' received on invalid channel ' + frame.channel);
        }
        session['on_' + name](frame);
    };
}

delegate_to_session('end');
delegate_to_session('attach');
delegate_to_session('detach');
delegate_to_session('transfer');
delegate_to_session('disposition');
delegate_to_session('flow');

module.exports = Connection;

}, function(modId) { var map = {"./errors.js":1770126801033,"./frames.js":1770126801035,"./log.js":1770126801037,"./sasl.js":1770126801038,"./util.js":1770126801034,"./endpoint.js":1770126801040,"./session.js":1770126801041,"./transport.js":1770126801039}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801033, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var util = require('util');

function ProtocolError(message) {
    Error.captureStackTrace(this, ProtocolError);
    this.message = message;
    this.name = 'ProtocolError';
}
util.inherits(ProtocolError, Error);

function TypeError(message) {
    Error.captureStackTrace(this, TypeError);
    this.message = message;
    this.name = 'TypeError';
}
util.inherits(TypeError, ProtocolError);

function ConnectionError(message, condition, connection) {
    Error.captureStackTrace(this, ConnectionError);
    this.message = message;
    this.name = 'ConnectionError';
    this.condition = condition;
    this.description = message;
    Object.defineProperty(this, 'connection', { value: connection });
}
util.inherits(ConnectionError, Error);

ConnectionError.prototype.toJSON = function () {
    return {
        type: this.name,
        code: this.condition,
        message: this.description
    };
};

module.exports = {
    ProtocolError: ProtocolError,
    TypeError: TypeError,
    ConnectionError: ConnectionError
};

}, function(modId) { var map = {"util":1770126801034}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801034, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var errors = require('./errors.js');

var util = {};

util.allocate_buffer = function (size) {
    return Buffer.alloc ? Buffer.alloc(size) : new Buffer(size);
};

util.generate_uuid = function () {
    return util.uuid_to_string(util.uuid4());
};

util.uuid4 = function () {
    var bytes = util.allocate_buffer(16);
    for (var i = 0; i < bytes.length; i++) {
        bytes[i] = Math.random()*255|0;
    }

    // From RFC4122, the version bits are set to 0100
    bytes[7] &= 0x0F;
    bytes[7] |= 0x40;

    // From RFC4122, the top two bits of byte 8 get set to 01
    bytes[8] &= 0x3F;
    bytes[8] |= 0x80;

    return bytes;
};


util.uuid_to_string = function (buffer) {
    if (buffer.length === 16) {
        var chunks = [buffer.slice(0, 4), buffer.slice(4, 6), buffer.slice(6, 8), buffer.slice(8, 10), buffer.slice(10, 16)];
        return chunks.map(function (b) { return b.toString('hex'); }).join('-');
    } else {
        throw new errors.TypeError('Not a UUID, expecting 16 byte buffer');
    }
};

var parse_uuid = /^([0-9a-f]{8})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{4})-([0-9a-f]{12})$/;

util.string_to_uuid = function (uuid_string) {
    var parts = parse_uuid.exec(uuid_string.toLowerCase());
    if (parts) {
        return Buffer.from(parts.slice(1).join(''), 'hex');
    } else {
        throw new errors.TypeError('Not a valid UUID string: ' + uuid_string);
    }
};

util.clone = function (o) {
    var copy = Object.create(o.prototype || {});
    var names = Object.getOwnPropertyNames(o);
    for (var i = 0; i < names.length; i++) {
        var key = names[i];
        copy[key] = o[key];
    }
    return copy;
};

util.and = function (f, g) {
    if (g === undefined) return f;
    return function (o) {
        return f(o) && g(o);
    };
};

util.is_sender = function (o) { return o.is_sender(); };
util.is_receiver = function (o) { return o.is_receiver(); };
util.sender_filter = function (filter) { return util.and(util.is_sender, filter); };
util.receiver_filter = function (filter) { return util.and(util.is_receiver, filter); };

util.is_defined = function (field) {
    return field !== undefined && field !== null;
};

module.exports = util;

}, function(modId) { var map = {"./errors.js":1770126801033}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801035, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var types = require('./types.js');
var errors = require('./errors.js');

var frames = {};
var by_descriptor = {};

frames.read_header = function(buffer) {
    var offset = 4;
    var header = {};
    var name = buffer.toString('ascii', 0, offset);
    if (name !== 'AMQP') {
        // output name in hex (null-bytes can be tough to deal with in ascii)
        throw new errors.ProtocolError('Invalid protocol header for AMQP: ' + buffer.toString('hex', 0, offset));
    }
    header.protocol_id = buffer.readUInt8(offset++);
    header.major = buffer.readUInt8(offset++);
    header.minor = buffer.readUInt8(offset++);
    header.revision = buffer.readUInt8(offset++);
    //the protocol header is interpreted in different ways for
    //different versions(!); check some special cases to give clearer
    //error messages:
    if (header.protocol_id === 0 && header.major === 0 && header.minor === 9 && header.revision === 1) {
        throw new errors.ProtocolError('Unsupported AMQP version: 0-9-1');
    }
    if (header.protocol_id === 1 && header.major === 1 && header.minor === 0 && header.revision === 10) {
        throw new errors.ProtocolError('Unsupported AMQP version: 0-10');
    }
    if (header.major !== 1 || header.minor !== 0) {
        throw new errors.ProtocolError('Unsupported AMQP version: ' + JSON.stringify(header));
    }
    return header;
};
frames.write_header = function(buffer, header) {
    var offset = 4;
    buffer.write('AMQP', 0, offset, 'ascii');
    buffer.writeUInt8(header.protocol_id, offset++);
    buffer.writeUInt8(header.major, offset++);
    buffer.writeUInt8(header.minor, offset++);
    buffer.writeUInt8(header.revision, offset++);
    return 8;
};
//todo: define enumeration for frame types
frames.TYPE_AMQP = 0x00;
frames.TYPE_SASL = 0x01;

frames.read_frame = function(buffer) {
    var reader = new types.Reader(buffer);
    var frame = {};
    frame.size = reader.read_uint(4);
    if (reader.remaining() < (frame.size-4)) {
        return null;
    }
    var doff = reader.read_uint(1);
    if (doff < 2) {
        throw new errors.ProtocolError('Invalid data offset, must be at least 2 was ' + doff);
    }
    frame.type = reader.read_uint(1);
    if (frame.type === frames.TYPE_AMQP) {
        frame.channel = reader.read_uint(2);
    } else if (frame.type === frames.TYPE_SASL) {
        reader.skip(2);
        frame.channel = 0;
    } else {
        throw new errors.ProtocolError('Unknown frame type ' + frame.type);
    }
    if (doff > 1) {
        //ignore any extended header
        reader.skip(doff * 4 - 8);
    }
    if (reader.remaining()) {
        frame.performative = reader.read();
        var c = by_descriptor[frame.performative.descriptor.value];
        if (c) {
            frame.performative = new c(frame.performative.value);
        }
        if (reader.remaining()) {
            frame.payload = reader.read_bytes(reader.remaining());
        }
    }
    return frame;
};

frames.write_frame = function(frame) {
    var writer = new types.Writer();
    writer.skip(4);//skip size until we know how much we have written
    writer.write_uint(2, 1);//doff
    writer.write_uint(frame.type, 1);
    if (frame.type === frames.TYPE_AMQP) {
        writer.write_uint(frame.channel, 2);
    } else if (frame.type === frames.TYPE_SASL) {
        writer.write_uint(0, 2);
    } else {
        throw new errors.ProtocolError('Unknown frame type ' + frame.type);
    }
    if (frame.performative) {
        writer.write(frame.performative);
        if (frame.payload) {
            writer.write_bytes(frame.payload);
        }
    }
    var buffer = writer.toBuffer();
    buffer.writeUInt32BE(buffer.length, 0);//fill in the size
    return buffer;
};

frames.amqp_frame = function(channel, performative, payload) {
    return {'channel': channel || 0, 'type': frames.TYPE_AMQP, 'performative': performative, 'payload': payload};
};
frames.sasl_frame = function(performative) {
    return {'channel': 0, 'type': frames.TYPE_SASL, 'performative': performative};
};

function define_frame(type, def) {
    var c = types.define_composite(def);
    frames[def.name] = c.create;
    by_descriptor[Number(c.descriptor.numeric).toString(10)] = c;
    by_descriptor[c.descriptor.symbolic] = c;
}

var open = {
    name: 'open',
    code: 0x10,
    fields: [
        {name: 'container_id', type: 'string', mandatory: true},
        {name: 'hostname', type: 'string'},
        {name: 'max_frame_size', type: 'uint', default_value: 4294967295},
        {name: 'channel_max', type: 'ushort', default_value: 65535},
        {name: 'idle_time_out', type: 'uint'},
        {name: 'outgoing_locales', type: 'symbol', multiple: true},
        {name: 'incoming_locales', type: 'symbol', multiple: true},
        {name: 'offered_capabilities', type: 'symbol', multiple: true},
        {name: 'desired_capabilities', type: 'symbol', multiple: true},
        {name: 'properties', type: 'symbolic_map'}
    ]
};

var begin = {
    name: 'begin',
    code: 0x11,
    fields:[
        {name: 'remote_channel', type: 'ushort'},
        {name: 'next_outgoing_id', type: 'uint', mandatory: true},
        {name: 'incoming_window', type: 'uint', mandatory: true},
        {name: 'outgoing_window', type: 'uint', mandatory: true},
        {name: 'handle_max', type: 'uint', default_value: '4294967295'},
        {name: 'offered_capabilities', type: 'symbol', multiple: true},
        {name: 'desired_capabilities', type: 'symbol', multiple: true},
        {name: 'properties', type: 'symbolic_map'}
    ]
};

var attach = {
    name: 'attach',
    code: 0x12,
    fields:[
        {name: 'name', type: 'string', mandatory: true},
        {name: 'handle', type: 'uint', mandatory: true},
        {name: 'role', type: 'boolean', mandatory: true},
        {name: 'snd_settle_mode', type: 'ubyte', default_value: 2},
        {name: 'rcv_settle_mode', type: 'ubyte', default_value: 0},
        {name: 'source', type: '*'},
        {name: 'target', type: '*'},
        {name: 'unsettled', type: 'map'},
        {name: 'incomplete_unsettled', type: 'boolean', default_value: false},
        {name: 'initial_delivery_count', type: 'uint'},
        {name: 'max_message_size', type: 'ulong'},
        {name: 'offered_capabilities', type: 'symbol', multiple: true},
        {name: 'desired_capabilities', type: 'symbol', multiple: true},
        {name: 'properties', type: 'symbolic_map'}
    ]
};

var flow = {
    name: 'flow',
    code: 0x13,
    fields:[
        {name: 'next_incoming_id', type: 'uint'},
        {name: 'incoming_window', type: 'uint', mandatory: true},
        {name: 'next_outgoing_id', type: 'uint', mandatory: true},
        {name: 'outgoing_window', type: 'uint', mandatory: true},
        {name: 'handle', type: 'uint'},
        {name: 'delivery_count', type: 'uint'},
        {name: 'link_credit', type: 'uint'},
        {name: 'available', type: 'uint'},
        {name: 'drain', type: 'boolean', default_value: false},
        {name: 'echo', type: 'boolean', default_value: false},
        {name: 'properties', type: 'symbolic_map'}
    ]
};

var transfer = {
    name: 'transfer',
    code: 0x14,
    fields:[
        {name: 'handle', type: 'uint', mandatory: true},
        {name: 'delivery_id', type: 'uint'},
        {name: 'delivery_tag', type: 'binary'},
        {name: 'message_format', type: 'uint'},
        {name: 'settled', type: 'boolean'},
        {name: 'more', type: 'boolean', default_value: false},
        {name: 'rcv_settle_mode', type: 'ubyte'},
        {name: 'state', type: 'delivery_state'},
        {name: 'resume', type: 'boolean', default_value: false},
        {name: 'aborted', type: 'boolean', default_value: false},
        {name: 'batchable', type: 'boolean', default_value: false}
    ]
};

var disposition = {
    name: 'disposition',
    code: 0x15,
    fields:[
        {name: 'role', type: 'boolean', mandatory: true},
        {name: 'first', type: 'uint', mandatory: true},
        {name: 'last', type: 'uint'},
        {name: 'settled', type: 'boolean', default_value: false},
        {name: 'state', type: '*'},
        {name: 'batchable', type: 'boolean', default_value: false}
    ]
};

var detach = {
    name: 'detach',
    code: 0x16,
    fields: [
        {name: 'handle', type: 'uint', mandatory: true},
        {name: 'closed', type: 'boolean', default_value: false},
        {name: 'error', type: 'error'}
    ]
};

var end = {
    name: 'end',
    code: 0x17,
    fields: [
        {name: 'error', type: 'error'}
    ]
};

var close = {
    name: 'close',
    code: 0x18,
    fields: [
        {name: 'error', type: 'error'}
    ]
};

define_frame(frames.TYPE_AMQP, open);
define_frame(frames.TYPE_AMQP, begin);
define_frame(frames.TYPE_AMQP, attach);
define_frame(frames.TYPE_AMQP, flow);
define_frame(frames.TYPE_AMQP, transfer);
define_frame(frames.TYPE_AMQP, disposition);
define_frame(frames.TYPE_AMQP, detach);
define_frame(frames.TYPE_AMQP, end);
define_frame(frames.TYPE_AMQP, close);

var sasl_mechanisms = {
    name: 'sasl_mechanisms',
    code: 0x40,
    fields: [
        {name: 'sasl_server_mechanisms', type: 'symbol', multiple: true, mandatory: true}
    ]
};

var sasl_init = {
    name: 'sasl_init',
    code: 0x41,
    fields: [
        {name: 'mechanism', type: 'symbol', mandatory: true},
        {name: 'initial_response', type: 'binary'},
        {name: 'hostname', type: 'string'}
    ]
};

var sasl_challenge = {
    name: 'sasl_challenge',
    code: 0x42,
    fields: [
        {name: 'challenge', type: 'binary', mandatory: true}
    ]
};

var sasl_response = {
    name: 'sasl_response',
    code: 0x43,
    fields: [
        {name: 'response', type: 'binary', mandatory: true}
    ]
};

var sasl_outcome = {
    name: 'sasl_outcome',
    code: 0x44,
    fields: [
        {name: 'code', type: 'ubyte', mandatory: true},
        {name: 'additional_data', type: 'binary'}
    ]
};

define_frame(frames.TYPE_SASL, sasl_mechanisms);
define_frame(frames.TYPE_SASL, sasl_init);
define_frame(frames.TYPE_SASL, sasl_challenge);
define_frame(frames.TYPE_SASL, sasl_response);
define_frame(frames.TYPE_SASL, sasl_outcome);

module.exports = frames;

}, function(modId) { var map = {"./types.js":1770126801036,"./errors.js":1770126801033}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801036, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var errors = require('./errors.js');
var util = require('./util.js');

var CAT_FIXED = 1;
var CAT_VARIABLE = 2;
var CAT_COMPOUND = 3;
var CAT_ARRAY = 4;

function Typed(type, value, code, descriptor) {
    this.type = type;
    this.value = value;
    if (code) {
        this.array_constructor = {'typecode':code};
        if (descriptor) {
            this.array_constructor.descriptor = descriptor;
        }
    }
}

Typed.prototype.toString = function() {
    return this.value ? this.value.toString() : null;
};

Typed.prototype.toLocaleString = function() {
    return this.value ? this.value.toLocaleString() : null;
};

Typed.prototype.valueOf = function() {
    return this.value;
};

Typed.prototype.toJSON = function() {
    return this.value && this.value.toJSON ? this.value.toJSON() : this.value;
};

Typed.prototype.toRheaTyped = function() {
    return this;
};

function TypeDesc(name, typecode, props, empty_value) {
    this.name = name;
    this.typecode = typecode;
    var subcategory = typecode >>> 4;
    switch (subcategory) {
    case 0x4:
        this.width = 0;
        this.category = CAT_FIXED;
        break;
    case 0x5:
        this.width = 1;
        this.category = CAT_FIXED;
        break;
    case 0x6:
        this.width = 2;
        this.category = CAT_FIXED;
        break;
    case 0x7:
        this.width = 4;
        this.category = CAT_FIXED;
        break;
    case 0x8:
        this.width = 8;
        this.category = CAT_FIXED;
        break;
    case 0x9:
        this.width = 16;
        this.category = CAT_FIXED;
        break;
    case 0xA:
        this.width = 1;
        this.category = CAT_VARIABLE;
        break;
    case 0xB:
        this.width = 4;
        this.category = CAT_VARIABLE;
        break;
    case 0xC:
        this.width = 1;
        this.category = CAT_COMPOUND;
        break;
    case 0xD:
        this.width = 4;
        this.category = CAT_COMPOUND;
        break;
    case 0xE:
        this.width = 1;
        this.category = CAT_ARRAY;
        break;
    case 0xF:
        this.width = 4;
        this.category = CAT_ARRAY;
        break;
    default:
        //can't happen
        break;
    }

    if (props) {
        if (props.read) {
            this.read = props.read;
        }
        if (props.write) {
            this.write = props.write;
        }
        if (props.encoding) {
            this.encoding = props.encoding;
        }
    }

    var t = this;
    if (subcategory === 0x4) {
        // 'empty' types don't take a value
        this.create = function () {
            return new Typed(t, empty_value);
        };
    } else if (subcategory === 0xE || subcategory === 0xF) {
        this.create = function (v, code, descriptor) {
            return new Typed(t, v, code, descriptor);
        };
    } else {
        this.create = function (v) {
            return new Typed(t, v);
        };
    }
}

TypeDesc.prototype.toString = function () {
    return this.name + '#' + hex(this.typecode);
};

function hex(i) {
    return Number(i).toString(16);
}

var types = {'by_code':{}};
Object.defineProperty(types, 'MAX_UINT', {value: 4294967295, writable: false, configurable: false});
Object.defineProperty(types, 'MAX_USHORT', {value: 65535, writable: false, configurable: false});

function define_type(name, typecode, annotations, empty_value) {
    var t = new TypeDesc(name, typecode, annotations, empty_value);
    t.create.typecode = t.typecode;//hack
    types.by_code[t.typecode] = t;
    types[name] = t.create;
}

function buffer_uint8_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readUInt8(offset); },
        'write': function (buffer, value, offset) { buffer.writeUInt8(value, offset); }
    };
}

function buffer_uint16be_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readUInt16BE(offset); },
        'write': function (buffer, value, offset) { buffer.writeUInt16BE(value, offset); }
    };
}

function buffer_uint32be_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readUInt32BE(offset); },
        'write': function (buffer, value, offset) { buffer.writeUInt32BE(value, offset); }
    };
}

function buffer_int8_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readInt8(offset); },
        'write': function (buffer, value, offset) { buffer.writeInt8(value, offset); }
    };
}

function buffer_int16be_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readInt16BE(offset); },
        'write': function (buffer, value, offset) { buffer.writeInt16BE(value, offset); }
    };
}

function buffer_int32be_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readInt32BE(offset); },
        'write': function (buffer, value, offset) { buffer.writeInt32BE(value, offset); }
    };
}

function buffer_floatbe_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readFloatBE(offset); },
        'write': function (buffer, value, offset) { buffer.writeFloatBE(value, offset); }
    };
}

function buffer_doublebe_ops() {
    return {
        'read': function (buffer, offset) { return buffer.readDoubleBE(offset); },
        'write': function (buffer, value, offset) { buffer.writeDoubleBE(value, offset); }
    };
}

var MAX_UINT = 4294967296; // 2^32
var MIN_INT = -2147483647;
function write_ulong(buffer, value, offset) {
    if ((typeof value) === 'number' || value instanceof Number) {
        var hi = Math.floor(value / MAX_UINT);
        var lo = value % MAX_UINT;
        buffer.writeUInt32BE(hi, offset);
        buffer.writeUInt32BE(lo, offset + 4);
    } else {
        value.copy(buffer, offset);
    }
}

function read_ulong(buffer, offset) {
    var hi = buffer.readUInt32BE(offset);
    var lo = buffer.readUInt32BE(offset + 4);
    if (hi < 2097153) {
        return hi * MAX_UINT + lo;
    } else {
        return buffer.slice(offset, offset + 8);
    }
}

function write_long(buffer, value, offset) {
    if ((typeof value) === 'number' || value instanceof Number) {
        var abs = Math.abs(value);
        var hi = Math.floor(abs / MAX_UINT);
        var lo = abs % MAX_UINT;
        buffer.writeInt32BE(hi, offset);
        buffer.writeUInt32BE(lo, offset + 4);
        if (value < 0) {
            var carry = 1;
            for (var i = 0; i < 8; i++) {
                var index = offset + (7 - i);
                var v = (buffer[index] ^ 0xFF) + carry;
                buffer[index] = v & 0xFF;
                carry = v >> 8;
            }
        }
    } else {
        value.copy(buffer, offset);
    }
}

function write_timestamp(buffer, value, offset) {
    if (typeof value === 'object' && value !== null && typeof value.getTime === 'function') {
        value = value.getTime();
    }
    return write_long(buffer, value, offset);
}

function read_long(buffer, offset) {
    var hi = buffer.readInt32BE(offset);
    var lo = buffer.readUInt32BE(offset + 4);
    if (hi < 2097153 && hi > -2097153) {
        return hi * MAX_UINT + lo;
    } else {
        return buffer.slice(offset, offset + 8);
    }
}

function read_timestamp(buffer, offset) {
    const l = read_long(buffer, offset);
    return new Date(l);
}

define_type('Null', 0x40, undefined, null);
define_type('Boolean', 0x56, buffer_uint8_ops());
define_type('True', 0x41, undefined, true);
define_type('False', 0x42, undefined, false);
define_type('Ubyte', 0x50, buffer_uint8_ops());
define_type('Ushort', 0x60, buffer_uint16be_ops());
define_type('Uint', 0x70, buffer_uint32be_ops());
define_type('SmallUint', 0x52, buffer_uint8_ops());
define_type('Uint0', 0x43, undefined, 0);
define_type('Ulong', 0x80, {'write':write_ulong, 'read':read_ulong});
define_type('SmallUlong', 0x53, buffer_uint8_ops());
define_type('Ulong0', 0x44, undefined, 0);
define_type('Byte', 0x51, buffer_int8_ops());
define_type('Short', 0x61, buffer_int16be_ops());
define_type('Int', 0x71, buffer_int32be_ops());
define_type('SmallInt', 0x54, buffer_int8_ops());
define_type('Long', 0x81, {'write':write_long, 'read':read_long});
define_type('SmallLong', 0x55, buffer_int8_ops());
define_type('Float', 0x72, buffer_floatbe_ops());
define_type('Double', 0x82, buffer_doublebe_ops());
define_type('Decimal32', 0x74);
define_type('Decimal64', 0x84);
define_type('Decimal128', 0x94);
define_type('CharUTF32', 0x73, buffer_uint32be_ops());
define_type('Timestamp', 0x83, {'write':write_timestamp, 'read':read_timestamp});
define_type('Uuid', 0x98);//TODO: convert to/from stringified form?
define_type('Vbin8', 0xa0);
define_type('Vbin32', 0xb0);
define_type('Str8', 0xa1, {'encoding':'utf8'});
define_type('Str32', 0xb1, {'encoding':'utf8'});
define_type('Sym8', 0xa3, {'encoding':'ascii'});
define_type('Sym32', 0xb3, {'encoding':'ascii'});
define_type('List0', 0x45, undefined, []);
define_type('List8', 0xc0);
define_type('List32', 0xd0);
define_type('Map8', 0xc1);
define_type('Map32', 0xd1);
define_type('Array8', 0xe0);
define_type('Array32', 0xf0);

function is_one_of(o, typelist) {
    for (var i = 0; i < typelist.length; i++) {
        if (o.type.typecode === typelist[i].typecode) return true;
    }
    return false;
}
function buffer_zero(b, len, neg) {
    for (var i = 0; i < len && i < b.length; i++) {
        if (b[i] !== (neg ? 0xff : 0)) return false;
    }
    return true;
}
types.is_ulong = function(o) {
    return is_one_of(o, [types.Ulong, types.Ulong0, types.SmallUlong]);
};
types.is_string = function(o) {
    return is_one_of(o, [types.Str8, types.Str32]);
};
types.is_symbol = function(o) {
    return is_one_of(o, [types.Sym8, types.Sym32]);
};
types.is_list = function(o) {
    return is_one_of(o, [types.List0, types.List8, types.List32]);
};
types.is_map = function(o) {
    return is_one_of(o, [types.Map8, types.Map32]);
};

types.wrap_boolean = function(v) {
    return v ? types.True() : types.False();
};
types.wrap_ulong = function(l) {
    if (Buffer.isBuffer(l)) {
        if (buffer_zero(l, 8, false)) return types.Ulong0();
        return buffer_zero(l, 7, false) ? types.SmallUlong(l[7]) : types.Ulong(l);
    } else {
        if (l === 0) return types.Ulong0();
        else return l > 255 ? types.Ulong(l) : types.SmallUlong(l);
    }
};
types.wrap_uint = function(l) {
    if (l === 0) return types.Uint0();
    else return l > 255 ? types.Uint(l) : types.SmallUint(l);
};
types.wrap_ushort = function(l) {
    return types.Ushort(l);
};
types.wrap_ubyte = function(l) {
    return types.Ubyte(l);
};
types.wrap_long = function(l) {
    if (Buffer.isBuffer(l)) {
        var negFlag = (l[0] & 0x80) !== 0;
        if (buffer_zero(l, 7, negFlag) && (l[7] & 0x80) === (negFlag ? 0x80 : 0)) {
            return types.SmallLong(negFlag ? -((l[7] ^ 0xff) + 1) : l[7]);
        }
        return types.Long(l);
    } else {
        return l > 127 || l < -128 ? types.Long(l) : types.SmallLong(l);
    }
};
types.wrap_int = function(l) {
    return l > 127 || l < -128 ? types.Int(l) : types.SmallInt(l);
};
types.wrap_short = function(l) {
    return types.Short(l);
};
types.wrap_byte = function(l) {
    return types.Byte(l);
};
types.wrap_float = function(l) {
    return types.Float(l);
};
types.wrap_double = function(l) {
    return types.Double(l);
};
types.wrap_timestamp = function(l) {
    return types.Timestamp(l);
};
types.wrap_char = function(v) {
    return types.CharUTF32(v);
};
types.wrap_uuid = function(v) {
    return types.Uuid(v);
};
types.wrap_binary = function (s) {
    return s.length > 255 ? types.Vbin32(s) : types.Vbin8(s);
};
types.wrap_string = function (s) {
    return Buffer.byteLength(s) > 255 ? types.Str32(s) : types.Str8(s);
};
types.wrap_symbol = function (s) {
    return Buffer.byteLength(s) > 255 ? types.Sym32(s) : types.Sym8(s);
};
types.wrap_list = function(l) {
    if (l.length === 0) return types.List0();
    var items = l.map(types.wrap);
    return types.List32(items);
};
types.wrap_set_as_list = function(l) {
    if (l.size === 0) return types.List0();
    var items = Array.from(l, types.wrap);
    return types.List32(items);
};
types.wrap_map = function(m, key_wrapper) {
    var items = [];
    for (var k in m) {
        items.push(key_wrapper ? key_wrapper(k) : types.wrap(k));
        items.push(types.wrap(m[k]));
    }
    return types.Map32(items);
};
types.wrap_map_as_map = function(m) {
    var items = [];
    for (var [k, v] of m) {
        items.push(types.wrap(k));
        items.push(types.wrap(v));
    }
    return types.Map32(items);
};
types.wrap_symbolic_map = function(m) {
    return types.wrap_map(m, types.wrap_symbol);
};
types.wrap_array = function(l, code, descriptors) {
    if (code) {
        return types.Array32(l, code, descriptors);
    } else {
        console.trace('An array must specify a type for its elements');
        throw new errors.TypeError('An array must specify a type for its elements');
    }
};
types.wrap = function(o) {
    var t = typeof o;
    if (t === 'object' && o !== null && typeof o.toRheaTyped === 'function') {
        return o.toRheaTyped();
    } else if (t === 'string') {
        return types.wrap_string(o);
    } else if (t === 'boolean') {
        return o ? types.True() : types.False();
    } else if (t === 'number' || o instanceof Number) {
        if (isNaN(o)) {
            return types.Null();
        } else if (Math.floor(o) - o !== 0) {
            return types.Double(o);
        } else if (o > 0) {
            if (o < MAX_UINT) {
                return types.wrap_uint(o);
            } else {
                return types.wrap_ulong(o);
            }
        } else {
            if (o > MIN_INT) {
                return types.wrap_int(o);
            } else {
                return types.wrap_long(o);
            }
        }
    } else if (o instanceof Date) {
        return types.wrap_timestamp(o.getTime());
    } else if (o instanceof Buffer || o instanceof Uint8Array) {
        return types.wrap_binary(o);
    } else if (t === 'undefined' || o === null) {
        return types.Null();
    } else if (Array.isArray(o)) {
        return types.wrap_list(o);
    } else if (o instanceof Map) {
        return types.wrap_map_as_map(o);
    } else if (o instanceof Set) {
        return types.wrap_set_as_list(o);
    } else {
        return types.wrap_map(o);
    }
};

types.wrap_described = function(value, descriptor) {
    var result = types.wrap(value);
    if (descriptor) {
        if (typeof descriptor === 'string') {
            result = types.described(types.wrap_symbol(descriptor), result);
        } else if (typeof descriptor === 'number' || descriptor instanceof Number) {
            result = types.described(types.wrap_ulong(descriptor), result);
        }
    }
    return result;
};

types.wrap_message_id = function(o) {
    var t = typeof o;
    if (t === 'string') {
        return types.wrap_string(o);
    } else if (t === 'number' || o instanceof Number) {
        return types.wrap_ulong(o);
    } else if (Buffer.isBuffer(o)) {
        return types.wrap_uuid(o);
    } else if (o instanceof Typed) {
        return o;
    } else {
        //TODO handle uuids
        throw new errors.TypeError('invalid message id:' + o);
    }
};

/**
 * Converts the list of keys and values that comprise an AMQP encoded
 * map into a proper javascript map/object.
 */
function mapify(elements) {
    var result = {};
    for (var i = 0; i+1 < elements.length;) {
        result[elements[i++]] = elements[i++];
    }
    return result;
}

var by_descriptor = {};

types.unwrap_map_simple = function(o) {
    return mapify(o.value.map(function (i) { return types.unwrap(i, true); }));
};

types.unwrap = function(o, leave_described) {
    if (o instanceof Typed) {
        if (o.descriptor) {
            var c = by_descriptor[o.descriptor.value];
            if (c) {
                return new c(o.value);
            } else if (leave_described) {
                return o;
            }
        }
        var u = types.unwrap(o.value, true);
        return types.is_map(o) ? mapify(u) : u;
    } else if (Array.isArray(o)) {
        return o.map(function (i) { return types.unwrap(i, true); });
    } else {
        return o;
    }
};

/*
types.described = function (descriptor, typedvalue) {
    var o = Object.create(typedvalue);
    if (descriptor.length) {
        o.descriptor = descriptor.shift();
        return types.described(descriptor, o);
    } else {
        o.descriptor = descriptor;
        return o;
    }
};
*/
types.described_nc = function (descriptor, o) {
    if (descriptor.length) {
        o.descriptor = descriptor.shift();
        return types.described(descriptor, o);
    } else {
        o.descriptor = descriptor;
        return o;
    }
};
types.described = types.described_nc;

function get_type(code) {
    var type = types.by_code[code];
    if (!type) {
        throw new errors.TypeError('Unrecognised typecode: ' + hex(code));
    }
    return type;
}

types.Reader = function (buffer) {
    this.buffer = buffer;
    this.position = 0;
};

types.Reader.prototype.read_typecode = function () {
    return this.read_uint(1);
};

types.Reader.prototype.read_uint = function (width) {
    var current = this.position;
    this.position += width;
    if (width === 1) {
        return this.buffer.readUInt8(current);
    } else if (width === 2) {
        return this.buffer.readUInt16BE(current);
    } else if (width === 4) {
        return this.buffer.readUInt32BE(current);
    } else {
        throw new errors.TypeError('Unexpected width for uint ' + width);
    }
};

types.Reader.prototype.read_fixed_width = function (type) {
    var current = this.position;
    this.position += type.width;
    if (type.read) {
        return type.read(this.buffer, current);
    } else {
        return this.buffer.slice(current, this.position);
    }
};

types.Reader.prototype.read_variable_width = function (type) {
    var size = this.read_uint(type.width);
    var slice = this.read_bytes(size);
    return type.encoding ? slice.toString(type.encoding) : slice;
};

types.Reader.prototype.read = function () {
    var constructor = this.read_constructor();
    var value = this.read_value(get_type(constructor.typecode));
    return constructor.descriptor ? types.described_nc(constructor.descriptor, value) : value;
};

types.Reader.prototype.read_constructor = function (descriptors) {
    var code = this.read_typecode();
    if (code === 0x00) {
        if (descriptors === undefined) {
            descriptors = [];
        }
        descriptors.push(this.read());
        return this.read_constructor(descriptors);
    } else {
        if (descriptors === undefined) {
            return {'typecode': code};
        } else if (descriptors.length === 1) {
            return {'typecode': code, 'descriptor':  descriptors[0]};
        } else {
            return {'typecode': code, 'descriptor':  descriptors[0], 'descriptors': descriptors};
        }
    }
};

types.Reader.prototype.read_value = function (type) {
    if (type.width === 0) {
        return type.create();
    } else if (type.category === CAT_FIXED) {
        return type.create(this.read_fixed_width(type));
    } else if (type.category === CAT_VARIABLE) {
        return type.create(this.read_variable_width(type));
    } else if (type.category === CAT_COMPOUND) {
        return this.read_compound(type);
    } else if (type.category === CAT_ARRAY) {
        return this.read_array(type);
    } else {
        throw new errors.TypeError('Invalid category for type: ' + type);
    }
};

types.Reader.prototype.read_array_items = function (n, type) {
    var items = [];
    while (items.length < n) {
        items.push(this.read_value(type));
    }
    return items;
};

types.Reader.prototype.read_n = function (n) {
    var items = new Array(n);
    for (var i = 0; i < n; i++) {
        items[i] = this.read();
    }
    return items;
};

types.Reader.prototype.read_size_count = function (width) {
    return {'size': this.read_uint(width), 'count': this.read_uint(width)};
};

types.Reader.prototype.read_compound = function (type) {
    var limits = this.read_size_count(type.width);
    return type.create(this.read_n(limits.count));
};

types.Reader.prototype.read_array = function (type) {
    var limits = this.read_size_count(type.width);
    var constructor = this.read_constructor();
    return type.create(this.read_array_items(limits.count, get_type(constructor.typecode)), constructor.typecode, constructor.descriptor);
};

types.Reader.prototype.toString = function () {
    var s = 'buffer@' + this.position;
    if (this.position) s += ': ';
    for (var i = this.position; i < this.buffer.length; i++) {
        if (i > 0) s+= ',';
        s += '0x' + Number(this.buffer[i]).toString(16);
    }
    return s;
};

types.Reader.prototype.reset = function () {
    this.position = 0;
};

types.Reader.prototype.skip = function (bytes) {
    this.position += bytes;
};

types.Reader.prototype.read_bytes = function (bytes) {
    var current = this.position;
    this.position += bytes;
    return this.buffer.slice(current, this.position);
};

types.Reader.prototype.remaining = function () {
    return this.buffer.length - this.position;
};

types.Writer = function (buffer) {
    this.buffer = buffer ? buffer : util.allocate_buffer(1024);
    this.position = 0;
};

types.Writer.prototype.toBuffer = function () {
    return this.buffer.slice(0, this.position);
};

function max(a, b) {
    return a > b ? a : b;
}

types.Writer.prototype.ensure = function (length) {
    if (this.buffer.length < length) {
        var bigger = util.allocate_buffer(max(this.buffer.length*2, length));
        this.buffer.copy(bigger);
        this.buffer = bigger;
    }
};

types.Writer.prototype.write_typecode = function (code) {
    this.write_uint(code, 1);
};

types.Writer.prototype.write_uint = function (value, width) {
    var current = this.position;
    this.ensure(this.position + width);
    this.position += width;
    if (width === 1) {
        return this.buffer.writeUInt8(value, current);
    } else if (width === 2) {
        return this.buffer.writeUInt16BE(value, current);
    } else if (width === 4) {
        return this.buffer.writeUInt32BE(value, current);
    } else {
        throw new errors.TypeError('Unexpected width for uint ' + width);
    }
};


types.Writer.prototype.write_fixed_width = function (type, value) {
    var current = this.position;
    this.ensure(this.position + type.width);
    this.position += type.width;
    if (type.write) {
        type.write(this.buffer, value, current);
    } else if (value.copy) {
        value.copy(this.buffer, current);
    } else {
        throw new errors.TypeError('Cannot handle write for ' + type);
    }
};

types.Writer.prototype.write_variable_width = function (type, value) {
    var source = type.encoding ? Buffer.from(value, type.encoding) : Buffer.from(value);//TODO: avoid creating new buffers
    this.write_uint(source.length, type.width);
    this.write_bytes(source);
};

types.Writer.prototype.write_bytes = function (source) {
    var current = this.position;
    this.ensure(this.position + source.length);
    this.position += source.length;
    source.copy(this.buffer, current);
};

types.Writer.prototype.write_constructor = function (typecode, descriptor) {
    if (descriptor) {
        this.write_typecode(0x00);
        this.write(descriptor);
    }
    this.write_typecode(typecode);
};

types.Writer.prototype.write = function (o) {
    if (o.type === undefined) {
        if (o.described) {
            this.write(o.described());
        } else {
            throw new errors.TypeError('Cannot write ' + JSON.stringify(o));
        }
    } else {
        this.write_constructor(o.type.typecode, o.descriptor);
        this.write_value(o.type, o.value, o.array_constructor);
    }
};

types.Writer.prototype.write_value = function (type, value, constructor/*for arrays only*/) {
    if (type.width === 0) {
        return;//nothing further to do
    } else if (type.category === CAT_FIXED) {
        this.write_fixed_width(type, value);
    } else if (type.category === CAT_VARIABLE) {
        this.write_variable_width(type, value);
    } else if (type.category === CAT_COMPOUND) {
        this.write_compound(type, value);
    } else if (type.category === CAT_ARRAY) {
        this.write_array(type, value, constructor);
    } else {
        throw new errors.TypeError('Invalid category ' + type.category + ' for type: ' + type);
    }
};

types.Writer.prototype.backfill_size = function (width, saved) {
    var gap = this.position - saved;
    this.position = saved;
    this.write_uint(gap - width, width);
    this.position += (gap - width);
};

types.Writer.prototype.write_compound = function (type, value) {
    var saved = this.position;
    this.position += type.width;//skip size field
    this.write_uint(value.length, type.width);//count field
    for (var i = 0; i < value.length; i++) {
        if (value[i] === undefined || value[i] === null) {
            this.write(types.Null());
        } else {
            this.write(value[i]);
        }
    }
    this.backfill_size(type.width, saved);
};

types.Writer.prototype.write_array = function (type, value, constructor) {
    var saved = this.position;
    this.position += type.width;//skip size field
    this.write_uint(value.length, type.width);//count field
    this.write_constructor(constructor.typecode, constructor.descriptor);
    var ctype = get_type(constructor.typecode);
    for (var i = 0; i < value.length; i++) {
        this.write_value(ctype, value[i]);
    }
    this.backfill_size(type.width, saved);
};

types.Writer.prototype.toString = function () {
    var s = 'buffer@' + this.position;
    if (this.position) s += ': ';
    for (var i = 0; i < this.position; i++) {
        if (i > 0) s+= ',';
        s += ('00' + Number(this.buffer[i]).toString(16)).slice(-2);
    }
    return s;
};

types.Writer.prototype.skip = function (bytes) {
    this.ensure(this.position + bytes);
    this.position += bytes;
};

types.Writer.prototype.clear = function () {
    this.buffer.fill(0x00);
    this.position = 0;
};

types.Writer.prototype.remaining = function () {
    return this.buffer.length - this.position;
};


function get_constructor(typename) {
    if (typename === 'symbol') {
        return {typecode:types.Sym8.typecode};
    }
    throw new errors.TypeError('TODO: Array of type ' + typename + ' not yet supported');
}

function wrap_field(definition, instance) {
    if (instance !== undefined && instance !== null) {
        if (Array.isArray(instance)) {
            if (!definition.multiple) {
                throw new errors.TypeError('Field ' + definition.name + ' does not support multiple values, got ' + JSON.stringify(instance));
            }
            var constructor = get_constructor(definition.type);
            return types.wrap_array(instance, constructor.typecode, constructor.descriptor);
        } else if (definition.type === '*') {
            return instance;
        } else {
            var wrapper = types['wrap_' + definition.type];
            if (wrapper) {
                return wrapper(instance);
            } else {
                throw new errors.TypeError('No wrapper for field ' + definition.name + ' of type ' + definition.type);
            }
        }
    } else if (definition.mandatory) {
        throw new errors.TypeError('Field ' + definition.name + ' is mandatory');
    } else {
        return types.Null();
    }
}

function get_accessors(index, field_definition) {
    var getter;
    if (field_definition.type === '*') {
        getter = function() { return this.value[index]; };
    } else {
        getter = function() { return types.unwrap(this.value[index]); };
    }
    var setter = function(o) { this.value[index] = wrap_field(field_definition, o); };
    return {'get': getter, 'set': setter, 'enumerable':true, 'configurable':false};
}

types.define_composite = function(def) {
    var c = function(fields) {
        this.value = fields ? fields : [];
    };
    c.descriptor = {
        numeric: def.code,
        symbolic: 'amqp:' + def.name + ':list'
    };
    c.prototype.dispatch = function (target, frame) {
        target['on_' + def.name](frame);
    };
    //c.prototype.descriptor = c.descriptor.numeric;
    //c.prototype = Object.create(types.List8.prototype);
    for (var i = 0; i < def.fields.length; i++) {
        var f = def.fields[i];
        Object.defineProperty(c.prototype, f.name, get_accessors(i, f));
    }
    c.toString = function() {
        return def.name + '#' + Number(def.code).toString(16);
    };
    c.prototype.toJSON = function() {
        var o = {};
        for (var f in this) {
            if (f !== 'value' && this[f]) {
                o[f] = this[f];
            }
        }
        return o;
    };
    c.create = function(fields) {
        var o = new c;
        for (var f in fields) {
            o[f] = fields[f];
        }
        return o;
    };
    c.prototype.described = function() {
        return types.described_nc(types.wrap_ulong(c.descriptor.numeric), types.wrap_list(this.value));
    };
    return c;
};

function add_type(def) {
    var c = types.define_composite(def);
    types['wrap_' + def.name] = function (fields) {
        return c.create(fields).described();
    };
    by_descriptor[Number(c.descriptor.numeric).toString(10)] = c;
    by_descriptor[c.descriptor.symbolic] = c;
}

add_type({
    name: 'error',
    code: 0x1d,
    fields: [
        {name:'condition', type:'symbol', mandatory:true},
        {name:'description', type:'string'},
        {name:'info', type:'map'}
    ]
});

module.exports = types;

}, function(modId) { var map = {"./errors.js":1770126801033,"./util.js":1770126801034}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801037, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var debug = require('debug');

if (debug.formatters) {
    debug.formatters.h = function (v) {
        return v.toString('hex');
    };
}

module.exports = {
    'config' : debug('rhea:config'),
    'frames' : debug('rhea:frames'),
    'raw' : debug('rhea:raw'),
    'reconnect' : debug('rhea:reconnect'),
    'events' : debug('rhea:events'),
    'message' : debug('rhea:message'),
    'flow' : debug('rhea:flow'),
    'io' : debug('rhea:io')
};

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801038, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var errors = require('./errors.js');
var frames = require('./frames.js');
var Transport = require('./transport.js');
var util = require('./util.js');

var sasl_codes = {
    'OK':0,
    'AUTH':1,
    'SYS':2,
    'SYS_PERM':3,
    'SYS_TEMP':4,
};

var SASL_PROTOCOL_ID = 0x03;

function extract(buffer) {
    var results = [];
    var start = 0;
    var i = 0;
    while (i < buffer.length) {
        if (buffer[i] === 0x00) {
            if (i > start) results.push(buffer.toString('utf8', start, i));
            else results.push(null);
            start = ++i;
        } else {
            ++i;
        }
    }
    if (i > start) results.push(buffer.toString('utf8', start, i));
    else results.push(null);
    return results;
}

var PlainServer = function(callback) {
    this.callback = callback;
    this.outcome = undefined;
    this.username = undefined;
};

PlainServer.prototype.start = function(response, hostname) {
    var fields = extract(response);
    if (fields.length !== 3) {
        return Promise.reject('Unexpected response in PLAIN, got ' + fields.length + ' fields, expected 3');
    }
    var self = this;
    return Promise.resolve(this.callback(fields[1], fields[2], hostname))
        .then(function (result) {
            if (result) {
                self.outcome = true;
                self.username = fields[1];
            } else {
                self.outcome = false;
            }
        });
};

var PlainClient = function(username, password) {
    this.username = username;
    this.password = password;
};

PlainClient.prototype.start = function(callback) {
    var response = util.allocate_buffer(1 + this.username.length + 1 + this.password.length);
    response.writeUInt8(0, 0);
    response.write(this.username, 1);
    response.writeUInt8(0, 1 + this.username.length);
    response.write(this.password, 1 + this.username.length + 1);
    callback(undefined, response);
};

var AnonymousServer = function() {
    this.outcome = undefined;
    this.username = undefined;
};

AnonymousServer.prototype.start = function(response) {
    this.outcome = true;
    this.username = response ? response.toString('utf8') : 'anonymous';
};

var AnonymousClient = function(name) {
    this.username = name ? name : 'anonymous';
};

AnonymousClient.prototype.start = function(callback) {
    var response = util.allocate_buffer(1 + this.username.length);
    response.writeUInt8(0, 0);
    response.write(this.username, 1);
    callback(undefined, response);
};

var ExternalServer = function() {
    this.outcome = undefined;
    this.username = undefined;
};

ExternalServer.prototype.start = function() {
    this.outcome = true;
};

var ExternalClient = function() {
    this.username = undefined;
};

ExternalClient.prototype.start = function(callback) {
    callback(undefined, '');
};

ExternalClient.prototype.step = function(callback) {
    callback(undefined, '');
};

var XOAuth2Client = function(username, token) {
    this.username = username;
    this.token = token;
};

XOAuth2Client.prototype.start = function(callback) {
    var response = util.allocate_buffer(this.username.length + this.token.length + 5 + 12 + 3);
    var count = 0;
    response.write('user=', count);
    count += 5;
    response.write(this.username, count);
    count += this.username.length;
    response.writeUInt8(1, count);
    count += 1;
    response.write('auth=Bearer ', count);
    count += 12;
    response.write(this.token, count);
    count += this.token.length;
    response.writeUInt8(1, count);
    count += 1;
    response.writeUInt8(1, count);
    count += 1;
    callback(undefined, response);
};

/**
 * The mechanisms argument is a map of mechanism names to factory
 * functions for objects that implement that mechanism.
 */
var SaslServer = function (connection, mechanisms) {
    this.connection = connection;
    this.transport = new Transport(connection.amqp_transport.identifier, SASL_PROTOCOL_ID, frames.TYPE_SASL, this);
    this.next = connection.amqp_transport;
    this.mechanisms = mechanisms;
    this.mechanism = undefined;
    this.outcome = undefined;
    this.username = undefined;
    var mechlist = Object.getOwnPropertyNames(mechanisms);
    this.transport.encode(frames.sasl_frame(frames.sasl_mechanisms({sasl_server_mechanisms:mechlist})));
};

SaslServer.prototype.do_step = function (challenge) {
    if (this.mechanism.outcome === undefined) {
        this.transport.encode(frames.sasl_frame(frames.sasl_challenge({'challenge':challenge})));
        this.connection.output();
    } else {
        this.outcome = this.mechanism.outcome ? sasl_codes.OK : sasl_codes.AUTH;
        var frame = frames.sasl_frame(frames.sasl_outcome({code: this.outcome}));
        this.transport.encode(frame);
        this.connection.output();
        if (this.outcome === sasl_codes.OK) {
            this.username = this.mechanism.username;
            this.transport.write_complete = true;
            this.transport.read_complete = true;
        }
    }
};

SaslServer.prototype.on_sasl_init = function (frame) {
    var saslctor = this.mechanisms[frame.performative.mechanism];
    if (saslctor) {
        this.mechanism = saslctor();
        Promise.resolve(this.mechanism.start(frame.performative.initial_response, frame.performative.hostname))
            .then(this.do_step.bind(this))
            .catch(this.do_fail.bind(this));
    } else {
        this.outcome = sasl_codes.AUTH;
        this.transport.encode(frames.sasl_frame(frames.sasl_outcome({code: this.outcome})));
    }
};

SaslServer.prototype.on_sasl_response = function (frame) {
    Promise.resolve(this.mechanism.step(frame.performative.response))
        .then(this.do_step.bind(this))
        .catch(this.do_fail.bind(this));
};

SaslServer.prototype.do_fail = function (e) {
    var frame = frames.sasl_frame(frames.sasl_outcome({code: sasl_codes.SYS}));
    this.transport.encode(frame);
    this.connection.output();
    try {
        this.connection.sasl_failed('Sasl callback promise failed with ' + e, 'amqp:internal-error');
    } catch (e) {
        console.error('Uncaught error: ', e.message);
    }
};

SaslServer.prototype.has_writes_pending = function () {
    return this.transport.has_writes_pending() || this.next.has_writes_pending();
};

SaslServer.prototype.write = function (socket) {
    if (this.transport.write_complete && this.transport.pending.length === 0) {
        return this.next.write(socket);
    } else {
        return this.transport.write(socket);
    }
};

SaslServer.prototype.peek_size = function (buffer) {
    if (this.transport.read_complete) {
        return this.next.peek_size(buffer);
    } else {
        return this.transport.peek_size(buffer);
    }
};

SaslServer.prototype.read = function (buffer) {
    if (this.transport.read_complete) {
        return this.next.read(buffer);
    } else {
        return this.transport.read(buffer);
    }
};

var SaslClient = function (connection, mechanisms, hostname) {
    this.connection = connection;
    this.transport = new Transport(connection.amqp_transport.identifier, SASL_PROTOCOL_ID, frames.TYPE_SASL, this);
    this.next = connection.amqp_transport;
    this.mechanisms = mechanisms;
    this.mechanism = undefined;
    this.mechanism_name = undefined;
    this.hostname = hostname;
    this.failed = false;
};

SaslClient.prototype.on_sasl_mechanisms = function (frame) {
    var offered_mechanisms = [];
    if (Array.isArray(frame.performative.sasl_server_mechanisms)) {
        offered_mechanisms = frame.performative.sasl_server_mechanisms;
    } else if (frame.performative.sasl_server_mechanisms) {
        offered_mechanisms = [frame.performative.sasl_server_mechanisms];
    }
    for (var i = 0; this.mechanism === undefined && i < offered_mechanisms.length; i++) {
        var mech = offered_mechanisms[i];
        var f = this.mechanisms[mech];
        if (f) {
            this.mechanism = typeof f === 'function' ? f() : f;
            this.mechanism_name = mech;
        }
    }
    if (this.mechanism) {
        var self = this;
        this.mechanism.start(function (err, response) {
            if (err) {
                self.failed = true;
                self.connection.sasl_failed('SASL mechanism init failed: ' + err);
            } else {
                var init = {'mechanism':self.mechanism_name,'initial_response':response};
                if (self.hostname) {
                    init.hostname = self.hostname;
                }
                self.transport.encode(frames.sasl_frame(frames.sasl_init(init)));
                self.connection.output();
            }
        });
    } else {
        this.failed = true;
        this.connection.sasl_failed('No suitable mechanism; server supports ' + frame.performative.sasl_server_mechanisms);
    }
};
SaslClient.prototype.on_sasl_challenge = function (frame) {
    var self = this;
    this.mechanism.step(frame.performative.challenge, function (err, response) {
        if (err) {
            self.failed = true;
            self.connection.sasl_failed('SASL mechanism challenge failed: ' + err);
        } else {
            self.transport.encode(frames.sasl_frame(frames.sasl_response({'response':response})));
            self.connection.output();
        }
    });
};
SaslClient.prototype.on_sasl_outcome = function (frame) {
    switch (frame.performative.code) {
    case sasl_codes.OK:
        this.transport.read_complete = true;
        this.transport.write_complete = true;
        break;
    case sasl_codes.SYS:
    case sasl_codes.SYS_PERM:
    case sasl_codes.SYS_TEMP:
        this.transport.write_complete = true;
        this.connection.sasl_failed('Failed to authenticate: ' + frame.performative.code, 'amqp:internal-error');
        break;
    default:
        this.transport.write_complete = true;
        this.connection.sasl_failed('Failed to authenticate: ' + frame.performative.code);
    }
};

SaslClient.prototype.has_writes_pending = function () {
    return this.transport.has_writes_pending() || this.next.has_writes_pending();
};

SaslClient.prototype.write = function (socket) {
    if (this.transport.write_complete) {
        return this.next.write(socket);
    } else {
        return this.transport.write(socket);
    }
};

SaslClient.prototype.peek_size = function (buffer) {
    if (this.transport.read_complete) {
        return this.next.peek_size(buffer);
    } else {
        return this.transport.peek_size(buffer);
    }
};

SaslClient.prototype.read = function (buffer) {
    if (this.transport.read_complete) {
        return this.next.read(buffer);
    } else {
        return this.transport.read(buffer);
    }
};

var SelectiveServer = function (connection, mechanisms) {
    this.header_received = false;
    this.transports = {
        0: connection.amqp_transport,
        3: new SaslServer(connection, mechanisms)
    };
    this.selected = undefined;
};

SelectiveServer.prototype.has_writes_pending = function () {
    return this.header_received && this.selected.has_writes_pending();
};

SelectiveServer.prototype.write = function (socket) {
    if (this.selected) {
        return this.selected.write(socket);
    } else {
        return 0;
    }
};

SelectiveServer.prototype.peek_size = function (buffer) {
    if (this.header_received) {
        return this.selected.peek_size(buffer);
    }
    return undefined;
};

SelectiveServer.prototype.read = function (buffer) {
    if (!this.header_received) {
        if (buffer.length < 8) {
            return 0;
        } else {
            this.header_received = frames.read_header(buffer);
            this.selected = this.transports[this.header_received.protocol_id];
            if (this.selected === undefined) {
                throw new errors.ProtocolError('Invalid AMQP protocol id ' + this.header_received.protocol_id);
            }
        }
    }
    return this.selected.read(buffer);
};

var default_server_mechanisms = {
    enable_anonymous: function () {
        this['ANONYMOUS'] = function() { return new AnonymousServer(); };
    },
    enable_plain: function (callback) {
        this['PLAIN'] = function() { return new PlainServer(callback); };
    }
};

var default_client_mechanisms = {
    enable_anonymous: function (name) {
        this['ANONYMOUS'] = function() { return new AnonymousClient(name); };
    },
    enable_plain: function (username, password) {
        this['PLAIN'] = function() { return new PlainClient(username, password); };
    },
    enable_external: function () {
        this['EXTERNAL'] = function() { return new ExternalClient(); };
    },
    enable_xoauth2: function (username, token) {
        if (username && token) {
            this['XOAUTH2'] = function() { return new XOAuth2Client(username, token); };
        } else if (token === undefined) {
            throw Error('token must be specified');
        } else if (username === undefined) {
            throw Error('username must be specified');
        }
    }
};

module.exports = {
    Client : SaslClient,
    Server : SaslServer,
    Selective: SelectiveServer,
    server_mechanisms : function () {
        return Object.create(default_server_mechanisms);
    },
    client_mechanisms : function () {
        return Object.create(default_client_mechanisms);
    },
    server_add_external: function (mechs) {
        mechs['EXTERNAL'] = function() { return new ExternalServer(); };
        return mechs;
    }
};

}, function(modId) { var map = {"./errors.js":1770126801033,"./frames.js":1770126801035,"./transport.js":1770126801039,"./util.js":1770126801034}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801039, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var errors = require('./errors.js');
var frames = require('./frames.js');
var log = require('./log.js');
var util = require('./util.js');


var Transport = function (identifier, protocol_id, frame_type, handler) {
    this.identifier = identifier;
    this.protocol_id = protocol_id;
    this.frame_type = frame_type;
    this.handler = handler;
    this.pending = [];
    this.header_sent = undefined;
    this.header_received = undefined;
    this.write_complete = false;
    this.read_complete = false;
};

Transport.prototype.has_writes_pending = function () {
    return this.pending.length > 0 || !this.header_sent;
};

Transport.prototype.encode = function (frame) {
    this.pending.push(frame);
};

Transport.prototype.write = function (socket) {
    if (!this.header_sent) {
        var buffer = util.allocate_buffer(8);
        var header = {protocol_id:this.protocol_id, major:1, minor:0, revision:0};
        log.frames('[%s] -> %o', this.identifier, header);
        frames.write_header(buffer, header);
        socket.write(buffer);
        this.header_sent = header;
    }
    for (var i = 0; i < this.pending.length; i++) {
        var frame = this.pending[i];
        var buffer = frames.write_frame(frame);
        socket.write(buffer);
        if (frame.performative) {
            log.frames('[%s]:%s -> %s %j', this.identifier, frame.channel, frame.performative.constructor, frame.performative, frame.payload || '');
        } else {
            log.frames('[%s]:%s -> empty', this.identifier, frame.channel);
        }
        log.raw('[%s] SENT: %d %h', this.identifier, buffer.length, buffer);
    }
    this.pending = [];
};

Transport.prototype.peek_size = function (buffer) {
    log.frames('[%s] peek_size %o, %d', this.identifier, this.header_received, buffer.length);
    if (this.header_received && buffer.length >= 4) {
        return buffer.readUInt32BE();
    }
    return undefined;
};

Transport.prototype.read = function (buffer) {
    var offset = 0;
    if (!this.header_received) {
        if (buffer.length < 8) {
            return offset;
        } else {
            this.header_received = frames.read_header(buffer);
            log.frames('[%s] <- %o', this.identifier, this.header_received);
            if (this.header_received.protocol_id !== this.protocol_id) {
                if (this.protocol_id === 3 && this.header_received.protocol_id === 0) {
                    throw new errors.ProtocolError('Expecting SASL layer');
                } else if (this.protocol_id === 0 && this.header_received.protocol_id === 3) {
                    throw new errors.ProtocolError('SASL layer not enabled');
                } else {
                    throw new errors.ProtocolError('Invalid AMQP protocol id ' + this.header_received.protocol_id + ' expecting: ' + this.protocol_id);
                }
            }
            offset = 8;
        }
    }
    while (offset < (buffer.length - 4) && !this.read_complete) {
        var frame_size = buffer.readUInt32BE(offset);
        log.io('[%s] got frame of size %d', this.identifier, frame_size);
        if (buffer.length < offset + frame_size) {
            log.io('[%s] incomplete frame; have only %d of %d', this.identifier, (buffer.length - offset), frame_size);
            //don't have enough data for a full frame yet
            break;
        } else {
            var slice = buffer.slice(offset, offset + frame_size);
            log.raw('[%s] RECV: %d %h', this.identifier, slice.length, slice);
            var frame = frames.read_frame(slice);
            if (frame.performative) {
                log.frames('[%s]:%s <- %s %j', this.identifier, frame.channel, frame.performative.constructor, frame.performative, frame.payload || '');
            } else {
                log.frames('[%s]:%s <- empty', this.identifier, frame.channel);

            }
            if (frame.type !== this.frame_type) {
                throw new errors.ProtocolError('Invalid frame type: ' + frame.type);
            }
            offset += frame_size;
            if (frame.performative) {
                frame.performative.dispatch(this.handler, frame);
            }
        }
    }
    return offset;
};

module.exports = Transport;

}, function(modId) { var map = {"./errors.js":1770126801033,"./frames.js":1770126801035,"./log.js":1770126801037,"./util.js":1770126801034}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801040, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var EndpointState = function () {
    this.init();
};

EndpointState.prototype.init = function () {
    this.local_open = false;
    this.remote_open = false;
    this.open_requests = 0;
    this.close_requests = 0;
    this.initialised = false;
    this.marker = undefined;
};

EndpointState.prototype.mark = function (o) {
    this.marker = o || Date.now();
    return this.marker;
};

EndpointState.prototype.open = function () {
    this.marker = undefined;
    this.initialised = true;
    if (!this.local_open) {
        this.local_open = true;
        this.open_requests++;
        return true;
    } else {
        return false;
    }
};

EndpointState.prototype.close = function () {
    this.marker = undefined;
    if (this.local_open) {
        this.local_open = false;
        this.close_requests++;
        return true;
    } else {
        return false;
    }
};

EndpointState.prototype.disconnected = function () {
    var was_initialised = this.initialised;
    this.was_open = this.local_open;
    this.init();
    this.initialised = was_initialised;
};

EndpointState.prototype.reconnect = function () {
    if (this.was_open) {
        this.open();
        this.was_open = undefined;
    }
};

EndpointState.prototype.remote_opened = function () {
    if (!this.remote_open) {
        this.remote_open = true;
        return true;
    } else {
        return false;
    }
};

EndpointState.prototype.remote_closed = function () {
    if (this.remote_open) {
        this.remote_open = false;
        return true;
    } else {
        return false;
    }
};

EndpointState.prototype.is_open = function () {
    return this.local_open && this.remote_open;
};

EndpointState.prototype.is_closed = function () {
    return this.initialised && !(this.local_open || this.was_open) && !this.remote_open;
};

EndpointState.prototype.has_settled = function () {
    return this.open_requests === 0 && this.close_requests === 0;
};

EndpointState.prototype.need_open = function () {
    if (this.open_requests > 0) {
        this.open_requests--;
        return true;
    } else {
        return false;
    }
};

EndpointState.prototype.need_close = function () {
    if (this.close_requests > 0) {
        this.close_requests--;
        return true;
    } else {
        return false;
    }
};

module.exports = EndpointState;

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801041, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var frames = require('./frames.js');
var link = require('./link.js');
var log = require('./log.js');
var message = require('./message.js');
var types = require('./types.js');
var util = require('./util.js');
var EndpointState = require('./endpoint.js');

var EventEmitter = require('events').EventEmitter;

function SessionError(message, condition, session) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.message = message;
    this.condition = condition;
    this.description = message;
    Object.defineProperty(this, 'session', { value: session });
}
require('util').inherits(SessionError, Error);

var CircularBuffer = function (capacity) {
    this.capacity = capacity;
    this.size = 0;
    this.head = 0;
    this.tail = 0;
    this.entries = [];
};

CircularBuffer.prototype.available = function () {
    return this.capacity - this.size;
};

CircularBuffer.prototype.push = function (o) {
    if (this.size < this.capacity) {
        this.entries[this.tail] = o;
        this.tail = (this.tail + 1) % this.capacity;
        this.size++;
    } else {
        throw Error('circular buffer overflow: head=' + this.head + ' tail=' + this.tail + ' size=' + this.size + ' capacity=' + this.capacity);
    }
};

CircularBuffer.prototype.pop_if = function (f) {
    var count = 0;
    while (this.size && f(this.entries[this.head])) {
        this.entries[this.head] = undefined;
        this.head = (this.head + 1) % this.capacity;
        this.size--;
        count++;
    }
    return count;
};

CircularBuffer.prototype.by_id = function (id) {
    if (this.size > 0) {
        var gap = id - this.entries[this.head].id;
        if (gap < this.size) {
            return this.entries[(this.head + gap) % this.capacity];
        }
    }
    return undefined;
};

CircularBuffer.prototype.get_head = function () {
    return this.size > 0 ? this.entries[this.head] : undefined;
};

CircularBuffer.prototype.get_tail = function () {
    return this.size > 0 ? this.entries[(this.head + this.size - 1) % this.capacity] : undefined;
};

function write_dispositions(deliveries) {
    var first, last, next_id, i, delivery;

    for (i = 0; i < deliveries.length; i++) {
        delivery = deliveries[i];
        if (first === undefined) {
            first = delivery;
            last = delivery;
            next_id = delivery.id;
        }

        if ((first !== last && !message.are_outcomes_equivalent(last.state, delivery.state)) || last.settled !== delivery.settled || next_id !== delivery.id) {
            first.link.session.output(frames.disposition({'role' : first.link.is_receiver(), 'first' : first.id, 'last' : last.id, 'state' : first.state, 'settled' : first.settled}));
            first = delivery;
            last = delivery;
            next_id = delivery.id;
        } else {
            if (last.id !== delivery.id) {
                last = delivery;
            }
            next_id++;
        }
    }
    if (first !== undefined && last !== undefined) {
        first.link.session.output(frames.disposition({'role' : first.link.is_receiver(), 'first' : first.id, 'last' : last.id, 'state' : first.state, 'settled' : first.settled}));
    }
}

var Outgoing = function (connection) {
    /* TODO: make size configurable? */
    this.deliveries = new CircularBuffer(2048);
    this.updated = [];
    this.pending_dispositions = [];
    this.next_delivery_id = 0;
    this.next_pending_delivery = 0;
    this.next_transfer_id = 0;
    this.window = types.MAX_UINT;
    this.remote_next_transfer_id = undefined;
    this.remote_window = undefined;
    this.connection = connection;
};

Outgoing.prototype.available = function () {
    return this.deliveries.available();
};

Outgoing.prototype.compute_max_payload = function (tag) {
    if (this.connection.max_frame_size) {
        return this.connection.max_frame_size - (50 + tag.length);
    } else {
        return undefined;
    }
};

Outgoing.prototype.send = function (sender, tag, data, format) {
    var fragments = [];
    var max_payload = this.compute_max_payload(tag);
    if (max_payload && data.length > max_payload) {
        var start = 0;
        while (start < data.length) {
            var end = Math.min(start + max_payload, data.length);
            fragments.push(data.slice(start, end));
            start = end;
        }
    } else {
        fragments.push(data);
    }
    var d = {
        'id':this.next_delivery_id++,
        'tag':tag,
        'link':sender,
        'data': fragments,
        'format':format ? format : 0,
        'next_to_send': 0,
        'sent': false,
        'settled': false,
        'state': undefined,
        'remote_settled': false,
        'remote_state': undefined
    };
    var self = this;
    d.update = function (settled, state) {
        self.update(d, settled, state);
    };
    this.deliveries.push(d);
    return d;
};

Outgoing.prototype.on_begin = function (fields) {
    this.remote_window = fields.incoming_window;
};

Outgoing.prototype.on_flow = function (fields) {
    this.remote_next_transfer_id = fields.next_incoming_id;
    this.remote_window = fields.incoming_window;
};

Outgoing.prototype.on_disposition = function (fields) {
    var last = fields.last ? fields.last : fields.first;
    for (var i = fields.first; i <= last; i++) {
        var d = this.deliveries.by_id(i);
        if (d && !d.remote_settled) {
            var updated = false;
            if (fields.settled) {
                d.remote_settled = fields.settled;
                updated = true;
            }
            if (fields.state && fields.state !== d.remote_state) {
                d.remote_state = message.unwrap_outcome(fields.state);
                updated = true;
            }
            if (updated) {
                this.updated.push(d);
            }
        }
    }
};

Outgoing.prototype.update = function (delivery, settled, state) {
    if (delivery) {
        delivery.settled = settled;
        if (state !== undefined) delivery.state = state;
        if (!delivery.remote_settled) {
            this.pending_dispositions.push(delivery);
        }
        delivery.link.connection._register();
    }
};

Outgoing.prototype.transfer_window = function() {
    if (this.remote_window) {
        return this.remote_window - (this.next_transfer_id - this.remote_next_transfer_id);
    } else {
        return 0;
    }
};

Outgoing.prototype.process = function() {
    var d;
    // send pending deliveries for which there is credit:
    while (this.next_pending_delivery < this.next_delivery_id) {
        d = this.deliveries.by_id(this.next_pending_delivery);
        if (d) {
            if (d.link.has_credit()) {
                const num_to_send = Math.min(this.transfer_window(), d.data.length - d.next_to_send);
                if (num_to_send > 0) {
                    this.window -= num_to_send;
                    const end_of_send = d.next_to_send + num_to_send;
                    for (var i = d.next_to_send; i < end_of_send; i++) {
                        this.next_transfer_id++;
                        var more = (i+1) < d.data.length;
                        var transfer = frames.transfer({'handle':d.link.local.handle,'message_format':d.format,'delivery_id':d.id, 'delivery_tag':d.tag, 'settled':d.settled, 'more':more});
                        d.link.session.output(transfer, d.data[i]);
                    }
                    if (end_of_send < d.data.length) {
                        d.next_to_send = end_of_send;
                        break;
                    } else {
                        if (d.settled) {
                            d.remote_settled = true;//if sending presettled, it can now be cleaned up
                        }
                        d.link.credit--;
                        d.link.delivery_count++;
                        this.next_pending_delivery++;
                    }
                } else {
                    log.flow('[%s] Incoming window of peer preventing sending further transfers: remote_window=%d, remote_next_transfer_id=%d, next_transfer_id=%d',
                        this.connection.options.id, this.remote_window, this.remote_next_transfer_id, this.next_transfer_id);
                    break;
                }
            } else {
                log.flow('[%s] Link has no credit', this.connection.options.id);
                break;
            }
        } else {
            console.error('ERROR: Next pending delivery not found: ' + this.next_pending_delivery);
            break;
        }
    }

    // notify application of any updated deliveries:
    for (var i = 0; i < this.updated.length; i++) {
        d = this.updated[i];
        if (d.remote_state && d.remote_state.constructor.composite_type) {
            d.link.dispatch(d.remote_state.constructor.composite_type, d.link._context({'delivery':d}));
        }
        if (d.remote_settled) d.link.dispatch('settled', d.link._context({'delivery':d}));
    }
    this.updated = [];

    if (this.pending_dispositions.length) {
        write_dispositions(this.pending_dispositions);
        this.pending_dispositions = [];
    }

    // remove any fully settled deliveries:
    this.deliveries.pop_if(function (d) { return d.settled && d.remote_settled; });
};

var Incoming = function () {
    this.deliveries = new CircularBuffer(2048/*TODO: configurable?*/);
    this.updated = [];
    this.next_transfer_id = 0;
    this.next_delivery_id = undefined;
    Object.defineProperty(this, 'window', { get: function () { return this.deliveries.available(); } });
    this.remote_next_transfer_id = undefined;
    this.remote_window = undefined;
    this.max_transfer_id = this.next_transfer_id + this.window;
};

Incoming.prototype.update = function (delivery, settled, state) {
    if (delivery) {
        delivery.settled = settled;
        if (state !== undefined) delivery.state = state;
        if (!delivery.remote_settled) {
            this.updated.push(delivery);
        }
        delivery.link.connection._register();
    }
};

Incoming.prototype.on_transfer = function(frame, receiver) {
    this.next_transfer_id++;
    if (receiver.is_remote_open()) {
        if (this.next_delivery_id === undefined) {
            this.next_delivery_id = frame.performative.delivery_id;
        }
        var current;
        if (receiver._incomplete) {
            current = receiver._incomplete;
            if (util.is_defined(frame.performative.delivery_id) && current.id !== frame.performative.delivery_id) {
                throw Error('frame sequence error: delivery ' + current.id + ' not complete, got ' + frame.performative.delivery_id);
            }
            if (frame.payload) {
                current.frames.push(frame.payload);
            }
        } else if (this.next_delivery_id === frame.performative.delivery_id) {
            current = {'id':frame.performative.delivery_id,
                'tag':frame.performative.delivery_tag,
                'format':frame.performative.message_format,
                'link':receiver,
                'settled': false,
                'state': undefined,
                'remote_settled': frame.performative.settled === undefined ? false : frame.performative.settled,
                'remote_state': frame.performative.state,
                'frames': [frame.payload],
            };
            var self = this;
            current.update = function (settled, state) {
                var settled_ = settled;
                if (settled_ === undefined) {
                    settled_ = receiver.local.attach.rcv_settle_mode !== 1;
                }
                self.update(current, settled_, state);
            };
            current.accept = function () { this.update(undefined, message.accepted().described()); };
            current.release = function (params) {
                if (params) {
                    this.update(undefined, message.modified(params).described());
                } else {
                    this.update(undefined, message.released().described());
                }
            };
            current.reject = function (error) { this.update(undefined, message.rejected({'error':error}).described()); };
            current.modified = function (params) { this.update(undefined, message.modified(params).described()); };

            this.deliveries.push(current);
            this.next_delivery_id++;
        } else {
            //TODO: better error handling
            throw Error('frame sequence error: expected ' + this.next_delivery_id + ', got ' + frame.performative.delivery_id);
        }
        current.incomplete = frame.performative.more;
        if (current.incomplete) {
            receiver._incomplete = current;
        } else {
            receiver._incomplete = undefined;
            const data = current.frames.length === 1 ? current.frames[0] : Buffer.concat(current.frames);
            delete current.frames;
            if (receiver.credit > 0) receiver.credit--;
            else console.error('Received transfer when credit was %d', receiver.credit);
            receiver.delivery_count++;
            var msgctxt = current.format === 0 ? {'message':message.decode(data), 'delivery':current} : {'message':data, 'delivery':current, 'format':current.format};
            receiver.dispatch('message', receiver._context(msgctxt));
        }
    } else {
        throw Error('transfer after detach');
    }
};

Incoming.prototype.process = function (session) {
    if (this.updated.length > 0) {
        write_dispositions(this.updated);
        this.updated = [];
    }

    // remove any fully settled deliveries:
    this.deliveries.pop_if(function (d) { return d.settled; });

    if (this.max_transfer_id - this.next_transfer_id < (this.window / 2)) {
        session._write_flow();
    }
};

Incoming.prototype.on_begin = function (fields) {
    this.remote_window = fields.outgoing_window;
    this.remote_next_transfer_id = fields.next_outgoing_id;
};

Incoming.prototype.on_flow = function (fields) {
    this.remote_next_transfer_id = fields.next_outgoing_id;
    this.remote_window = fields.outgoing_window;
};

Incoming.prototype.on_disposition = function (fields) {
    var last = fields.last ? fields.last : fields.first;
    for (var i = fields.first; i <= last; i++) {
        var d = this.deliveries.by_id(i);
        if (d && !d.remote_settled) {
            if (fields.state && fields.state !== d.remote_state) {
                d.remote_state = message.unwrap_outcome(fields.state);
            }
            if (fields.settled) {
                d.remote_settled = fields.settled;
                d.link.dispatch('settled', d.link._context({'delivery':d}));
            }
        }
    }
};

var Session = function (connection, local_channel) {
    this.connection = connection;
    this.outgoing = new Outgoing(connection);
    this.incoming = new Incoming();
    this.state = new EndpointState();
    this.local = {'channel': local_channel, 'handles':{}};
    this.local.begin = frames.begin({next_outgoing_id:this.outgoing.next_transfer_id,incoming_window:this.incoming.window,outgoing_window:this.outgoing.window});
    this.local.end = frames.end();
    this.remote = {'handles':{}};
    this.links = {}; // map by name
    this.options = {};
    Object.defineProperty(this, 'error', { get:  function() { return this.remote.end ? this.remote.end.error : undefined; }});
    this.observers = new EventEmitter();
};
Session.prototype = Object.create(EventEmitter.prototype);
Session.prototype.constructor = Session;

Session.prototype._disconnect = function() {
    this.state.disconnected();
    for (var l in this.links) {
        this.links[l]._disconnect();
    }
    if (!this.state.was_open) {
        this.remove();
    }
};

Session.prototype._reconnect = function() {
    this.state.reconnect();
    this.outgoing = new Outgoing(this.connection);
    this.incoming = new Incoming();
    this.remote = {'handles':{}};
    for (var l in this.links) {
        this.links[l]._reconnect();
    }
};

Session.prototype.dispatch = function(name) {
    log.events('[%s] Session got event: %s', this.connection.options.id, name);
    EventEmitter.prototype.emit.apply(this.observers, arguments);
    if (this.listeners(name).length) {
        EventEmitter.prototype.emit.apply(this, arguments);
        return true;
    } else {
        return this.connection.dispatch.apply(this.connection, arguments);
    }
};
Session.prototype.output = function (frame, payload) {
    this.connection._write_frame(this.local.channel, frame, payload);
};

Session.prototype.create_sender = function (name, opts) {
    if (!opts) {
        opts = this.get_option('sender_options', {});
    }
    return this.create_link(name, link.Sender, opts);
};

Session.prototype.create_receiver = function (name, opts) {
    if (!opts) {
        opts = this.get_option('receiver_options', {});
    }
    return this.create_link(name, link.Receiver, opts);
};

function merge(defaults, specific) {
    for (var f in specific) {
        if (f === 'properties' && defaults.properties) {
            merge(defaults.properties, specific.properties);
        } else {
            defaults[f] = specific[f];
        }
    }
}

function attach(factory, args, remote_terminus, default_args) {
    var opts = Object.create(default_args || {});
    if (typeof args === 'string') {
        opts[remote_terminus] = args;
    } else if (args) {
        merge(opts, args);
    }
    if (!opts.name) opts.name = util.generate_uuid();
    var l = factory(opts.name, opts);
    for (var t in {'source':0, 'target':0}) {
        if (opts[t]) {
            if (typeof opts[t] === 'string') {
                opts[t] = {'address' : opts[t]};
            }
            l['set_' + t](opts[t]);
        }
    }
    if (l.is_sender() && opts.source === undefined) {
        opts.source = l.set_source({});
    }
    if (l.is_receiver() && opts.target === undefined) {
        opts.target = l.set_target({});
    }
    l.attach();
    return l;
}

Session.prototype.get_option = function (name, default_value) {
    if (this.options[name] !== undefined) return this.options[name];
    else return this.connection.get_option(name, default_value);
};

Session.prototype.attach_sender = function (args) {
    return attach(this.create_sender.bind(this), args, 'target', this.get_option('sender_options', {}));
};
Session.prototype.open_sender = Session.prototype.attach_sender;//alias

Session.prototype.attach_receiver = function (args) {
    return attach(this.create_receiver.bind(this), args, 'source', this.get_option('receiver_options', {}));
};
Session.prototype.open_receiver = Session.prototype.attach_receiver;//alias

Session.prototype.find_sender = function (filter) {
    return this.find_link(util.sender_filter(filter));
};

Session.prototype.find_receiver = function (filter) {
    return this.find_link(util.receiver_filter(filter));
};

Session.prototype.find_link = function (filter) {
    for (var name in this.links) {
        var link = this.links[name];
        if (filter(link)) return link;
    }
    return undefined;
};

Session.prototype.each_receiver = function (action, filter) {
    this.each_link(action, util.receiver_filter(filter));
};

Session.prototype.each_sender = function (action, filter) {
    this.each_link(action, util.sender_filter(filter));
};

Session.prototype.each_link = function (action, filter) {
    for (var name in this.links) {
        var link = this.links[name];
        if (filter === undefined || filter(link)) action(link);
    }
};

Session.prototype.create_link = function (name, constructor, opts) {
    var i = 0;
    while (this.local.handles[i]) i++;
    var l = new constructor(this, name, i, opts);
    this.links[name] = l;
    this.local.handles[i] = l;
    return l;
};

Session.prototype.begin = function () {
    if (this.state.open()) {
        this.connection._register();
    }
};
Session.prototype.open = Session.prototype.begin;

Session.prototype.end = function (error) {
    if (error) this.local.end.error = error;
    if (this.state.close()) {
        this.connection._register();
    }
};
Session.prototype.close = Session.prototype.end;

Session.prototype.is_open = function () {
    return this.connection.is_open() && this.state.is_open();
};

Session.prototype.is_remote_open = function () {
    return this.connection.is_remote_open() && this.state.remote_open;
};

Session.prototype.is_itself_closed = function () {
    return this.state.is_closed();
};

Session.prototype.is_closed = function () {
    return this.connection.is_closed() || this.is_itself_closed();
};

function notify_sendable(sender) {
    sender.dispatch('sendable', sender._context());
}

function is_sender_sendable(sender) {
    return sender.is_open() && sender.sendable();
}

Session.prototype._process = function () {
    do {
        if (this.state.need_open()) {
            this.output(this.local.begin);
        }

        var was_blocked = this.outgoing.deliveries.available() === 0;
        this.outgoing.process();
        if (was_blocked && this.outgoing.deliveries.available()) {
            this.each_sender(notify_sendable, is_sender_sendable);
        }
        this.incoming.process(this);
        for (var k in this.links) {
            this.links[k]._process();
        }

        if (this.state.need_close()) {
            this.output(this.local.end);
        }
    } while (!this.state.has_settled());
};

Session.prototype.send = function (sender, tag, data, format) {
    var d = this.outgoing.send(sender, tag, data, format);
    this.connection._register();
    return d;
};

Session.prototype._write_flow = function (link) {
    var fields = {'next_incoming_id':this.incoming.next_transfer_id,
        'incoming_window':this.incoming.window,
        'next_outgoing_id':this.outgoing.next_transfer_id,
        'outgoing_window':this.outgoing.window
    };
    this.incoming.max_transfer_id = fields.next_incoming_id + fields.incoming_window;
    if (link) {
        if (link._get_drain()) fields.drain = true;
        fields.delivery_count = link.delivery_count;
        fields.handle = link.local.handle;
        fields.link_credit = link.credit;
    }
    this.output(frames.flow(fields));
};

Session.prototype.on_begin = function (frame) {
    if (this.state.remote_opened()) {
        if (!this.remote.channel) {
            this.remote.channel = frame.channel;
        }
        this.remote.begin = frame.performative;
        this.outgoing.on_begin(frame.performative);
        this.incoming.on_begin(frame.performative);
        this.open();
        this.dispatch('session_open', this._context());
    } else {
        throw Error('Begin already received');
    }
};
Session.prototype.on_end = function (frame) {
    if (this.state.remote_closed()) {
        this.remote.end = frame.performative;
        var error = this.remote.end.error;
        if (error) {
            var handled = this.dispatch('session_error', this._context());
            handled = this.dispatch('session_close', this._context()) || handled;
            if (!handled) {
                EventEmitter.prototype.emit.call(this.connection.container, 'error', new SessionError(error.description, error.condition, this));
            }
        } else {
            this.dispatch('session_close', this._context());
        }
        var self = this;
        var token = this.state.mark();
        process.nextTick(function () {
            if (self.state.marker === token) {
                self.close();
                process.nextTick(function () { self.remove(); });
            }
        });
    } else {
        throw Error('End already received');
    }
};

Session.prototype.on_attach = function (frame) {
    var name = frame.performative.name;
    var link = this.links[name];
    if (!link) {
        // if role is true, peer is receiver, so we are sender
        link = frame.performative.role ? this.create_sender(name) : this.create_receiver(name);
    }
    this.remote.handles[frame.performative.handle] = link;
    link.on_attach(frame);
    link.remote.attach = frame.performative;
};

Session.prototype.on_disposition = function (frame) {
    if (frame.performative.role) {
        log.events('[%s] Received disposition for outgoing transfers', this.connection.options.id);
        this.outgoing.on_disposition(frame.performative);
    } else {
        log.events('[%s] Received disposition for incoming transfers', this.connection.options.id);
        this.incoming.on_disposition(frame.performative);
    }
    this.connection._register();
};

Session.prototype.on_flow = function (frame) {
    this.outgoing.on_flow(frame.performative);
    this.incoming.on_flow(frame.performative);
    if (util.is_defined(frame.performative.handle)) {
        this._get_link(frame).on_flow(frame);
    }
    this.connection._register();
};

Session.prototype._context = function (c) {
    var context = c ? c : {};
    context.session = this;
    return this.connection._context(context);
};

Session.prototype._get_link = function (frame) {
    var handle = frame.performative.handle;
    var link = this.remote.handles[handle];
    if (!link) {
        throw Error('Invalid handle ' + handle);
    }
    return link;
};

Session.prototype.on_detach = function (frame) {
    this._get_link(frame).on_detach(frame);
};

Session.prototype.remove_link = function (link) {
    delete this.remote.handles[link.remote.handle];
    delete this.local.handles[link.local.handle];
    delete this.links[link.name];
};

/**
 * This forcibly removes the session from the parent connection. It
 * should not be called for a link on an active connection, where
 * close() should be used instead.
 */
Session.prototype.remove = function () {
    this.connection.remove_session(this);
};

Session.prototype.on_transfer = function (frame) {
    this.incoming.on_transfer(frame, this._get_link(frame));
};

module.exports = Session;

}, function(modId) { var map = {"./frames.js":1770126801035,"./link.js":1770126801042,"./log.js":1770126801037,"./message.js":1770126801043,"./types.js":1770126801036,"./util.js":1770126801034,"./endpoint.js":1770126801040,"util":1770126801034}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801042, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var frames = require('./frames.js');
var log = require('./log.js');
var message = require('./message.js');
var terminus = require('./terminus.js');
var EndpointState = require('./endpoint.js');

var FlowController = function (window) {
    this.window = window;
};
FlowController.prototype.update = function (context) {
    var delta = this.window - context.receiver.credit;
    if (delta >= (this.window/4)) {
        context.receiver.flow(delta);
    }
};

function auto_settle(context) {
    context.delivery.settled = true;
}

function auto_accept(context) {
    context.delivery.update(undefined, message.accepted().described());
}

function LinkError(message, condition, link) {
    Error.call(this);
    Error.captureStackTrace(this, this.constructor);
    this.message = message;
    this.condition = condition;
    this.description = message;
    Object.defineProperty(this, 'link', { value: link });
}
require('util').inherits(LinkError, Error);

var EventEmitter = require('events').EventEmitter;

var link = Object.create(EventEmitter.prototype);
link.dispatch = function(name) {
    log.events('[%s] Link got event: %s', this.connection.options.id, name);
    EventEmitter.prototype.emit.apply(this.observers, arguments);
    if (this.listeners(name).length) {
        EventEmitter.prototype.emit.apply(this, arguments);
        return true;
    } else {
        return this.session.dispatch.apply(this.session, arguments);
    }
};
link.set_source = function (fields) {
    this.local.attach.source = terminus.source(fields).described();
};
link.set_target = function (fields) {
    this.local.attach.target = terminus.target(fields).described();
};

link.attach = function () {
    if (this.state.open()) {
        this.connection._register();
    }
};
link.open = link.attach;

link.detach = function () {
    this.local.detach.closed = false;
    if (this.state.close()) {
        this.connection._register();
    }
};
link.close = function(error) {
    if (error) this.local.detach.error = error;
    this.local.detach.closed = true;
    if (this.state.close()) {
        this.connection._register();
    }
};

/**
 * This forcibly removes the link from the parent session. It should
 * not be called for a link on an active session/connection, where
 * close() should be used instead.
 */
link.remove = function() {
    this.session.remove_link(this);
};

link.is_open = function () {
    return this.session.is_open() && this.state.is_open();
};

link.is_remote_open = function () {
    return this.session.is_remote_open() && this.state.remote_open;
};

link.is_itself_closed = function() {
    return this.state.is_closed();
};

link.is_closed = function () {
    return this.session.is_closed() || this.is_itself_closed();
};

link._process = function () {
    do {
        if (this.state.need_open()) {
            this.session.output(this.local.attach);
        }

        if (this.issue_flow && this.state.local_open) {
            this.session._write_flow(this);
            this.issue_flow = false;
        }

        if (this.state.need_close()) {
            this.session.output(this.local.detach);
        }
    } while (!this.state.has_settled());
};

link.on_attach = function (frame) {
    if (this.state.remote_opened()) {
        if (!this.remote.handle) {
            this.remote.handle = frame.handle;
        }
        frame.performative.source = terminus.unwrap(frame.performative.source);
        frame.performative.target = terminus.unwrap(frame.performative.target);
        this.remote.attach = frame.performative;
        this.open();
        this.dispatch(this.is_receiver() ? 'receiver_open' : 'sender_open', this._context());
    } else {
        throw Error('Attach already received');
    }
};

link.prefix_event = function (event) {
    return (this.local.attach.role ? 'receiver_' : 'sender_') + event;
};

link.on_detach = function (frame) {
    if (this.state.remote_closed()) {
        if (this._incomplete) {
            this._incomplete.settled = true;
        }
        this.remote.detach = frame.performative;
        var error = this.remote.detach.error;
        if (error) {
            var handled = this.dispatch(this.prefix_event('error'), this._context());
            handled = this.dispatch(this.prefix_event('close'), this._context()) || handled;
            if (!handled) {
                EventEmitter.prototype.emit.call(this.connection.container, 'error', new LinkError(error.description, error.condition, this));
            }
        } else {
            this.dispatch(this.prefix_event('close'), this._context());
        }
        var self = this;
        var token = this.state.mark();
        process.nextTick(function () {
            if (self.state.marker === token) {
                self.close();
                process.nextTick(function () { self.remove(); });
            }
        });
    } else {
        throw Error('Detach already received');
    }
};

function is_internal(name) {
    switch (name) {
    case 'name':
    case 'handle':
    case 'role':
    case 'initial_delivery_count':
        return true;
    default:
        return false;
    }
}


var aliases = [
    'snd_settle_mode',
    'rcv_settle_mode',
    'source',
    'target',
    'max_message_size',
    'offered_capabilities',
    'desired_capabilities',
    'properties'
];

function remote_property_shortcut(name) {
    return function() { return this.remote.attach ? this.remote.attach[name] : undefined; };
}

link.init = function (session, name, local_handle, opts, is_receiver) {
    this.session = session;
    this.connection = session.connection;
    this.name = name;
    this.options = opts === undefined ? {} : opts;
    this.state = new EndpointState();
    this.issue_flow = false;
    this.local = {'handle': local_handle};
    this.local.attach = frames.attach({'handle':local_handle,'name':name, role:is_receiver});
    for (var field in this.local.attach) {
        if (!is_internal(field) && this.options[field] !== undefined) {
            this.local.attach[field] = this.options[field];
        }
    }
    this.local.detach = frames.detach({'handle':local_handle, 'closed':true});
    this.remote = {'handle':undefined};
    this.delivery_count = 0;
    this.credit = 0;
    this.observers = new EventEmitter();
    var self = this;
    aliases.forEach(function (alias) { Object.defineProperty(self, alias, { get: remote_property_shortcut(alias) }); });
    Object.defineProperty(this, 'error', { get:  function() { return this.remote.detach ? this.remote.detach.error : undefined; }});
};

link._disconnect = function() {
    this.state.disconnected();
    if (!this.state.was_open) {
        this.remove();
    }
};

link._reconnect = function() {
    this.state.reconnect();
    this.remote = {'handle':undefined};
    this.delivery_count = 0;
    this.credit = 0;
};

link.has_credit = function () {
    return this.credit > 0;
};
link.is_receiver = function () {
    return this.local.attach.role;
};
link.is_sender = function () {
    return !this.is_receiver();
};
link._context = function (c) {
    var context = c ? c : {};
    if (this.is_receiver()) {
        context.receiver = this;
    } else {
        context.sender = this;
    }
    return this.session._context(context);
};
link.get_option = function (name, default_value) {
    if (this.options[name] !== undefined) return this.options[name];
    else return this.session.get_option(name, default_value);
};

var Sender = function (session, name, local_handle, opts) {
    this.init(session, name, local_handle, opts, false);
    this._draining = false;
    this._drained = false;
    this.local.attach.initial_delivery_count = 0;
    this.tag = 0;
    if (this.get_option('autosettle', true)) {
        this.observers.on('settled', auto_settle);
    }
    var sender = this;
    if (this.get_option('treat_modified_as_released', true)) {
        this.observers.on('modified', function (context) {
            sender.dispatch('released', context);
        });
    }
};
Sender.prototype = Object.create(link);
Sender.prototype.constructor = Sender;
Sender.prototype._get_drain = function () {
    if (this._draining && this._drained && this.credit) {
        while (this.credit) {
            ++this.delivery_count;
            --this.credit;
        }
        return true;
    } else {
        return false;
    }
};
Sender.prototype.set_drained = function (drained) {
    this._drained = drained;
    if (this._draining && this._drained) {
        this.issue_flow = true;
    }
};
Sender.prototype.next_tag = function () {
    return Buffer.from(new String(this.tag++));
};
Sender.prototype.sendable = function () {
    return Boolean(this.credit && this.session.outgoing.available());
};
Sender.prototype.on_flow = function (frame) {
    var flow = frame.performative;
    this.credit = flow.delivery_count + flow.link_credit - this.delivery_count;
    this._draining = flow.drain;
    this._drained = this.credit > 0;
    if (this.is_open()) {
        this.dispatch('sender_flow', this._context());
        if (this._draining) {
            this.dispatch('sender_draining', this._context());
        }
        if (this.sendable()) {
            this.dispatch('sendable', this._context());
        }
    }
};
Sender.prototype.on_transfer = function () {
    throw Error('got transfer on sending link');
};

Sender.prototype.send = function (msg, tag, format) {
    var payload = format === undefined ? message.encode(msg) : msg;
    var delivery = this.session.send(this, tag ? tag : this.next_tag(), payload, format);
    if (this.local.attach.snd_settle_mode === 1) {
        delivery.settled = true;
    }
    return delivery;
};

var Receiver = function (session, name, local_handle, opts) {
    this.init(session, name, local_handle, opts, true);
    this.drain = false;
    this.set_credit_window(this.get_option('credit_window', 1000));
    if (this.get_option('autoaccept', true)) {
        this.observers.on('message', auto_accept);
    }
    if (this.local.attach.rcv_settle_mode === 1 && this.get_option('autosettle', true)) {
        this.observers.on('settled', auto_settle);
    }
};
Receiver.prototype = Object.create(link);
Receiver.prototype.constructor = Receiver;
Receiver.prototype.on_flow = function (frame) {
    this.dispatch('receiver_flow', this._context());
    if (frame.performative.drain) {
        this.credit = frame.performative.link_credit;
        this.delivery_count = frame.performative.delivery_count;
        if (frame.performative.link_credit > 0) console.error('ERROR: received flow with drain set, but non zero credit');
        else this.dispatch('receiver_drained', this._context());
    }
};
Receiver.prototype.flow = function(credit) {
    if (credit > 0) {
        this.credit += credit;
        this.issue_flow = true;
        this.connection._register();
    }
};

Receiver.prototype.drain_credit = function() {
    this.drain = true;
    this.issue_flow = true;
    this.connection._register();
};

Receiver.prototype.add_credit = Receiver.prototype.flow;//alias
Receiver.prototype._get_drain = function () {
    return this.drain;
};

Receiver.prototype.set_credit_window = function(credit_window) {
    if (credit_window > 0) {
        var flow_controller = new FlowController(credit_window);
        var listener = flow_controller.update.bind(flow_controller);
        this.observers.on('message', listener);
        this.observers.on('receiver_open', listener);
    }
};

module.exports = {'Sender': Sender, 'Receiver':Receiver};

}, function(modId) { var map = {"./frames.js":1770126801035,"./log.js":1770126801037,"./message.js":1770126801043,"./terminus.js":1770126801044,"./endpoint.js":1770126801040,"util":1770126801034}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801043, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var log = require('./log.js');
var types = require('./types.js');

var by_descriptor = {};
var unwrappers = {};
var wrappers = [];
var message = {};

function define_section(descriptor, unwrap, wrap) {
    unwrap.descriptor = descriptor;
    unwrappers[descriptor.symbolic] = unwrap;
    unwrappers[Number(descriptor.numeric).toString(10)] = unwrap;
    if (wrap) {
        wrappers.push(wrap);
    }
}

function define_composite_section(def) {
    var c = types.define_composite(def);
    message[def.name] = c.create;
    by_descriptor[Number(c.descriptor.numeric).toString(10)] = c;
    by_descriptor[c.descriptor.symbolic] = c;

    var unwrap = function (msg, section) {
        var composite = new c(section.value);
        for (var i = 0; i < def.fields.length; i++) {
            var f = def.fields[i];
            var v = composite[f.name];
            if (v !== undefined && v !== null) {
                msg[f.name] = v;
            }
        }
    };

    var wrap = function (sections, msg) {
        sections.push(c.create(msg).described());
    };
    define_section(c.descriptor, unwrap, wrap);
}


function define_map_section(def, symbolic) {
    var wrapper = symbolic ? types.wrap_symbolic_map : types.wrap_map;
    var descriptor = {numeric:def.code};
    descriptor.symbolic = 'amqp:' + def.name.replace(/_/g, '-') + ':map';
    var unwrap = function (msg, section) {
        msg[def.name] = types.unwrap_map_simple(section);
    };
    var wrap = function (sections, msg) {
        if (msg[def.name]) {
            sections.push(types.described_nc(types.wrap_ulong(descriptor.numeric), wrapper(msg[def.name])));
        }
    };
    define_section(descriptor, unwrap, wrap);
}

function Section(typecode, content, multiple) {
    this.typecode = typecode;
    this.content = content;
    this.multiple = multiple;
}

Section.prototype.described = function (item) {
    return types.described(types.wrap_ulong(this.typecode), types.wrap(item || this.content));
};

Section.prototype.collect_sections = function (sections) {
    if (this.multiple) {
        for (var i = 0; i < this.content.length; i++) {
            sections.push(this.described(this.content[i]));
        }
    } else {
        sections.push(this.described());
    }
};

define_composite_section({
    name:'header',
    code:0x70,
    fields:[
        {name:'durable', type:'boolean', default_value:false},
        {name:'priority', type:'ubyte', default_value:4},
        {name:'ttl', type:'uint'},
        {name:'first_acquirer', type:'boolean', default_value:false},
        {name:'delivery_count', type:'uint', default_value:0}
    ]
});
define_map_section({name:'delivery_annotations', code:0x71}, true);
define_map_section({name:'message_annotations', code:0x72}, true);
define_composite_section({
    name:'properties',
    code:0x73,
    fields:[
        {name:'message_id', type:'message_id'},
        {name:'user_id', type:'binary'},
        {name:'to', type:'string'},
        {name:'subject', type:'string'},
        {name:'reply_to', type:'string'},
        {name:'correlation_id', type:'message_id'},
        {name:'content_type', type:'symbol'},
        {name:'content_encoding', type:'symbol'},
        {name:'absolute_expiry_time', type:'timestamp'},
        {name:'creation_time', type:'timestamp'},
        {name:'group_id', type:'string'},
        {name:'group_sequence', type:'uint'},
        {name:'reply_to_group_id', type:'string'}
    ]
});
define_map_section({name:'application_properties', code:0x74});

function unwrap_body_section (msg, section, typecode) {
    if (msg.body === undefined) {
        msg.body = new Section(typecode, types.unwrap(section));
    } else if (msg.body.constructor === Section && msg.body.typecode === typecode) {
        if (msg.body.multiple) {
            msg.body.content.push(types.unwrap(section));
        } else {
            msg.body.multiple = true;
            msg.body.content = [msg.body.content, types.unwrap(section)];
        }
    }
}

define_section({numeric:0x75, symbolic:'amqp:data:binary'}, function (msg, section) { unwrap_body_section(msg, section, 0x75); });
define_section({numeric:0x76, symbolic:'amqp:amqp-sequence:list'}, function (msg, section) { unwrap_body_section(msg, section, 0x76); });
define_section({numeric:0x77, symbolic:'amqp:value:*'}, function (msg, section) { msg.body = types.unwrap(section); });

define_map_section({name:'footer', code:0x78});


function wrap_body (sections, msg) {
    if (msg.body && msg.body.collect_sections) {
        msg.body.collect_sections(sections);
    } else {
        sections.push(types.described(types.wrap_ulong(0x77), types.wrap(msg.body)));
    }
}

wrappers.push(wrap_body);

message.data_section = function (data) {
    return new Section(0x75, data);
};

message.sequence_section = function (list) {
    return new Section(0x76, list);
};

message.data_sections = function (data_elements) {
    return new Section(0x75, data_elements, true);
};

message.sequence_sections = function (lists) {
    return new Section(0x76, lists, true);
};

function copy(src, tgt) {
    for (var k in src) {
        var v = src[k];
        if (typeof v === 'object') {
            copy(v, tgt[k]);
        } else {
            tgt[k] = v;
        }
    }
}

function Message(o) {
    if (o) {
        copy(o, this);
    }
}

Message.prototype.toJSON = function () {
    var o = {};
    for (var key in this) {
        if (typeof this[key] === 'function') continue;
        o[key] = this[key];
    }
    return o;
};

Message.prototype.toString = function () {
    return JSON.stringify(this.toJSON());
};


message.encode = function(msg) {
    var sections = [];
    wrappers.forEach(function (wrapper_fn) { wrapper_fn(sections, msg); });
    var writer = new types.Writer();
    for (var i = 0; i < sections.length; i++) {
        log.message('Encoding section %d of %d: %o', (i+1), sections.length, sections[i]);
        writer.write(sections[i]);
    }
    var data = writer.toBuffer();
    log.message('encoded %d bytes', data.length);
    return data;
};

message.decode = function(buffer) {
    var msg = new Message();
    var reader = new types.Reader(buffer);
    while (reader.remaining()) {
        var s = reader.read();
        log.message('decoding section: %o of type: %o', s, s.descriptor);
        if (s.descriptor) {
            var unwrap = unwrappers[s.descriptor.value];
            if (unwrap) {
                unwrap(msg, s);
            } else {
                console.warn('WARNING: did not recognise message section with descriptor ' + s.descriptor);
            }
        } else {
            console.warn('WARNING: expected described message section got ' + JSON.stringify(s));
        }
    }
    return msg;
};

var outcomes = {};

function define_outcome(def) {
    var c = types.define_composite(def);
    c.composite_type = def.name;
    message[def.name] = c.create;
    outcomes[Number(c.descriptor.numeric).toString(10)] = c;
    outcomes[c.descriptor.symbolic] = c;
    message['is_' + def.name] = function (o) {
        if (o && o.descriptor) {
            var c = outcomes[o.descriptor.value];
            if (c) {
                return c.descriptor.numeric === def.code;
            }
        }
        return false;
    };
}

message.unwrap_outcome = function (outcome) {
    if (outcome && outcome.descriptor) {
        var c = outcomes[outcome.descriptor.value];
        if (c) {
            return new c(outcome.value);
        }
    }
    console.error('unrecognised outcome: ' + JSON.stringify(outcome));
    return outcome;
};

message.are_outcomes_equivalent = function(a, b) {
    if (a === undefined && b === undefined) return true;
    else if (a === undefined || b === undefined) return false;
    else return a.descriptor.value === b.descriptor.value && a.descriptor.value === 0x24;//only batch accepted
};

define_outcome({
    name:'received',
    code:0x23,
    fields:[
        {name:'section_number', type:'uint', mandatory:true},
        {name:'section_offset', type:'ulong', mandatory:true}
    ]});
define_outcome({name:'accepted', code:0x24, fields:[]});
define_outcome({name:'rejected', code:0x25, fields:[{name:'error', type:'error'}]});
define_outcome({name:'released', code:0x26, fields:[]});
define_outcome({
    name:'modified',
    code:0x27,
    fields:[
        {name:'delivery_failed', type:'boolean'},
        {name:'undeliverable_here', type:'boolean'},
        {name:'message_annotations', type:'map'}
    ]});

module.exports = message;

}, function(modId) { var map = {"./log.js":1770126801037,"./types.js":1770126801036}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801044, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var types = require('./types.js');

var terminus = {};
var by_descriptor = {};

function define_terminus(def) {
    var c = types.define_composite(def);
    terminus[def.name] = c.create;
    by_descriptor[Number(c.descriptor.numeric).toString(10)] = c;
    by_descriptor[c.descriptor.symbolic] = c;
}

terminus.unwrap = function(field) {
    if (field && field.descriptor) {
        var c = by_descriptor[field.descriptor.value];
        if (c) {
            return new c(field.value);
        } else {
            console.warn('Unknown terminus: ' + field.descriptor);
        }
    }
    return null;
};

define_terminus({
    name: 'source',
    code: 0x28,
    fields: [
        {name: 'address', type: 'string'},
        {name: 'durable', type: 'uint', default_value: 0},
        {name: 'expiry_policy', type: 'symbol', default_value: 'session-end'},
        {name: 'timeout', type: 'uint', default_value: 0},
        {name: 'dynamic', type: 'boolean', default_value: false},
        {name: 'dynamic_node_properties', type: 'symbolic_map'},
        {name: 'distribution_mode', type: 'symbol'},
        {name: 'filter', type: 'symbolic_map'},
        {name: 'default_outcome', type: '*'},
        {name: 'outcomes', type: 'symbol', multiple: true},
        {name: 'capabilities', type: 'symbol', multiple: true}
    ]
});

define_terminus({
    name: 'target',
    code: 0x29,
    fields: [
        {name: 'address', type: 'string'},
        {name: 'durable', type: 'uint', default_value: 0},
        {name: 'expiry_policy', type: 'symbol', default_value: 'session-end'},
        {name: 'timeout', type: 'uint', default_value: 0},
        {name: 'dynamic', type: 'boolean', default_value: false},
        {name: 'dynamic_node_properties', type: 'symbolic_map'},
        {name: 'capabilities', type: 'symbol', multiple: true}
    ]
});

module.exports = terminus;

}, function(modId) { var map = {"./types.js":1770126801036}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801045, function(require, module, exports) {
/*
 * Copyright 2018 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the 'License');
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an 'AS IS' BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var ReceiverEvents;
(function (ReceiverEvents) {
    /**
     * @property {string} message Raised when a message is received.
     */
    ReceiverEvents['message'] = 'message';
    /**
     * @property {string} receiverOpen Raised when the remote peer indicates the link is
     * open (i.e. attached in AMQP parlance).
     */
    ReceiverEvents['receiverOpen'] = 'receiver_open';
    /**
     * @property {string} receiverDrained Raised when the remote peer
     * indicates that it has drained all credit (and therefore there
     * are no more messages at present that it can send).
     */
    ReceiverEvents['receiverDrained'] = 'receiver_drained';
    /**
     * @property {string} receiverFlow Raised when a flow is received for receiver.
     */
    ReceiverEvents['receiverFlow'] = 'receiver_flow';
    /**
     * @property {string} receiverError Raised when the remote peer
     * closes the receiver with an error. The context may also have an
     * error property giving some information about the reason for the
     * error.
     */
    ReceiverEvents['receiverError'] = 'receiver_error';
    /**
     * @property {string} receiverClose Raised when the remote peer indicates the link is closed.
     */
    ReceiverEvents['receiverClose'] = 'receiver_close';
    /**
     * @property {string} settled Raised when the receiver link receives a disposition.
     */
    ReceiverEvents['settled'] = 'settled';
})(ReceiverEvents || (ReceiverEvents = {}));

var SenderEvents;
(function (SenderEvents) {
    /**
     * @property {string} sendable Raised when the sender has sufficient credit to be able
     * to transmit messages to its peer.
     */
    SenderEvents['sendable'] = 'sendable';
    /**
     * @property {string} senderOpen Raised when the remote peer indicates the link is
     * open (i.e. attached in AMQP parlance).
     */
    SenderEvents['senderOpen'] = 'sender_open';
    /**
     * @property {string} senderDraining Raised when the remote peer
     * requests that the sender drain its credit; sending all
     * available messages within the credit limit and ensuring credit
     * is used up..
     */
    SenderEvents['senderDraining'] = 'sender_draining';
    /**
     * @property {string} senderFlow Raised when a flow is received for sender.
     */
    SenderEvents['senderFlow'] = 'sender_flow';
    /**
     * @property {string} senderError Raised when the remote peer
     * closes the sender with an error. The context may also have an
     * error property giving some information about the reason for the
     * error.
     */
    SenderEvents['senderError'] = 'sender_error';
    /**
     * @property {string} senderClose Raised when the remote peer indicates the link is closed.
     */
    SenderEvents['senderClose'] = 'sender_close';
    /**
     * @property {string} accepted Raised when a sent message is accepted by the peer.
     */
    SenderEvents['accepted'] = 'accepted';
    /**
     * @property {string} released Raised when a sent message is released by the peer.
     */
    SenderEvents['released'] = 'released';
    /**
     * @property {string} rejected Raised when a sent message is rejected by the peer.
     */
    SenderEvents['rejected'] = 'rejected';
    /**
     * @property {string} modified Raised when a sent message is modified by the peer.
     */
    SenderEvents['modified'] = 'modified';
    /**
     * @property {string} settled Raised when the sender link receives a disposition.
     */
    SenderEvents['settled'] = 'settled';
})(SenderEvents || (SenderEvents = {}));


var SessionEvents;
(function (SessionEvents) {
    /**
     * @property {string} sessionOpen Raised when the remote peer indicates the session is
     * open (i.e. attached in AMQP parlance).
     */
    SessionEvents['sessionOpen'] = 'session_open';
    /**
     * @property {string} sessionError Raised when the remote peer receives an error. The context
     * may also have an error property giving some information about the reason for the error.
     */
    SessionEvents['sessionError'] = 'session_error';
    /**
     * @property {string} sessionClose Raised when the remote peer indicates the session is closed.
     */
    SessionEvents['sessionClose'] = 'session_close';
    /**
     * @property {string} settled Raised when the session receives a disposition.
     */
    SessionEvents['settled'] = 'settled';
})(SessionEvents || (SessionEvents = {}));

var ConnectionEvents;
(function (ConnectionEvents) {
    /**
     * @property {string} connectionOpen Raised when the remote peer indicates the connection is open.
     */
    ConnectionEvents['connectionOpen'] = 'connection_open';
    /**
     * @property {string} connectionClose Raised when the remote peer indicates the connection is closed.
     */
    ConnectionEvents['connectionClose'] = 'connection_close';
    /**
     * @property {string} connectionError Raised when the remote peer indicates an error occurred on
     * the connection.
     */
    ConnectionEvents['connectionError'] = 'connection_error';
    /**
     * @property {string} protocolError Raised when a protocol error is received on the underlying socket.
     */
    ConnectionEvents['protocolError'] = 'protocol_error',
    /**
     * @property {string} error Raised when an error is received on the underlying socket.
     */
    ConnectionEvents['error'] = 'error',
    /**
     * @property {string} disconnected Raised when the underlying tcp connection is lost. The context
     * has a reconnecting property which is true if the library is attempting to automatically reconnect
     * and false if it has reached the reconnect limit. If reconnect has not been enabled or if the connection
     * is a tcp server, then the reconnecting property is undefined. The context may also have an error
     * property giving some information about the reason for the disconnect.
     */
    ConnectionEvents['disconnected'] = 'disconnected';
    /**
     * @property {string} settled Raised when the connection receives a disposition.
     */
    ConnectionEvents['settled'] = 'settled';
})(ConnectionEvents || (ConnectionEvents = {}));

module.exports = {
    ReceiverEvents: ReceiverEvents,
    SenderEvents: SenderEvents,
    SessionEvents: SessionEvents,
    ConnectionEvents: ConnectionEvents
};

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801046, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


function nulltransform(data) { return data; }

function from_arraybuffer(data) {
    if (data instanceof ArrayBuffer) return Buffer.from(new Uint8Array(data));
    else return Buffer.from(data);
}

function to_typedarray(data) {
    return new Uint8Array(data);
}

function wrap(ws) {
    var data_recv = nulltransform;
    var data_send = nulltransform;
    if (ws.binaryType) {
        ws.binaryType = 'arraybuffer';
        data_recv = from_arraybuffer;
        data_send = to_typedarray;
    }
    return {
        end: function() {
            ws.close();
        },
        write: function(data) {
            try {
                ws.send(data_send(data), {binary:true});
            } catch (e) {
                ws.onerror(e);
            }
        },
        on: function(event, handler) {
            if (event === 'data') {
                ws.onmessage = function(msg_evt) {
                    handler(data_recv(msg_evt.data));
                };
            } else if (event === 'end') {
                ws.onclose = handler;
            } else if (event === 'error') {
                ws.onerror = handler;
            } else {
                console.error('ERROR: Attempt to set unrecognised handler on websocket wrapper: ' + event);
            }
        },
        get_id_string: function() {
            return ws.url;
        }
    };
}

module.exports = {

    'connect': function(Impl) {
        return function (url, protocols, options) {
            return function () {
                return {
                    connect: function(port_ignore, host_ignore, options_ignore, callback) {
                        var c = new Impl(url, protocols, options);
                        c.onopen = callback;
                        return wrap(c);
                    }
                };
            };
        };
    },
    'wrap': wrap
};

}, function(modId) { var map = {}; return __REQUIRE__(map[modId], modId); })
__DEFINE__(1770126801047, function(require, module, exports) {
/*
 * Copyright 2015 Red Hat Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


var amqp_types = require('./types.js');

module.exports = {
    selector : function (s) {
        return {'jms-selector':amqp_types.wrap_described(s, 0x468C00000004)};
    }
};

}, function(modId) { var map = {"./types.js":1770126801036}; return __REQUIRE__(map[modId], modId); })
return __REQUIRE__(1770126801031);
})()
//miniprogram-npm-outsideDeps=["net","tls","events","fs","os","path","debug"]
//# sourceMappingURL=index.js.map