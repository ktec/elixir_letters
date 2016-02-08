defmodule ElixirLetters.RoomChannel do
  use ElixirLetters.Web, :channel
  #use Phoenix.Channel
  alias ElixirLetters.{Room,RoomSupervisor}
  require Logger

  @doc """
  Authorize socket to subscribe and broadcast events on this channel & topic
  Possible Return Values
  `{:ok, socket}` to authorize subscription for channel for requested topic
  `:ignore` to deny subscription/broadcast on this channeli
  for the requested topic
  """
  def join("rooms:" <> topic, payload, socket) do
    if authorized?(payload) do
      topic = String.slice(topic, 0, 100)
      pid = RoomSupervisor.start_room(String.to_atom(topic))

      Process.flag(:trap_exit, true)
      send(self, {:after_join, payload})

      socket = assign(socket, :pid, pid)
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def terminate(reason, socket) do
    Room.leave(socket.assigns[:pid], socket.assigns[:client_id])
    broadcast! socket, "user_count:update", %{user_count: Room.get_user_count(socket.assigns.pid)}
    :ok
  end

  def handle_info({:after_join, %{"client_id" => client_id}}, socket) do
    Logger.debug "> after_join #{inspect socket.assigns}"
    socket = assign(socket, :client_id, client_id)
    room_id = socket.assigns.pid
    Room.join(room_id, client_id, {})
    broadcast! socket, "user_count:update", %{user_count: Room.get_user_count(room_id)}
    push socket, "join", %{status: "connected", positions: Room.get_positions(room_id)}
    {:noreply, socket}
  end

  def handle_in("set:position", payload, socket) do
    #%{"id" => _letter_id, "left" => _left, "top" => _top} = payload["body"]
    Room.set_position(socket.assigns.pid, payload["body"])
    broadcast! socket, "update:position", payload
    {:noreply, socket}
  end

  def handle_in("save:snapshot", _payload, socket) do
    Room.save(socket.assigns.pid)
    {:noreply, socket}
  end

  def handle_in("mousemove", payload, socket) do
    broadcast! socket, "mousemove", payload
    {:noreply, socket}
  end

  # This is invoked every time a notification is being broadcast
  # to the client. The default implementation is just to push it
  # downstream but one could filter or change the event.
  def handle_out(event, payload, socket) do
    push socket, event, payload
    {:noreply, socket}
  end

  @doc """
  Authorization can go here
  """
  defp authorized?(_payload) do
    true
  end

end
