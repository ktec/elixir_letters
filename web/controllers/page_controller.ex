defmodule ElixirLetters.PageController do
  use ElixirLetters.Web, :controller

  def index(conn, _params) do
    render(conn, "index.html")
  end
end
