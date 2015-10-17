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
          families: ['alphafridgemagnets_regular']
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
      var $container = $("#content");

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

      var renderer = new PixiLayer($container, chan);
      var letters_config = get_letters();
      var lettersManager = new LettersManager(renderer.stage, letters_config, onDrag, onDragStop);

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
          console.log(msg);
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
          lettersManager.move_letter(msg.body.id, msg.body);
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
  function PixiLayer(container, chan) {
    _classCallCheck(this, PixiLayer);

    this.chan = chan;
    this.renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, { backgroundColor: 0xffffff }, false, true);
    this.renderer.view.id = "letters-container";
    container.append(this.renderer.view);

    // create the root of the scene graph
    this.stage = new PIXI.Container(0x97c56e, true);
    // add a shiny background...
    var background = PIXI.Sprite.fromImage('/images/scrabble_board.png');
    background.scale.set(0.7);
    this.stage.addChild(background);
    //
    this.animate(this.animate, this.renderer, this.stage);
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
    this.createLetters(letters_config, onDrag, onDragStop);
  }

  _createClass(LettersManager, [{
    key: "setInitialPositions",
    value: function setInitialPositions(positions) {
      // initialise the letter positions
      for (var letter in positions) {
        this.move_letter(letter, positions[letter]);
      }
    }
  }, {
    key: "createLetters",
    value: function createLetters(letters, onDrag, onDragStop) {
      this.letters_map = {};
      for (var i in letters) {
        var id = letters[i]['code'] + '_' + letters[i]['count'];
        var char = letters[i]['letter'];
        var letter = new Letter(this.stage, id, char, 30, 30, onDrag, onDragStop);
        this.letters_map[id] = letter;
        // createLetter(id, char, 30, 30) //Math.random() * window.innerWidth, Math.random() * window.innerHeight)
      }
      this.letters_map;
    }
  }, {
    key: "move_letter",
    value: function move_letter(id, position) {
      try {
        var letter = this.letters_map[id];
        letter.position(position.x, position.y);
      } catch (e) {
        console.log(e);
      }
    }
  }]);

  return LettersManager;
})();

var Letter = (function () {
  function Letter(stage, id, char, x, y, onDrag, onDragStop) {
    _classCallCheck(this, Letter);

    //const colours = ["#9C2E23", "#C5A02F", "#002F6B", "#3D6F24",'#cc00ff']
    var colours = ["FFFFFF"];

    function getPoints(char) {
      var points = {
        1: "AEIOULNSTR",
        2: "DG",
        3: "BCMP",
        4: "FHVWY",
        5: "K",
        8: "JX",
        10: "QZ"
      };
      for (var i in points) {
        if (points[i].toLowerCase().indexOf(char.toLowerCase()) != -1) {
          return i;
        }
      }
      return 1;
    }

    this.stage = stage;
    var randomColour = colours[Math.floor(Math.random() * colours.length)];
    var container = new PIXI.Container();
    var tile = PIXI.Sprite.fromImage('/images/blank_tile.jpg');
    tile.scale.x = 0.09;
    tile.scale.y = 0.09;
    var text = new PIXI.Text(char, { font: '26px Arial', fill: randomColour, align: 'center', stroke: '#FFFFFF', strokeThickness: 2 });
    var value = new PIXI.Text(getPoints(char), { font: '12px Arial', fill: randomColour, align: 'center', stroke: '#FFFFFF', strokeThickness: 1 });
    container.addChild(tile);
    container.addChild(value);
    container.addChild(text);
    container.interactive = true;
    container.buttonMode = true;
    text.anchor.set(0.5);
    tile.anchor.set(0.5);
    value.anchor = new PIXI.Point(-0.9, -0.2);
    container.id = id;
    container["class"] = this;
    //container.scale.set(3)
    container
    // events for drag start
    .on('mousedown', this.onDragStart).on('touchstart', this.onDragStart)
    // events for drag end
    .on('mouseup', this.onDragEnd).on('mouseupoutside', this.onDragEnd).on('touchend', this.onDragEnd).on('touchendoutside', this.onDragEnd)
    // events for drag move
    .on('mousemove', this.onDragMove).on('touchmove', this.onDragMove);
    container.position.x = x;
    container.position.y = y;
    this.letter = container;
    this.stage.addChild(container);
    this.broadcastDrag = onDrag;
    this.broadcastDragStop = onDragStop;
  }

  _createClass(Letter, [{
    key: "position",
    value: function position(x, y) {
      console.log("set position: ", x, y);
      this.letter.position.x = x;
      this.letter.position.y = y;
    }
  }, {
    key: "onDragStart",
    value: function onDragStart(event) {
      // store a reference to the data
      // the reason for this is because of multitouch
      // we want to track the movement of this particular touch
      this.data = event.data;
      this.alpha = 0.5;
      this.dragging = true;
    }
  }, {
    key: "onDragEnd",
    value: function onDragEnd() {
      this.alpha = 1;
      this.dragging = false;
      // set the interaction data to null
      this.data = null;
      // TODO: Fix this with a js pub/sub solution
      // Here is a great one http://davidwalsh.name/pubsub-javascript
      this["class"].broadcastDragStop();
    }
  }, {
    key: "onDragMove",
    value: function onDragMove() {
      if (this.dragging) {
        var newPosition = this.data.getLocalPosition(this.parent);
        this.position.x = newPosition.x;
        this.position.y = newPosition.y;
        this["class"].broadcastDrag(this.id, newPosition.x, newPosition.y);
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