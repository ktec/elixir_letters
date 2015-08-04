defmodule ElixirLetters.PositionServer do
  use GenServer
  require Logger

  def start_link do
    GenServer.start_link(__MODULE__, %{}, name: __MODULE__)
  end

  def update_position(user_id, letter_id, coordinates) do
    GenServer.call(
      __MODULE__,
      {:update_position, user_id, letter_id, coordinates}
    )
  end

  def get_positions() do
    GenServer.call(__MODULE__, :get_positions)
  end

  def handle_call({:update_position, user_id, letter_id, coordinates}, _caller, positions) do
    positions = Map.put(positions, letter_id, coordinates)
    Logger.debug"> handle_call #{inspect user_id}"
    Logger.debug"> handle_call #{inspect letter_id}"
    Logger.debug"> handle_call #{inspect coordinates}"
    {:reply, :ok, positions}
  end

  def handle_call(:get_positions, _caller, positions) do
    {:reply, positions, positions}
  end

end
