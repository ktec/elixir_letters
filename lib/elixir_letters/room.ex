defmodule ElixirLetters.Room do
  use GenServer
  alias ElixirLetters.{Repo,Snapshot,Endpoint}
  import Ecto.Query

  defmodule State do
    defstruct room_name: "lobby",
              positions: %{},
              users: %{},
              user_count: 0
  end

  # Client

  @doc """
  Starts the process
  """
  def start_link(room_name) do
    # opts = opts
    #   |> Keyword.put_new(:room, "lobby")
    #   |> Enum.reject(fn {_k,v} -> is_nil(v) end)
    room = Atom.to_string(room_name)
    state = %State{room_name: room,
                   positions: get_snapshot(room)}
    # GenServer.call(__MODULE__, :initialize_room, room_name)
    GenServer.start_link(__MODULE__, state)
  end

  @doc """
  Add a user to the room.
  """
  def join(pid, user_id, user) do
    GenServer.cast(pid, {:join, user_id, user})
  end

  @doc """
  Remove a user the room.
  """
  def leave(pid, user_id) do
    GenServer.cast(pid, {:leave, user_id})
  end

  @doc """
  Set the position of one character.
  """
  def set_position(pid, position) do
    GenServer.cast(pid, {:set_position, position})
  end

  @doc """
  Save a snapshot of the current state.
  """
  def save(pid) do
    GenServer.cast(pid, :save)
  end

  @doc """
  Get the position of all characters in the room.
  """
  def get_positions(pid) do
    GenServer.call(pid, :get_positions)
  end

  @doc """
  Get a count of the number of users in the room.
  """
  def get_user_count(pid) do
    GenServer.call(pid, :get_user_count)
  end

  # Server (callbacks)

  def handle_call(:get_user_count, _from, state) do
    {:reply, Map.size(state.users), state}
  end

  def handle_call(:get_positions, _from, state) do
    {:reply, state.positions, state}
  end

  def handle_cast({:join, user_id, user}, state = %State{users: users}) do
    new_state = %State{state | users: Map.put(users, user_id, user)}
    # broadcast_user_count(Map.size(new_state.users))
    {:noreply, new_state}
  end

  def handle_cast({:leave, user_id}, state = %State{users: users}) do
    new_state = %State{state | users: Map.delete(users, user_id)}
    {:noreply, new_state}
  end

  def handle_cast({:set_position, %{"id" => id} = position}, state = %State{positions: positions}) do
    new_state = %State{state | positions: Map.put(positions, id, position)}
    {:noreply, new_state}
  end

  def handle_cast(:save, state) do
    changeset = Snapshot.changeset(%Snapshot{},
      %{room_name: state.room_name,
        positions: state.positions
      })

    if changeset.valid? do
      _msg = Repo.insert!(changeset)
    end
    {:noreply, state}
  end

  defp get_snapshot(room) do
    query = from s in Snapshot,
            where: s.room_name == ^room
    last_snapshot = query |> Snapshot.last |> Repo.one

    cond do
      last_snapshot -> last_snapshot.positions
      true -> %{}
    end
  end

  # defp broadcast_user_count(count) do
  #   Endpoint.broadcast!("rooms:*", "user_count:update", %{user_count: get_user_count(room_id)})
  # end
end
