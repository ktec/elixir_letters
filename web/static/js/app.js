import {Socket} from "phoenix"

class App {

  static loadFonts() {
    // Load them fonts before starting...!
    WebFont.load({
      custom: {
        families: ['rounds_blackregular']
      },
      active: function() {
        // go go go!!
        App.init()
      }
    })
  }

  static init(){
    let socket = new Socket("/socket", {
      logger: (kind, msg, data) => {
        console.log(`${kind}: ${msg}`, data)
      }
    })

    socket.connect()
    socket.onClose( e => console.log("SOCKET CLOSE", e))

    const $username  = $("#username")
    $username.val($.cookie("username"))
    // const $draggable = $(".draggable")
    const $client_id = window.PLAYER_TOKEN
    const $room      = this.get_room()
    const $container = $("#fridge")

    const chan = socket.chan("rooms:" + $room,
      { client_id: $client_id }
    )

    chan.join()
      .receive("ignore", () => console.log("auth error"))
      .receive("ok", () => console.log("join ok"))
      .after(10000, () => console.log("Connection interruption"))
    chan.onError(e => console.log("something went wrong", e))
    chan.onClose(e => console.log("channel closed", e))

    let onDrag = function(id,x,y) {
      chan.push("set:position", {
        user: $client_id,
        body: { id: id, x: x, y: y }
      })
    }

    let onDragStop = function(id,x,y) {
      chan.push("save:snapshot", {})
    }

    // ensure the username input works as expcted
    $username
      .keydown(function( event ) {
        if ( event.which == 13 ) {
         event.preventDefault()
         $username.blur()
         $.cookie("username", $username.val())
        }
      })

    $container
      .on('click', function(e) {
        $username.blur()
        $.cookie("username", $username.val())
      })

    // create the root of the scene graph
    const stage = new PIXI.Container(0x97c56e, true)
    const renderer = new PixiLayer($container, chan, stage)

    // add a shiny background...
    let background = PIXI.Sprite.fromImage('/images/servis.jpg')
    background.scale.set(0.7)
    background.anchor.set(0.5)
    background.position.x = window.innerWidth/2
    background.position.y = 350 + window.innerHeight/2
    stage.addChild(background)

    const lettersManager = new LettersManager(stage, window.LETTERS, onDrag, onDragStop)

    chan.on("join", msg => {
      // console.log("join", msg)
      lettersManager.setInitialPositions(msg.positions)
      // $("#content").keydown(function (event){
      //   //console.log("You pressed the key: ", String.fromCharCode(event.keyCode))
      // })
      $("#letters-container").show()
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

    chan.on("mousemove", msg => {
      if (msg.client_id != $client_id){
        // console.log(msg)
        let element = this.find_or_create_cursor(msg.client_id, msg.username)
        element
          .css('top', msg.y - 105)
          .css('left', msg.x - 10)
          .clearQueue()
          .stop(true,false)
          // .hide()
          //.fadeIn(10)
          .fadeTo('fast', 1 )
          .css('display', 'block')
          .delay(1000)
          .fadeOut(400)
      }
    })

    chan.on("user_count:update", msg => {
      $("#user_count").text(msg.user_count)
    })

    chan.on("update:position", msg => {
      if (msg.user != $client_id){
        lettersManager.moveLetter(msg.body.id, msg.body)
      }
    })

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

  static find_or_create_cursor(id, username) {
    let element = $("#" + id)
    if (!element.length)
      element =
        $("<div id=\"" + id +"\" class=\"mouse\"><p class=\"name\"></p></div>")
        .appendTo("#content")
    element.find( ".name" ).text(username)
    return element
  }

}

class PixiLayer {
  constructor(container, chan, stage){
    this.chan = chan
    let renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {backgroundColor : 0xffffff}, false, true)
    renderer.view.style.width = window.innerWidth + "px"
  	renderer.view.style.height = window.innerHeight + "px"
  	renderer.view.style.display = "block"
    renderer.view.id = "letters-container"
    container.append(renderer.view)
    this.animate(this.animate, renderer, stage)
  }

  animate(animate, renderer, stage) {
    renderer.render(stage)
    requestAnimationFrame(function(){
      animate(animate, renderer, stage)
    })
  }
}

class LettersManager {
  constructor(stage, config, onDrag, onDragStop) {
    this.stage = stage
    this.createLetters(config, stage, onDrag, onDragStop)
  }

  setInitialPositions(positions) {
    // initialise the letter positions
    for (var letter in positions){
      this.moveLetter(letter, positions[letter])
    }
  }

  createLetters(config, stage, onDrag, onDragStop) {
    var letter_map = {}
    for (var i in config)
    {
      let [id, colour] = config[i]
      letter_map[id] = new Letter(stage, id, 30, 30, onDrag, onDragStop, colour)
    }
    this.letter_map = letter_map
  }

  moveLetter(id, position) {
    try {
      let letter = this.letter_map[id]
      letter.position(position.x,position.y)
    } catch (e) {
      console.log(e)
    }
  }
}

class Letter {
  constructor(stage, id, x, y, onDrag, onDragStop, colour) {
    let [code, _] = id.split("_")
    let container = new PIXI.Container()
    let text = new PIXI.Text(String.fromCharCode(code), { font: '22px rounds_blackregular', fill: colour, align: 'left' })
    container.addChild(text)
    container.interactive = true
    container.buttonMode = true
    text.anchor.set(0.5)
    let de = this.onDragEnd.bind(this)
    let ds = this.onDragStart.bind(this)
    let dm = this.onDragMove.bind(this)
    container
      // events for drag start
      .on('mousedown', ds)
      .on('touchstart', ds)
      // events for drag end
      .on('mouseup', de)
      .on('mouseupoutside', de)
      .on('touchend', de)
      .on('touchendoutside', de)
      // events for drag move
      .on('mousemove', dm)
      .on('touchmove', dm)
    container.position.x = x
    container.position.y = y
    stage.addChild(container)
    this.id = id
    this.letter = container
    this.broadcastDrag = onDrag
    this.broadcastDragStop = onDragStop
  }
  position(x, y) {
    // console.log("set position: ", x, y);
    this.letter.position.x = x
    this.letter.position.y = y
  }
  onDragStart(event) {
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    event.target.data = event.data
    event.target.alpha = 0.5
    event.target.dragging = true
  }
  onDragEnd(event){
    event.target.alpha = 1
    event.target.dragging = false
    // set the interaction data to null
    event.target.data = null
    // TODO: Fix this with a js pub/sub solution
    // Here is a great one http://davidwalsh.name/pubsub-javascript
    this.broadcastDragStop()
  }
  onDragMove(event){
    if (event.target.dragging){
      var newPosition = event.target.data.getLocalPosition(event.target.parent)
      event.target.position.x = newPosition.x
      event.target.position.y = newPosition.y
      this.broadcastDrag(this.id,newPosition.x,newPosition.y)
    }
  }
}

$( () => App.loadFonts() )

export default App
