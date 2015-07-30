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
      logger: (kind, msg, data) => { console.log(`${kind}: ${msg}`, data) }
    })
    socket.connect()
    const $status    = $("#status")
    const $messages  = $("#messages")
    const $input     = $("#message-input")
    const $username  = $("#username")
    const $draggable = $("#draggable")

    socket.onClose( e => console.log("CLOSE", e))

    const chan = socket.chan("rooms:lobby", {})
    chan.join().receive("ignore", () => console.log("auth error"))
               .receive("ok", () => console.log("join ok"))
               .after(10000, () => console.log("Connection interruption"))
    chan.onError(e => console.log("something went wrong", e))
    chan.onClose(e => console.log("channel closed", e))

    $input.off("keypress").on("keypress", e => {
      if (e.keyCode == 13) {
        chan.push("new:msg", {user: $username.val(), body: $input.val()})
        $input.val("")
      }
    })

    chan.on("new:msg", msg => {
      $messages.append(this.messageTemplate(msg))
      scrollTo(0, document.body.scrollHeight)
    })

    chan.on("new:position", position => {
      console.log("position received: ", position.body)
      $draggable.css('left', position.body.left)
      $draggable.css('top', position.body.top)
    })

    chan.on("user:entered", msg => {
      const username = this.sanitize(msg.user || "anonymous")
      $messages.append(`<br/><i>[${username} entered]</i>`)
    })

    $draggable.on( "dragstop", (e, ui) => {
      chan.push("new:position", {user: $username.val(), body: { left: ui.position.left, top: ui.position.top }})
    })

    $draggable.draggable()

  }

  static sanitize(html){ return $("<div/>").text(html).html() }

  static messageTemplate(msg){
    let username = this.sanitize(msg.user || "anonymous")
    let body     = this.sanitize(msg.body)

    return(`<p><a href='#'>[${username}]</a>&nbsp; ${body}</p>`)
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

}

$( () => App.init() )

export default App
