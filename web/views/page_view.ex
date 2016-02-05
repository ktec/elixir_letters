defmodule ElixirLetters.PageView do
  use ElixirLetters.Web, :view

  def get_colour do
    @colours
      |> Enum.shuffle
      |> Enum.take(1)
  end
end
