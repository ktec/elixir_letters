defmodule ElixirLetters.RoomChannel do
  use Phoenix.Channel
  alias ElixirLetters.PositionServer
  require Logger

  @doc """
  Authorize socket to subscribe and broadcast events on this channel & topic
  Possible Return Values
  `{:ok, socket}` to authorize subscription for channel for requested topic
  `:ignore` to deny subscription/broadcast on this channel
  for the requested topic
  """
  def join("rooms:lobby", message, socket) do
    Process.flag(:trap_exit, true)
    send(self, {:after_join, message})
    {:ok, socket}
  end

  def join("rooms:" <> _private_subtopic, _message, _socket) do
    {:error, %{reason: "unauthorized"}}
  end

  def handle_info({:after_join, msg}, socket) do
    Logger.debug "> join #{socket.topic}"
    %{"userid" => user_id} = msg
    socket = assign(socket, :user_id, user_id)
    PositionServer.add_user(user_id,{})
    broadcast! socket, "user_count:update", %{user_count: PositionServer.get_user_count}
    push socket, "join", %{status: "connected", positions: PositionServer.get_positions}
    {:noreply, socket}
  end

  def terminate(reason, socket) do
    Logger.debug "> leave #{inspect reason}"
    PositionServer.remove_user(socket.assigns.user_id)
    broadcast! socket, "user_count:update", %{user_count: PositionServer.get_user_count}
    :ok
  end

  def handle_in("new:msg", msg, socket) do
    broadcast! socket, "new:msg", %{user: msg["user"], body: msg["body"]}
    {:reply, {:ok, %{msg: msg["body"]}}, assign(socket, :user, msg["user"])}
  end

  def handle_in("new:position", payload, socket) do
    %{"id" => letter_id, "left" => left, "top" => top} = payload["body"]
    PositionServer.update_position(
       payload["user"],
       payload["body"]
    )
    broadcast! socket, "new:position", %{user: payload["user"], body: payload["body"]}
    {:reply, {:ok, %{position: payload["body"]}}, assign(socket, :user, payload["user"])}
  end

end
