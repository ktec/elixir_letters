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
    #:timer.send_interval(5000, :ping)
    send(self, {:after_join, message})

    {:ok, socket}
  end

  def join("rooms:" <> _private_subtopic, _message, _socket) do
    {:error, %{reason: "unauthorized"}}
  end

  def handle_info({:after_join, msg}, socket) do
    Logger.debug "> join #{socket.topic}"
    broadcast! socket, "user:entered", %{user: msg["user"]}
    positions = PositionServer.get_positions
    push socket, "join", %{status: "connected", positions: positions}
    {:noreply, socket}
  end

  def handle_info(:ping, socket) do
    push socket, "new:msg", %{user: "SYSTEM", body: "ping"}
    {:noreply, socket}
  end

  def terminate(reason, _socket) do
    Logger.debug"> leave #{inspect reason}"
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
