import Browser
import Html exposing (..)

main = Browser.sandbox { init = init, update = update, view = view }

-- model

type alias Model = String 

init : Model
init = "hello world!"

-- update

type Msg = None

update : Msg -> Model -> Model
update msg model =
  case msg of
    None -> model

-- view

view : Model -> Html Msg
view model =
  text model
