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

    function onDrag(id,x,y) {
      chan.push("set:position", {
        user: $client_id,
        body: { id: id, x: x, y: y }
      })
    }

    function onDragStop(id,x,y) {
      chan.push("save:snapshot", {})
    }

    let letters_map = this.setupPixi(chan, onDrag, onDragStop)
    function move_letter(id, position){
      let element = letters_map[id]
      if (element) {
        element.position.x = position.x
        element.position.y = position.y
      }
    }

    chan.on("join", msg=>{
      console.log("join", msg)

      // $("#content").keydown(function (event){
      //   //console.log("You pressed the key: ", String.fromCharCode(event.keyCode))
      // })

      // initialise the letter positions
      for (var letter in msg.positions){
        move_letter(letter, msg.positions[letter])
      }

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
          .css('top', msg.y - 74)
          .css('left', msg.x - 12)
          .stop(true,false)
          .css('opacity', 1)
          // .delay(4000)
          // .fadeOut("slow")
      }
    })

    chan.on("user_count:update", msg => {
      $("#user_count").text(msg.user_count)
    })

    chan.on("update:position", msg => {
      if (msg.user != $client_id){
        move_letter(msg.body.id, msg.body)
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

  static setupPixi(chan, onDrag, onDragStop) {

    const renderer = PIXI.autoDetectRenderer(window.innerWidth, window.innerHeight, {backgroundColor : 0x97c56e}, false, true)
    renderer.view.id = "letters-container"
    $("#content").append(renderer.view)

    // create the root of the scene graph
    let stage = new PIXI.Container(0x97c56e, true)

    // add a shiny background...
    // let background = PIXI.Sprite.fromImage('/images/lec.jpg')
    // background.scale.set(0.7)
    // stage.addChild(background)

    let letters = get_letters()
    let letters_map = {}
    for (var i in letters)
    {
      let id = letters[i]['code'] + '_' +  letters[i]['count']
      let char = letters[i]['letter']
      letters_map[id] = createLetter(id, char, 30, 30) //Math.random() * window.innerWidth, Math.random() * window.innerHeight)
    }

    function createLetter(id, char, x, y)
    {
      let letter = new PIXI.Text(char, { font: '122px alphafridgemagnets_regular', fill: '#cc00ff', align: 'center', stroke: '#FFFFFF', strokeThickness: 12 })
      letter.interactive = true
      letter.buttonMode = true
      letter.anchor.set(0.5)
      letter.id = id
      //letter.scale.set(3)
      letter
          // events for drag start
          .on('mousedown', onDragStart)
          .on('touchstart', onDragStart)
          // events for drag end
          .on('mouseup', onDragEnd)
          .on('mouseupoutside', onDragEnd)
          .on('touchend', onDragEnd)
          .on('touchendoutside', onDragEnd)
          // events for drag move
          .on('mousemove', onDragMove)
          .on('touchmove', onDragMove)
      letter.position.x = x
      letter.position.y = y
      stage.addChild(letter)
      return letter
    }

    function onDragStart(event)
    {
        // store a reference to the data
        // the reason for this is because of multitouch
        // we want to track the movement of this particular touch
        this.data = event.data
        this.alpha = 0.5
        this.dragging = true
    }

    function onDragEnd()
    {
        this.alpha = 1
        this.dragging = false
        // set the interaction data to null
        this.data = null
        onDragStop()
    }

    function onDragMove()
    {
        if (this.dragging)
        {
            var newPosition = this.data.getLocalPosition(this.parent)
            this.position.x = newPosition.x
            this.position.y = newPosition.y

            onDrag(this.id,newPosition.x,newPosition.y)
        }
    }

    requestAnimationFrame(animate)
    function animate() {
      for (var i in letters_map)
      {
        letters_map[i].rotation += Math.random() * (0.1 - 0.001) + 0
      }
      renderer.render(stage)

      requestAnimationFrame(animate)
    }

    return letters_map

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

$( () => App.loadFonts() )

export default App
