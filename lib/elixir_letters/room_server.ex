defmodule ElixirLetters.RoomServer do
  use GenServer
  alias ElixirLetters.Repo
  alias ElixirLetters.Snapshot
  import Ecto.Query
  require Logger

  defmodule Room do
    defstruct [
      room_name: "lobby",
      positions: %{},
      users: %{},
      user_count: 0
    ]
  end

  # Client

  @doc """
  Starts the process
  """
  def start_link(room_name) do
    # opts = opts
    #   |> Keyword.put_new(:room, "lobby")
    #   |> Enum.reject(fn {_k,v} -> is_nil(v) end)
    room_name = Atom.to_string(room_name)
    state = %Room{room_name: room_name}
    Logger.debug "> RoomServer.start_link/1 #{inspect state}"

    query = from s in Snapshot,
            where: s.room_name == ^room_name
    last_snapshot = query |> Snapshot.last |> Repo.one

    unless is_nil last_snapshot do
      state = %Room{state | positions: last_snapshot.positions}
    end

    # GenServer.call(__MODULE__, :initialize_room, room_name)

    Logger.debug "> STATE: #{inspect state}"
    GenServer.start_link(__MODULE__, state)
  end

  @doc """
  Set the position of one character.
  """
  def set_position(pid, position) do
    GenServer.call(pid,{:set_position, position})
  end

  @doc """
  Get the position of all characters in the room.
  """
  def get_positions(pid) do
    GenServer.call(pid, :get_positions)
  end

  @doc """
  Add a user to the room.
  """
  def add_user(pid, user_id, user) do
    GenServer.call(pid,{:add_user, user_id, user})
  end

  @doc """
  Remove a user the room.
  """
  def remove_user(pid, user_id) do
    GenServer.call(pid,{:remove_user, user_id})
  end

  @doc """
  Get a count of the number of users in the room.
  """
  def get_user_count(pid) do
    GenServer.call(pid, :get_user_count)
  end

  @doc """
  Save a snapshot of the current state of the room.
  """
  def save_snapshot(pid) do
    GenServer.call(pid, :save_snapshot)
  end

  # Server (callbacks)

  def handle_call(
      {:set_position, %{"id" => letter_id} = position},
      _from,state) do
    %Room{positions: positions} = state
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
    changeset = Snapshot.changeset(%Snapshot{},
      %{room_name: state.room_name,
        positions: state.positions
      })

    if changeset.valid? do
      _msg = Repo.insert!(changeset)
      #{:reply, {:ok, msg}, state}
      {:reply, :ok, state}
    else
      {:reply, {:error, %{errors: changeset.errors}}, state}
    end

  end

  # def handle_call({:initialize_room, room_name}, _from, state) do
  #   query = from s in Snapshot,
  #           where: s.room_name == ^room_name
  #   last_snapshot = query |> Snapshot.last |> Repo.one
  #
  #   unless is_nil last_snapshot do
  #     state = %Room{state | positions: last_snapshot.positions}
  #   end
  #
  #   {:reply, :ok, state}
  # end

end
