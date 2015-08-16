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

    function guid() {
      function s4() {
        return Math.floor((1 + Math.random()) * 0x10000)
          .toString(16)
          .substring(1);
      }
      return s4() + s4() + '-' + s4() + '-' + s4() + '-' +
        s4() + '-' + s4() + s4() + s4();
    }

    socket.connect()
    const $status    = $("#status")
    const $messages  = $("#messages")
    const $input     = $("#message-input")
    //const $username  = $("#username")
    const $draggable = $(".draggable")

    let $username = guid();

    socket.onClose( e => console.log("CLOSE", e))

    const chan = socket.chan("rooms:lobby", {userid:$username})
    chan.join().receive("ignore", () => console.log("auth error"))
               .receive("ok", () => console.log("join ok"))
               .after(10000, () => console.log("Connection interruption"))
    chan.onError(e => console.log("something went wrong", e))
    chan.onClose(e => console.log("channel closed", e))

    chan.on("join", msg=>{
      for (var letter in msg.positions){
        console.log("position received for ", letter)
        $("#" + letter).css('top', msg.positions[letter].top)
        $("#" + letter).css('left', msg.positions[letter].left)
      }
      $("#letters-container").show();
    })

    chan.on("user_count:update", msg => {
      $("#user_count").text(msg.user_count)
    })

    chan.on("new:position", msg => {
      if (msg.user != $username){
        let letter = $("#" + msg.body.id)
        letter.css('left', msg.body.left)
        letter.css('top', msg.body.top)
      }
    })

    $draggable.on("drag", (e, ui) => {
      chan.push("new:position", {
        user: $username, body: {
          id: e.target.id, left: ui.position.left, top: ui.position.top
        }
      })
      $(e.target).css('color',  '#'+('00000'+(Math.random()*16777216<<0).toString(16)).substr(-6))
    })

    $draggable.on("dragstart", (e, ui) => {
    })

    $draggable.on("dragstop", (e, ui) => {
      chan.push("save_snapshot", {});
    })

    $draggable.draggable()

  }

}

$( () => App.init() )

export default App
