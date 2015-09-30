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

    const chan = socket.chan("rooms:" + $room, { client_id: $client_id })

    chan.join().receive("ignore", () => console.log("auth error"))
               .receive("ok", () => console.log("join ok"))
               .after(10000, () => console.log("Connection interruption"))
    chan.onError(e => console.log("something went wrong", e))
    chan.onClose(e => console.log("channel closed", e))

    chan.on("join", msg=>{

      for (var letter in msg.positions){
        //console.log("position received for ", letter)
        let element = $("#" + this.sanitize_id(letter))
        if (element.length) {
          element
            .css('top', msg.positions[letter].top)
            .css('left', msg.positions[letter].left)
        }
      }

      $("#letters-container").show()

      $("#content").keydown(function (event){
        //console.log("You pressed the key: ", String.fromCharCode(event.keyCode))
      })

      $("#content").mousemove(function(event) {
        chan.push("mousemove", {
          user: $client_id, body: {
            id:  $client_id, x: event.pageX, y: event.pageY
          }
        })
      })

    })

    chan.on("mousemove", msg => {
      if (msg.user != $client_id){
        //console.log msg
        let id = msg.body.id
        let element = $("#" + id)
        if (!element.length)
          element =
            $("<div id=\"" + id +"\" class=\"mouse\"></div>")
            .appendTo("#content")
        element
          .css('top', msg.body.y - 74)
          .css('left', msg.body.x - 12)
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
        let element = $("#" + this.sanitize_id(msg.body.id))
          .css('left', msg.body.left)
          .css('top', msg.body.top)
      }
    })

    $draggable.on("drag", (e, ui) => {
      chan.push("set:position", {
        user: $client_id, body: {
          id: e.target.id, left: ui.position.left, top: ui.position.top
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

}

$( () => App.init() )

export default App
