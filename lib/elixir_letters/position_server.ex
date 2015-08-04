defmodule ElixirLetters.PositionServer do
  use GenServer
  require Logger

  def start_link do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def update_position(user_id, position) do
    GenServer.call(
      __MODULE__,
      {:update_position, user_id, position}
    )
  end

  def get_positions() do
    GenServer.call(__MODULE__, :get_positions)
  end

  def handle_call({:update_position, user_id, position}, _caller, positions) do
    %{"id" => letter_id, "left" => left, "top" => top} = position
    positions = Map.put(positions, letter_id, position)
    {:reply, :ok, positions}
  end

  def handle_call(:get_positions, _caller, positions) do
    {:reply, positions, positions}
  end

end
