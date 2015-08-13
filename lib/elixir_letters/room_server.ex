defmodule ElixirLetters.RoomServer do
  use GenServer
  alias ElixirLetters.Repo
  alias ElixirLetters.Snapshot
  require Logger

  defmodule Room do
    defstruct [
      positions: %{},
      users: %{},
      user_count: 0
    ]
  end

  def start_link do
    GenServer.start_link(__MODULE__, %Room{}, name: __MODULE__)
  end

  def update_position(user_id, position) do
    GenServer.call(__MODULE__,{:update_position, user_id, position})
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

  def save_snapshot() do
    GenServer.call(__MODULE__, :save_snapshot)
  end

  def handle_call(
      {:update_position, _user_id, %{"id" => letter_id} = position},
      _from,
      %Room{positions: positions} = state) do
    positions = Map.put(positions, letter_id, position)
    {:reply, :ok, %Room{state | positions: positions}}
  end

  def handle_call(:get_positions, _from, state) do
    {:reply, state.positions, state}
  end

  def handle_call({:add_user, user_id, user}, _from, %Room{users: users} = state) do
    users = Map.put(users, user_id, user)
    {:reply, :ok, %Room{state | users: users}}
  end

  def handle_call({:remove_user, user_id}, _from, %Room{users: users} = state) do
    users = Map.delete(users, user_id)
    {:reply, :ok, %Room{state | users: users}}
  end

  def handle_call(:get_user_count, _from, state) do
    {:reply, Map.size(state.users), state}
  end

  def handle_call(:save_snapshot, _from, state) do
    Logger.debug "> positions: #{inspect state.positions}"
    changeset = Snapshot.changeset %Snapshot{}, %{positions: state.positions}

    if changeset.valid? do
      _msg = Repo.insert!(changeset)
      #{:reply, {:ok, msg}, state}
      {:reply, :ok, state}
    else
      {:reply, {:error, %{errors: changeset.errors}}, state}
    end

  end

end
