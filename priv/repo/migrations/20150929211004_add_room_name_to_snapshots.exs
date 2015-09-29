defmodule ElixirLetters.Repo.Migrations.AddRoomNameToSnapshots do
  use Ecto.Migration

  def change do
    alter table(:snapshots) do
      add :room_name, :string
    end
  end
end
