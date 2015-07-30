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
      var $status = $("#status");
      var $messages = $("#messages");
      var $input = $("#message-input");
      var $username = $("#username");
      var $draggable = $("#draggable");

      socket.onClose(function (e) {
        return console.log("CLOSE", e);
      });

      var chan = socket.chan("rooms:lobby", {});
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

      $input.off("keypress").on("keypress", function (e) {
        if (e.keyCode == 13) {
          chan.push("new:msg", { user: $username.val(), body: $input.val() });
          $input.val("");
        }
      });

      chan.on("new:msg", function (msg) {
        $messages.append(_this.messageTemplate(msg));
        scrollTo(0, document.body.scrollHeight);
      });

      chan.on("user:entered", function (msg) {
        var username = _this.sanitize(msg.user || "anonymous");
        $messages.append("<br/><i>[" + username + " entered]</i>");
      });

      $draggable.on("dragstop", function (e, ui) {
        console.log(e + ": " + ui);
      });

      $draggable.draggable();
    }
  }, {
    key: "sanitize",
    value: function sanitize(html) {
      return $("<div/>").text(html).html();
    }
  }, {
    key: "messageTemplate",
    value: function messageTemplate(msg) {
      var username = this.sanitize(msg.user || "anonymous");
      var body = this.sanitize(msg.body);

      return "<p><a href='#'>[" + username + "]</a>&nbsp; " + body + "</p>";
    }

    /*
      //Global constiable as Chrome doesnt allow access to event.dataTransfer in dragover
    
      const offset_data = ""
    
      static function drag_start(event) {
          const style = window.getComputedStyle(event.target, null)
          offset_data =
            (parseInt(style.getPropertyValue("left"),10) - event.clientX) + ',' +
            (parseInt(style.getPropertyValue("top"),10) - event.clientY)
          event.dataTransfer.setData("text/plain",offset_data)
      }
    
      static function drag_over(event) {
          const offset
          try {
              offset = event.dataTransfer.getData("text/plain").split(',')
          }
          catch(e) {
              offset = offset_data.split(',')
          }
          const dm = document.getElementById('dragme')
          dm.style.left = (event.clientX + parseInt(offset[0],10)) + 'px'
          dm.style.top = (event.clientY + parseInt(offset[1],10)) + 'px'
          event.preventDefault()
          return false
      }
    
      static function drop(event) {
          const offset
          try {
              offset = event.dataTransfer.getData("text/plain").split(',')
          }
          catch(e) {
              offset = offset_data.split(',')
          }
          const dm = document.getElementById('dragme')
          dm.style.left = (event.clientX + parseInt(offset[0],10)) + 'px'
          dm.style.top = (event.clientY + parseInt(offset[1],10)) + 'px'
          event.preventDefault()
          return false
      }
      const dm = document.getElementById('dragme')
      dm.addEventListener('dragstart',drag_start,false)
      document.body.addEventListener('dragover',drag_over,false)
      document.body.addEventListener('drop',drop,false)
      */

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