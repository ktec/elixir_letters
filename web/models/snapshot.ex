defmodule ElixirLetters.Snapshot do
  use ElixirLetters.Web, :model

  schema "snapshots" do
    field :positions, :map

    timestamps
  end

  @required_fields ~w(positions)
  @optional_fields ~w()

  @doc """
  Creates a changeset based on the `model` and `params`.

  If no params are provided, an invalid changeset is returned
  with no validation performed.
  """
  def changeset(model, params \\ :empty) do
    model
    |> cast(params, @required_fields, @optional_fields)
  end

  def last(query) do
    from p in query,
    order_by: [desc: p.id],
    limit: 1
  end
  
end
