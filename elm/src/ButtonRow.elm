module ButtonRow exposing (..)

import Html.Styled exposing (..)
import Html.Styled.Events exposing (..)
import Html.Styled.Attributes exposing (css)
import Css exposing (..)

import StatefulButton

-- model

type alias Context =
  { selected : Maybe Int
  }

type alias Config msg = 
  { numButtons : Int
  , selectedMessage : Int -> msg
  }

-- view

buttonStyle : Style
buttonStyle = marginLeft (px -2)

createButton : Int -> Maybe Int -> (Int -> msg) -> Html msg
createButton n selected message =
  let
    buttonConfig = 
      { text = String.fromInt n
      , clickedMessage = message n
      , style = buttonStyle
      }
    buttonContext =
      { selected = 
          case selected of
            Nothing -> False
            Just m -> n == m
      }
  in
    StatefulButton.view buttonConfig buttonContext

view : Config msg -> Context -> Html msg
view config context =
  span []
    ( List.range 1 config.numButtons |> 
      List.map (\n -> createButton n context.selected config.selectedMessage) 
    )
  
