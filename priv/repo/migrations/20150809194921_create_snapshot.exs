defmodule ElixirLetters.Repo.Migrations.CreateSnapshot do
  use Ecto.Migration

  def change do
    create table(:snapshots) do
      add :positions, :map

      timestamps
    end

  end
end
