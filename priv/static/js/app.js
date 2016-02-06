(function() {
  'use strict';

  var globals = typeof window === 'undefined' ? global : window;
  if (typeof globals.require === 'function') return;

  var modules = {};
  var cache = {};
  var aliases = {};
  var has = ({}).hasOwnProperty;

  var endsWith = function(str, suffix) {
    return str.indexOf(suffix, str.length - suffix.length) !== -1;
  };

  var _cmp = 'components/';
  var unalias = function(alias, loaderPath) {
    var start = 0;
    if (loaderPath) {
      if (loaderPath.indexOf(_cmp) === 0) {
        start = _cmp.length;
      }
      if (loaderPath.indexOf('/', start) > 0) {
        loaderPath = loaderPath.substring(start, loaderPath.indexOf('/', start));
      }
    }
    var result = aliases[alias + '/index.js'] || aliases[loaderPath + '/deps/' + alias + '/index.js'];
    if (result) {
      return _cmp + result.substring(0, result.length - '.js'.length);
    }
    return alias;
  };

  var _reg = /^\.\.?(\/|$)/;
  var expand = function(root, name) {
    var results = [], part;
    var parts = (_reg.test(name) ? root + '/' + name : name).split('/');
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

  var dirname = function(path) {
    return path.split('/').slice(0, -1).join('/');
  };

  var localRequire = function(path) {
    return function expanded(name) {
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
  require._cache = cache;
  globals.require = require;
})();
require.register("web/static/js/app", function(exports, require, module) {
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _slicedToArray = (function () { function sliceIterator(arr, i) { var _arr = []; var _n = true; var _d = false; var _e = undefined; try { for (var _i = arr[Symbol.iterator](), _s; !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"]) _i["return"](); } finally { if (_d) throw _e; } } return _arr; } return function (arr, i) { if (Array.isArray(arr)) { return arr; } else if (Symbol.iterator in Object(arr)) { return sliceIterator(arr, i); } else { throw new TypeError("Invalid attempt to destructure non-iterable instance"); } }; })();

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _phoenix = require("phoenix");

var App = (function () {
  function App() {
    _classCallCheck(this, App);
  }

  _createClass(App, null, [{
    key: "loadFonts",
    value: function loadFonts() {
      // Load them fonts before starting...!
      WebFont.load({
        custom: {
          families: ['rounds_blackregular']
        },
        active: function active() {
          // go go go!!
          App.init();
        }
      });
    }
  }, {
    key: "init",
    value: function init() {
      var _this = this;

      var socket = new _phoenix.Socket("/socket", {
        logger: function logger(kind, msg, data) {
          //console.log(`${kind}: ${msg}`, data)
        }
      });

      socket.connect();
      socket.onClose(function (e) {
        return console.log("CLOSE", e);
      });

      // const $status    = $("#status")
      // const $messages  = $("#messages")
      // const $input     = $("#message-input")
      var $username = $("#username");
      var $draggable = $(".draggable");
      var $client_id = this.guid();
      var $room = this.get_room();
      var $container = $("#fridge");

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

      var onDrag = function onDrag(id, x, y) {
        chan.push("set:position", {
          user: $client_id,
          body: { id: id, x: x, y: y }
        });
      };

      var onDragStop = function onDragStop(id, x, y) {
        chan.push("save:snapshot", {});
      };

      // ensure the username input works as expcted
      $username.keydown(function (event) {
        if (event.which == 13) {
          event.preventDefault();
          $username.blur();
        }
      });

      $container.on('click', function (e) {
        $username.blur();
      });

      // create the root of the scene graph
      var stage = new PIXI.Container(0x97c56e, true);
      var renderer = new PixiLayer($container, chan, stage);

      // add a shiny background...
      var background = PIXI.Sprite.fromImage('/images/servis.jpg');
      background.scale.set(0.7);
      background.anchor.set(0.5);
      background.position.x = window.innerWidth / 2;
      background.position.y = 350 + window.innerHeight / 2;
      stage.addChild(background);

      var letters_config = get_letters();
      var lettersManager = new LettersManager(stage, letters_config, onDrag, onDragStop);

      chan.on("join", function (msg) {
        // console.log("join", msg)
        lettersManager.setInitialPositions(msg.positions);
        // $("#content").keydown(function (event){
        //   //console.log("You pressed the key: ", String.fromCharCode(event.keyCode))
        // })
        $("#letters-container").show();
      });

      $("#content").mousemove(function (event) {
        chan.push("mousemove", {
          client_id: $client_id,
          username: $username.val(),
          x: event.pageX, y: event.pageY
        });
      });

      chan.on("mousemove", function (msg) {
        if (msg.client_id != $client_id) {
          // console.log(msg)
          var element = _this.find_or_create_cursor(msg.client_id, msg.username);
          element.css('top', msg.y - 105).css('left', msg.x - 10).clearQueue().stop(true, false)
          // .hide()
          //.fadeIn(10)
          .fadeTo('fast', 1).css('display', 'block').delay(1000).fadeOut(400);
        }
      });

      chan.on("user_count:update", function (msg) {
        $("#user_count").text(msg.user_count);
      });

      chan.on("update:position", function (msg) {
        if (msg.user != $client_id) {
          lettersManager.moveLetter(msg.body.id, msg.body);
        }
      });
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
    value: function find_or_create_cursor(id, username) {
      var element = $("#" + id);
      if (!element.length) element = $("<div id=\"" + id + "\" class=\"mouse\"><p class=\"name\"></p></div>").appendTo("#content");
      element.find(".name").text(username);
      return element;
    }
  }]);

  return App;
})();

var PixiLayer = (function () {
  function PixiLayer(container, chan, stage) {
    _classCallCheck(this, PixiLayer);

    this.chan = chan;
    var renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, { backgroundColor: 0xffffff }, false, true);
    renderer.view.style.width = window.innerWidth + "px";
    renderer.view.style.height = window.innerHeight + "px";
    renderer.view.style.display = "block";

    renderer.view.id = "letters-container";
    container.append(renderer.view);
    //
    this.animate(this.animate, renderer, stage);
  }

  _createClass(PixiLayer, [{
    key: "animate",
    value: function animate(_animate, renderer, stage) {
      // for (var i in letters_map) {
      //   letters_map[i].rotation += Math.random() * (0.1 - 0.001) + 0
      // }
      renderer.render(stage);
      requestAnimationFrame(function () {
        _animate(_animate, renderer, stage);
      });
    }
  }]);

  return PixiLayer;
})();

var LettersManager = (function () {
  function LettersManager(stage, letters_config, onDrag, onDragStop) {
    _classCallCheck(this, LettersManager);

    this.stage = stage;
    this.createLetters(letters_config, stage, onDrag, onDragStop);
  }

  _createClass(LettersManager, [{
    key: "setInitialPositions",
    value: function setInitialPositions(positions) {
      // initialise the letter positions
      for (var letter in positions) {
        this.moveLetter(letter, positions[letter]);
      }
    }
  }, {
    key: "createLetters",
    value: function createLetters(letters, stage, onDrag, onDragStop) {
      var letter_map = {};
      for (var i in letters) {
        var _letters$i = _slicedToArray(letters[i], 2);

        var id = _letters$i[0];
        var char = _letters$i[1];

        var letter = new Letter(stage, id, char, 30, 30, onDrag, onDragStop, this.randomColour());
        letter_map[id] = letter;
        // createLetter(id, char, 30, 30) //Math.random() * window.innerWidth, Math.random() * window.innerHeight)
      }
      this.letter_map = letter_map;
    }
  }, {
    key: "randomColour",
    value: function randomColour() {
      var colours = ["#9C2E23", "#C5A02F", "#002F6B", "#3D6F24", '#cc00ff'];
      return colours[Math.floor(Math.random() * colours.length)];
    }
  }, {
    key: "moveLetter",
    value: function moveLetter(id, position) {
      try {
        var letter = this.letter_map[id];
        letter.position(position.x, position.y);
      } catch (e) {
        console.log(e);
      }
    }
  }]);

  return LettersManager;
})();

var Letter = (function () {
  function Letter(stage, id, char, x, y, onDrag, onDragStop, colour) {
    _classCallCheck(this, Letter);

    var container = new PIXI.Container();
    var text = new PIXI.Text(char, { font: '22px rounds_blackregular', fill: colour, align: 'left' });
    container.addChild(text);
    container.interactive = true;
    container.buttonMode = true;
    text.anchor.set(0.5);
    this.id = id;
    var de = this.onDragEnd.bind(this);
    var ds = this.onDragStart.bind(this);
    var dm = this.onDragMove.bind(this);
    container
    // events for drag start
    .on('mousedown', ds).on('touchstart', ds)
    // events for drag end
    .on('mouseup', de).on('mouseupoutside', de).on('touchend', de).on('touchendoutside', de)
    // events for drag move
    .on('mousemove', dm).on('touchmove', dm);
    container.position.x = x;
    container.position.y = y;
    this.letter = container;
    stage.addChild(container);
    this.broadcastDrag = onDrag;
    this.broadcastDragStop = onDragStop;
  }

  _createClass(Letter, [{
    key: "position",
    value: function position(x, y) {
      // console.log("set position: ", x, y);
      this.letter.position.x = x;
      this.letter.position.y = y;
    }
  }, {
    key: "onDragStart",
    value: function onDragStart(event) {
      // store a reference to the data
      // the reason for this is because of multitouch
      // we want to track the movement of this particular touch
      event.target.data = event.data;
      event.target.alpha = 0.5;
      event.target.dragging = true;
    }
  }, {
    key: "onDragEnd",
    value: function onDragEnd(event) {
      event.target.alpha = 1;
      event.target.dragging = false;
      // set the interaction data to null
      event.target.data = null;
      // TODO: Fix this with a js pub/sub solution
      // Here is a great one http://davidwalsh.name/pubsub-javascript
      this.broadcastDragStop();
    }
  }, {
    key: "onDragMove",
    value: function onDragMove(event) {
      if (event.target.dragging) {
        var newPosition = event.target.data.getLocalPosition(event.target.parent);
        event.target.position.x = newPosition.x;
        event.target.position.y = newPosition.y;
        this.broadcastDrag(this.id, newPosition.x, newPosition.y);
      }
    }
  }]);

  return Letter;
})();

$(function () {
  return App.loadFonts();
});

exports["default"] = App;
module.exports = exports["default"];
});

;
//# sourceMappingURL=app.js.map