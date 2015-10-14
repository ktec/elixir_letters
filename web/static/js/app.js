import {Socket} from "phoenix"

// let socket = new Socket("/ws")
// socket.connect()
// let chan = socket.chan("topic:subtopic", {})
// chan.join().receive("ok", resp => {
//   console.log("Joined succesffuly!", resp)
// })

class App {
  static init(){
    let socket = new Socket("/socket", {
      logger: (kind, msg, data) => {
        console.log(`${kind}: ${msg}`, data)
      }
    })

    socket.connect()
    socket.onClose( e => console.log("CLOSE", e))

    const $status    = $("#status")
    const $messages  = $("#messages")
    const $input     = $("#message-input")
    const $username  = $("#username")
    const $draggable = $(".draggable")
    const $client_id  = this.guid()
    const $room       = this.get_room()

    const chan = socket.chan("rooms:" + $room,
      { client_id: $client_id }
    )

    chan.join().receive("ignore", () => console.log("auth error"))
               .receive("ok", () => console.log("join ok"))
               .after(10000, () => console.log("Connection interruption"))
    chan.onError(e => console.log("something went wrong", e))
    chan.onClose(e => console.log("channel closed", e))

    chan.on("join", msg=>{

      for (var letter in msg.positions){
        //console.log("position received for ", letter)
        this.move_letter(
          letter,
          msg.positions[letter])
      }

      $("#letters-container").show()

      this.setupPixi()

      $("#content").keydown(function (event){
        //console.log("You pressed the key: ", String.fromCharCode(event.keyCode))
      })

      $("#content").mousemove(function(event) {
        chan.push("mousemove",
          {
            client_id: $client_id,
            username: $username.val(),
            x: event.pageX, y: event.pageY
          }
        )
      })

    })

    chan.on("mousemove", msg => {
      if (msg.client_id != $client_id){
        //console.log msg
        let element = this.find_or_create_cursor(msg.client_id, msg.username)
        element
          .css('top', msg.y - 74)
          .css('left', msg.x - 12)
          .stop(true,false)
          .fadeIn("fast")
          .delay(2000)
          .fadeOut("slow")
      }
    })

    chan.on("user_count:update", msg => {
      $("#user_count").text(msg.user_count)
    })

    chan.on("update:position", msg => {
      if (msg.user != $client_id){
        this.move_letter(msg.body.id, msg.body)
      }
    })

    $draggable.on("drag", (e, ui) => {
      chan.push("set:position", {
        user: $client_id, body: {
          id: e.target.id,
          left: ui.position.left,
          top: ui.position.top
        }
      })
      //$(e.target).css('color',  '#'+('00000'+(Math.random()*16777216<<0).toString(16)).substr(-6))
    })

    $draggable.on("dragstart", (e, ui) => {
    })

    $draggable.on("dragstop", (e, ui) => {
      chan.push("save:snapshot", {})
    })

    $draggable.draggable()

  }

  static sanitize_id(id) {
    return encodeURI(id).replace( /(:|\.|\?|\!|\[|\]|,)/g, "\\$1" );
  }

  static get_room() {
    let room = window.location["hash"].replace("#","")
    if (!room.length) { room = "lobby" }
    // console.log("room: ", room)
    return room
  }

  static guid() {
    function s4() {
      return Math.floor((1 + Math
        .random()) * 0x10000)
        .toString(16)
        .substring(1)
    }
    return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
      s4() + '-' + s4() + s4() + s4()
  }

  static find_or_create_cursor(id, username) {
    let element = $("#" + id)
    if (!element.length)
      element =
        $("<div id=\"" + id +"\" class=\"mouse\"><p class=\"name\"></p></div>")
        .appendTo("#content")
    element.find( ".name" ).text(username)
    return element
  }

  static move_letter(id, pos) {
    let element = $("#" + this.sanitize_id(id))
    if (element.length) {
      element
        .css('top', pos.top)
        .css('left', pos.left)
    }
  }

  static setupPixi() {
    const renderer = PIXI.autoDetectRenderer(800, 600);

    renderer.resize(window.innerWidth, window.innerHeight);

    document.body.appendChild(renderer.view);

    // create the root of the scene graph
    var stage = new PIXI.Container();

    // add a shiny background...
    var background = PIXI.Sprite.fromImage('/images/textDemoBG.jpg');
    stage.addChild(background);

    // create some white text using the Snippet webfont
    var textSample = new PIXI.Text('Pixi.js can has\n multiline text!', { font: '35px Snippet', fill: 'white', align: 'left' });
    textSample.position.set(20);
    stage.addChild(textSample);

    requestAnimationFrame(animate);
    function animate() {
      renderer.render(stage);
      requestAnimationFrame(animate);
    }

  }


  // // Load them google fonts before starting...!
  // window.WebFontConfig = {
  //     google: {
  //         families: ['Snippet', 'Arvo:700italic', 'Podkova:700']
  //     },
  //
  //     active: function() {
  //         // do something
  //         init();
  //     }
  // };

  // function init()
  // {
      // PIXI.loader
      //     .add('desyrel', '_assets/desyrel.xml')
      //     .load(onAssetsLoaded);
      //
      // function onAssetsLoaded()
      // {
      //     var bitmapFontText = new PIXI.extras.BitmapText('bitmap fonts are\n now supported!', { font: '35px Desyrel', align: 'right' });
      //
      //     bitmapFontText.position.x = 600 - bitmapFontText.textWidth;
      //     bitmapFontText.position.y = 20;
      //
      //     stage.addChild(bitmapFontText);
      // }

      //

      // create a text object with a nice stroke
      // var spinningText = new PIXI.Text('I\'m fun!', { font: 'bold 60px Arial', fill: '#cc00ff', align: 'center', stroke: '#FFFFFF', strokeThickness: 6 });

      // setting the anchor point to 0.5 will center align the text... great for spinning!
      // spinningText.anchor.set(0.5);
      // spinningText.position.x = 310;
      // spinningText.position.y = 200;
      //
      // // create a text object that will be updated...
      // var countingText = new PIXI.Text('COUNT 4EVAR: 0', { font: 'bold italic 60px Arvo', fill: '#3e1707', align: 'center', stroke: '#a4410e', strokeThickness: 7 });

      // countingText.position.x = 310;
      // countingText.position.y = 320;
      // countingText.anchor.x = 0.5;

      // stage.addChild(spinningText);
      // stage.addChild(countingText);

      // var count = 0;
      //
  // }


}

$( () => App.init() )

export default App
