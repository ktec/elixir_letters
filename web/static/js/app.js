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
        $("<div id=\"" + id +"\" class=\"mouse\"></div>")
        .appendTo("#content")
    element.text(username)
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

}

$( () => App.init() )

export default App
