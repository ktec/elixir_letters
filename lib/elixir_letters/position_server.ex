defmodule ElixirLetters.PositionServer do
  use GenServer
  require Logger

  def start_link do
    GenServer.start_link(__MODULE__, %{positions: %{},users: %{},user_count: 0}, name: __MODULE__)
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

  def add_user(user_id, user) do
    GenServer.call(__MODULE__,{:add_user, user_id, user})
  end

  def remove_user(user_id) do
    GenServer.call(__MODULE__,{:remove_user, user_id})
  end

  def get_user_count() do
    GenServer.call(__MODULE__, :get_user_count)
  end

  def handle_call({:update_position, user_id, position}, _caller, state) do
    %{"id" => letter_id, "left" => left, "top" => top} = position
    state = Map.merge(state,
      %{
        positions: Map.put(state.positions, letter_id, position)
      })
    {:reply, :ok, state}
  end

  def handle_call(:get_positions, _caller, state) do
    {:reply, state.positions, state}
  end

  def handle_call({:add_user, user_id, user}, _caller, state) do
    state = Map.merge(state,
      %{
        users: Map.put(state.users, user_id, user),
      })
    {:reply, :ok, state}
  end

  def handle_call({:remove_user, user_id}, _caller, state) do
    state = Map.merge(state,
      %{
        users: Map.delete(state.users, user_id),
      })
    {:reply, :ok, state}
  end

  def handle_call(:get_user_count, _caller, state) do
    {:reply, Map.size(state.users), state}
  end

end
