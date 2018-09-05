module Utils exposing (..)

import Http

getFile : String -> (Result Http.Error String -> msg) -> Cmd msg 
getFile url message =
  let
    request = Http.getString url
  in
    Http.send message request
