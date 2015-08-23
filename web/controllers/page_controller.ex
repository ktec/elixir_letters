defmodule ElixirLetters.PageController do
  use ElixirLetters.Web, :controller

  def index(conn, _params) do
    letters = %{ "E" => 125, "T" => 92, "A" => 80, "O" => 76, "I" => 72, "N" => 70, "S" => 65, "R" => 61, "H" => 54, "L" => 41, "D" => 39, "C" => 30, "U" => 27, "M" => 25, "F" => 23, "P" => 20, "G" => 19, "W" => 19, "Y" => 17, "B" => 15, "V" => 9, "K" => 6, "X" => 1, "J" => 1, "Q" => 1, "Z" => 1, "e" => 12, "t" => 9, "a" => 8, "o" => 7, "i" => 7, "n" => 7, "s" => 6, "r" => 6, "h" => 5, "l" => 4, "d" => 3, "c" => 3, "u" => 2, "m" => 2, "f" => 2, "p" => 2, "g" => 2, "w" => 2, "y" => 2, "b" => 1, "v" => 9, "k" => 6, "x" => 1, "j" => 1, "q" => 1, "z" => 1, "!" => 5, "?" => 5 }
    colours = ["#ce1e0c","#466dda","#03c03c","#e6d253"]     # pastels
    colours = ["#9C2E23", "#C5A02F", "#002F6B", "#3D6F24"]
    # colours = ["#ff0000", "#00ff00", "#0000ff"] # primary
    # colours = ["#3F2757", "#897999", "#6E5C80", "#533b6b", "#452D5E", "#B5ACC0"]

    render(conn, "index.html", letters: letters, colours: colours)
  end
end
