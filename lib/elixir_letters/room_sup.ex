defmodule ElixirLetters.RoomSupervisor do
  alias ElixirLetters.RoomServer
  require Logger
  use Supervisor

  def start_link do
    Supervisor.start_link(__MODULE__, [], name: __MODULE__)
  end

  def init([]) do
    children = [
      worker(RoomServer, [], restart: :transient)
    ]
    supervise(children, strategy: :simple_one_for_one)
	end

  @doc """
  Creates a new child process for the given `room_name`, or returns the pid
  for the existing process with that `room_name`.
  """
  def start_room(room_name) do
    case Supervisor.start_child(__MODULE__, [[],[name: room_name]]) do
        {:ok, pid} -> pid
        {:error, {:already_started, pid}} -> pid
  #      res -> res
      end
  end

end
