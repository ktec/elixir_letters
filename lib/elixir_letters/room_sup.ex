defmodule ElixirLetters.RoomSupervisor do
  alias ElixirLetters.RoomServer
  require Logger
  use Supervisor

  def start_link do
    Logger.debug "> RoomSupervisor.start_link/0"
    {:ok, pid} = Supervisor.start_link(__MODULE__, [], name: __MODULE__)
  end

  # def start_link(room_name) do
  #   Logger.debug "> RoomSupervisor.start_link/1 #{inspect room_name}"
  #   {:ok, pid} = Supervisor.start_link(__MODULE__, [room_name], name: __MODULE__)
  # end

	def init([]) do
    Logger.debug "> RoomSupervisor.init"
		children = [
      worker(RoomServer, [])
    ]
    supervise(children,strategy: :simple_one_for_one)
	end

  @doc """
  Creates a new child process for the given `room_name`.
  """
  def start_child(room_name) do
    Logger.debug "> start_child #{inspect room_name}"
    #children = Supervisor.which_children(ElixirLetters.RoomSupervisor)
    #Logger.debug "> children #{inspect children}"
    case Supervisor.start_child(__MODULE__, [[],[room: room_name]]) do
      {:ok, pid} -> pid
#      {:error, {:already_started, pid}} -> pid
#      res -> res
    end
  end

  # def start_workers(pid) do
  #   [ "lobby", "scrabble" ]
  #   |> Enum.each(&Supervisor.start_child(pid, [&1]))
  # end

end
