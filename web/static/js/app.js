import {Socket} from "phoenix"

class App {

  static loadFonts() {

    // Load them fonts before starting...!
    WebFont.load({
      custom: {
        families: ['alphafridgemagnets_regular']
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
        //console.log(`${kind}: ${msg}`, data)
      }
    })

    socket.connect()
    socket.onClose( e => console.log("CLOSE", e))

    // const $status    = $("#status")
    // const $messages  = $("#messages")
    // const $input     = $("#message-input")
    const $username  = $("#username")
    const $draggable = $(".draggable")
    const $client_id = this.guid()
    const $room      = this.get_room()
    const $container = $("#content")

    const chan = socket.chan("rooms:" + $room,
      { client_id: $client_id }
    )

    chan.join().receive("ignore", () => console.log("auth error"))
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

    const renderer = new PixiLayer($container, chan)
    const letters_config = get_letters()
    const lettersManager = new LettersManager(renderer.stage, letters_config, onDrag, onDragStop)

    chan.on("join", msg=>{
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
        console.log(msg)
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
          .delay(1000).fadeOut(400)
      }
    })

    chan.on("user_count:update", msg => {
      $("#user_count").text(msg.user_count)
    })

    chan.on("update:position", msg => {
      if (msg.user != $client_id){
        lettersManager.move_letter(msg.body.id, msg.body)
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

}

class PixiLayer {
  constructor(container, chan){
    this.chan = chan
    this.renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {backgroundColor : 0xffffff}, false, true)
    this.renderer.view.id = "letters-container"
    container.append(this.renderer.view)

    // create the root of the scene graph
    this.stage = new PIXI.Container(0x97c56e, true)
    // add a shiny background...
    let background = PIXI.Sprite.fromImage('/images/scrabble_board.png')
    background.scale.set(0.7)
    this.stage.addChild(background)
    //
    this.animate(this.animate, this.renderer,this.stage)
  }

  animate(animate, renderer, stage) {
    // for (var i in letters_map) {
    //   letters_map[i].rotation += Math.random() * (0.1 - 0.001) + 0
    // }
    renderer.render(stage)
    requestAnimationFrame(function(){
      animate(animate, renderer, stage)
    })
  }
}

class LettersManager {
  constructor(stage, letters_config, onDrag, onDragStop){
    this.stage = stage
    this.createLetters(letters_config, onDrag, onDragStop)
  }
  setInitialPositions(positions){
    // initialise the letter positions
    for (var letter in positions){
      this.move_letter(letter, positions[letter])
    }
  }
  createLetters(letters, onDrag, onDragStop){
    this.letters_map = {}
    for (var i in letters)
    {
      let id = letters[i]['code'] + '_' +  letters[i]['count']
      let char = letters[i]['letter']
      let letter = new Letter(this.stage, id, char, 30, 30, onDrag, onDragStop)
      this.letters_map[id] = letter
      // createLetter(id, char, 30, 30) //Math.random() * window.innerWidth, Math.random() * window.innerHeight)
    }
    this.letters_map
  }
  move_letter(id, position){
    try {
      let letter = this.letters_map[id]
      letter.position(position.x,position.y)
    } catch (e) {
      console.log(e)
    }
  }
}

class Letter {
  constructor(stage, id, char, x, y, onDrag, onDragStop) {
    //const colours = ["#9C2E23", "#C5A02F", "#002F6B", "#3D6F24",'#cc00ff']
    const colours = ["FFFFFF"]

    function getPoints(char){
      const points = {
        1:"AEIOULNSTR",
        2:"DG",
        3:"BCMP",
        4:"FHVWY",
        5:"K",
        8:"JX",
        10:"QZ"
      }
      for (var i in points) {
        if (points[i].toLowerCase().indexOf(char.toLowerCase()) != -1) {
          return i
        }
      }
      return 1
    }

    this.stage = stage
    let randomColour = colours[Math.floor(Math.random() * colours.length)];
    let container = new PIXI.Container()
    let tile = PIXI.Sprite.fromImage('/images/blank_tile.jpg')
    tile.scale.x = 0.09
    tile.scale.y = 0.09
    let text = new PIXI.Text(char, { font: '26px Arial', fill: randomColour, align: 'center', stroke: '#FFFFFF', strokeThickness: 2 })
    let value = new PIXI.Text(getPoints(char), { font: '12px Arial', fill: randomColour, align: 'center', stroke: '#FFFFFF', strokeThickness: 1 })
    container.addChild(tile)
    container.addChild(value)
    container.addChild(text)
    container.interactive = true
    container.buttonMode = true
    text.anchor.set(0.5)
    tile.anchor.set(0.5)
    value.anchor = new PIXI.Point(-0.9,-0.2)
    container.id = id
    container.class = this
    //container.scale.set(3)
    container
        // events for drag start
        .on('mousedown', this.onDragStart)
        .on('touchstart', this.onDragStart)
        // events for drag end
        .on('mouseup', this.onDragEnd)
        .on('mouseupoutside', this.onDragEnd)
        .on('touchend', this.onDragEnd)
        .on('touchendoutside', this.onDragEnd)
        // events for drag move
        .on('mousemove', this.onDragMove)
        .on('touchmove', this.onDragMove)
    container.position.x = x
    container.position.y = y
    this.letter = container
    this.stage.addChild(container)
    this.broadcastDrag = onDrag
    this.broadcastDragStop = onDragStop
  }
  position(x,y){
    console.log("set position: ", x, y);
    this.letter.position.x = x
    this.letter.position.y = y
  }
  onDragStart(event){
    // store a reference to the data
    // the reason for this is because of multitouch
    // we want to track the movement of this particular touch
    this.data = event.data
    this.alpha = 0.5
    this.dragging = true
  }
  onDragEnd(){
    this.alpha = 1
    this.dragging = false
    // set the interaction data to null
    this.data = null
    // TODO: Fix this with a js pub/sub solution
    // Here is a great one http://davidwalsh.name/pubsub-javascript
    this.class.broadcastDragStop()
  }
  onDragMove(){
    if (this.dragging){
      var newPosition = this.data.getLocalPosition(this.parent)
      this.position.x = newPosition.x
      this.position.y = newPosition.y
      this.class.broadcastDrag(this.id,newPosition.x,newPosition.y)
    }
  }
}

$( () => App.loadFonts() )

export default App
