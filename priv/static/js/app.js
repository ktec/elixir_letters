(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var has = ({}).hasOwnProperty;

  var aliases = {};

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf('components/' === 0)) {
        start = 'components/'.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return 'components/' + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var expand = (function() {
    var reg = /^\.\.?(\/|$)/;
    return function(root, name) {
      var results = [], parts, part;
      parts = (reg.test(name) ? root + '/' + name : name).split('/');
      for (var i = 0, length = parts.length; i < length; i++) {
        part = parts[i];
        if (part === '..') {
          results.pop();
        } else if (part !== '.' && part !== '') {
          results.push(part);
        }
      }
      return results.join('/');
    };
  })();
  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function(name) {
      var absolute = expand(dirname(path), name);
      return globals.require(absolute, path);
    };
  };

  var initModule = function(name, definition) {
    var module = {id: name, exports: {}};
    cache[name] = module;
    definition(module.exports, localRequire(name), module);
    return module.exports;
  };

  var require = function(name, loaderPath) {
    var path = expand(name, '.');
    if (loaderPath == null) loaderPath = '/';
    path = unalias(name, loaderPath);

    if (has.call(cache, path)) return cache[path].exports;
    if (has.call(modules, path)) return initModule(path, modules[path]);

    var dirIndex = expand(path, './index');
    if (has.call(cache, dirIndex)) return cache[dirIndex].exports;
    if (has.call(modules, dirIndex)) return initModule(dirIndex, modules[dirIndex]);

    throw new Error('Cannot find module "' + name + '" from '+ '"' + loaderPath + '"');
  };

  require.alias = function(from, to) {
    aliases[to] = from;
  };

  require.register = require.define = function(bundle, fn) {
    if (typeof bundle === 'object') {
      for (var key in bundle) {
        if (has.call(bundle, key)) {
          modules[key] = bundle[key];
        }
      }
    } else {
      modules[bundle] = fn;
    }
  };

  require.list = function() {
    var result = [];
    for (var item in modules) {
      if (has.call(modules, item)) {
        result.push(item);
      }
    }
    return result;
  };

  require.brunch = true;
  globals.require = require;
})();
require.register("web/static/js/app", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _phoenix = require("phoenix");

// let socket = new Socket("/ws")
// socket.connect()
// let chan = socket.chan("topic:subtopic", {})
// chan.join().receive("ok", resp => {
//   console.log("Joined succesffuly!", resp)
// })

var App = (function () {
  function App() {
    _classCallCheck(this, App);
  }

  _createClass(App, null, [{
    key: "init",
    value: function init() {
      var _this = this;

      var socket = new _phoenix.Socket("/socket", {
        logger: function logger(kind, msg, data) {
          console.log(kind + ": " + msg, data);
        }
      });

      socket.connect();
      socket.onClose(function (e) {
        return console.log("CLOSE", e);
      });

      var $status = $("#status");
      var $messages = $("#messages");
      var $input = $("#message-input");
      var $username = $("#username");
      var $draggable = $(".draggable");
      var $client_id = this.guid();
      var $room = this.get_room();

      var chan = socket.chan("rooms:" + $room, { client_id: $client_id });

      chan.join().receive("ignore", function () {
        return console.log("auth error");
      }).receive("ok", function () {
        return console.log("join ok");
      }).after(10000, function () {
        return console.log("Connection interruption");
      });
      chan.onError(function (e) {
        return console.log("something went wrong", e);
      });
      chan.onClose(function (e) {
        return console.log("channel closed", e);
      });

      chan.on("join", function (msg) {

        for (var letter in msg.positions) {
          //console.log("position received for ", letter)
          _this.move_letter(letter, msg.positions[letter]);
        }

        $("#letters-container").show();

        $("#content").keydown(function (event) {
          //console.log("You pressed the key: ", String.fromCharCode(event.keyCode))
        });

        $("#content").mousemove(function (event) {
          chan.push("mousemove", {
            client_id: $client_id,
            x: event.pageX, y: event.pageY
          });
        });
      });

      chan.on("mousemove", function (msg) {
        if (msg.client_id != $client_id) {
          //console.log msg
          var element = _this.find_or_create_cursor(msg.client_id);
          element.css('top', msg.y - 74).css('left', msg.x - 12).stop(true, false).fadeIn("fast").delay(2000).fadeOut("slow");
        }
      });

      chan.on("user_count:update", function (msg) {
        $("#user_count").text(msg.user_count);
      });

      chan.on("update:position", function (msg) {
        if (msg.user != $client_id) {
          _this.move_letter(msg.body.id, msg.body);
        }
      });

      $draggable.on("drag", function (e, ui) {
        chan.push("set:position", {
          user: $client_id, body: {
            id: e.target.id, left: ui.position.left, top: ui.position.top
          }
        });
        //$(e.target).css('color',  '#'+('00000'+(Math.random()*16777216<<0).toString(16)).substr(-6))
      });

      $draggable.on("dragstart", function (e, ui) {});

      $draggable.on("dragstop", function (e, ui) {
        chan.push("save:snapshot", {});
      });

      $draggable.draggable();
    }
  }, {
    key: "sanitize_id",
    value: function sanitize_id(id) {
      return encodeURI(id).replace(/(:|\.|\?|\!|\[|\]|,)/g, "\\$1");
    }
  }, {
    key: "get_room",
    value: function get_room() {
      var room = window.location["hash"].replace("#", "");
      if (!room.length) {
        room = "lobby";
      }
      // console.log("room: ", room)
      return room;
    }
  }, {
    key: "guid",
    value: function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
    }
  }, {
    key: "find_or_create_cursor",
    value: function find_or_create_cursor(id) {
      var element = $("#" + id);
      if (!element.length) element = $("<div id=\"" + id + "\" class=\"mouse\"></div>").appendTo("#content");
      return element;
    }
  }, {
    key: "move_letter",
    value: function move_letter(id, pos) {
      var element = $("#" + this.sanitize_id(id));
      if (element.length) {
        element.css('top', pos.top).css('left', pos.left);
      }
    }
  }]);

  return App;
})();

$(function () {
  return App.init();
});

exports["default"] = App;
module.exports = exports["default"];
});

;
//# sourceMappingURL=app.js.map