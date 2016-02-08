defmodule ElixirLetters.PageView do
  use ElixirLetters.Web, :view
  alias ElixirLetters.Letters

  def letters_map do
    Letters.get_letters_map
  end

  def player_token do
    # player_uuid = case get_session(conn, :player_uuid) do
    #               nil ->
    #                 uuid = UUID.uuid4
    #                 conn = put_session(conn, :player_uuid, uuid)
    #                 uuid
    #               existent_uuid -> existent_uuid
    #             end
    # signed = Phoenix.Token.sign(ElixirLetters.Endpoint, "player_token", player_uuid)
    # signed
    UUID.uuid4
  end
end
