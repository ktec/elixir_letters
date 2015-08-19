defmodule ElixirLetters.RoomChannel do
  use ElixirLetters.Web, :channel
  #use Phoenix.Channel
  alias ElixirLetters.RoomServer
  require Logger

  @doc """
  Authorize socket to subscribe and broadcast events on this channel & topic
  Possible Return Values
  `{:ok, socket}` to authorize subscription for channel for requested topic
  `:ignore` to deny subscription/broadcast on this channel
  for the requested topic
  """
  def join("rooms:lobby", payload, socket) do
    if authorized?(payload) do
      Process.flag(:trap_exit, true)
      send(self, {:after_join, payload})
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def join("rooms:" <> private_subtopic, payload, socket) do
    Logger.debug "> room #{inspect private_subtopic}"
    if authorized?(payload) do
      Process.flag(:trap_exit, true)
      send(self, {:after_join, payload})
      {:ok, socket}
    else
      {:error, %{reason: "unauthorized"}}
    end
  end

  def terminate(reason, socket) do
    Logger.debug "> leave #{inspect reason}"
    Logger.debug "> leave #{inspect socket}"

    RoomServer.remove_user(socket.assigns[:pid], socket.assigns[:client_id])

    broadcast! socket, "user_count:update", %{user_count: RoomServer.get_user_count(socket.assigns.pid)}
    :ok
  end

  def handle_info({:after_join, msg}, socket) do
    Logger.debug "> after_join #{inspect socket.assigns}"
    %{"client_id" => client_id} = msg
    socket = assign(socket, :client_id, client_id)
    RoomServer.add_user(socket.assigns.pid, client_id, {})
    broadcast! socket, "user_count:update", %{user_count: RoomServer.get_user_count(socket.assigns.pid)}
    response = %{status: "connected", positions: RoomServer.get_positions(socket.assigns.pid)}
    push socket, "join", response
    {:noreply, socket}
  end

  def handle_in("set:position", payload, socket) do
    %{"id" => _letter_id, "left" => _left, "top" => _top} = payload["body"]
    RoomServer.set_position( socket.assigns.pid, payload["body"])
    broadcast! socket, "update:position", payload
    {:noreply, socket}
  end

  def handle_in("mousemove", payload, socket) do
    broadcast! socket, "mousemove", payload
    {:reply, {:ok, payload}, assign(socket, :user, payload["user"])}
  end

  def handle_in("save_snapshot", _payload, socket) do
    _msg = RoomServer.save_snapshot()
    #{:reply, {:ok, msg}, socket}
    {:reply, :ok, socket}
  end

  # Channels can be used in a request/response fashion
  # by sending replies to requests from the client
  def handle_in("ping", payload, socket) do
    {:reply, {:ok, payload}, socket}
  end

  # This is invoked every time a notification is being broadcast
  # to the client. The default implementation is just to push it
  # downstream but one could filter or change the event.
  def handle_out(event, payload, socket) do
    push socket, event, payload
    {:noreply, socket}
  end

  # Add authorization logic here as required.
  defp authorized?(_payload) do
    true
  end

end
