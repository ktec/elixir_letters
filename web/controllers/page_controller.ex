defmodule ElixirLetters.PageController do
  use ElixirLetters.Web, :controller
  alias ElixirLetters.Letters

  def index(conn, _params) do
    letters = Letters.get_letters
    colours = Letters.get_colours
    render(conn, "index.html", letters: letters, colours: colours)
  end
end
