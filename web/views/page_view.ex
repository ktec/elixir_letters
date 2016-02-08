defmodule ElixirLetters.PageView do
  use ElixirLetters.Web, :view
  alias ElixirLetters.Letters

  def letters_map do
    for {<<code::utf8>>, count} <- letters, letter_count <- 1..count do
      "#{code}_#{letter_count}"
    end
  end

  def letters do
    Letters.get_letters
  end

  def colours do
    Letters.get_colours
  end

  def get_colour do
    colours
      |> Enum.shuffle
      |> Enum.take(1)
  end

  def player_token do
  #   # player_uuid = case get_session(conn, :player_uuid) do
  #   #               nil ->
  #   #                 uuid = UUID.uuid4
  #   #                 conn = put_session(conn, :player_uuid, uuid)
  #   #                 uuid
  #   #               existent_uuid -> existent_uuid
  #   #             end
    player_uuid = UUID.uuid4
    # signed = Phoenix.Token.sign(ElixirLetters.Endpoint, "player_token", player_uuid)
    # signed
  end
end
