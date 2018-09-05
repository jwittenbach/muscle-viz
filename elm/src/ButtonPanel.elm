module ButtonPanel exposing (..)

import Array exposing (Array)

import Html.Styled exposing (..)
import Html.Styled.Events exposing (..)
import Html.Styled.Attributes exposing (css)
import Css exposing (..)

import ButtonRow

-- model

type alias Config msg =
  { buttonsPerRow : Int
  , selectionMessage : Int -> Int -> msg
  }

type alias Context =
  { selections : Array (Maybe Int)
  }

-- view

createRow : Int -> Config msg -> Maybe Int -> Html msg
createRow n config selection =
  let
    rowConfig =
      { numButtons = config.buttonsPerRow
      , selectedMessage = config.selectionMessage n 
      }
    rowContext =
      { selected = selection }
  in
    ButtonRow.view rowConfig rowContext

view : Config msg -> Context -> Html msg
view config context = 
  div []
    ( List.indexedMap
        ( \n selection -> 
            div [css [ marginBottom (px 5) ] ] [ createRow n config selection ]
        )
        (Array.toList context.selections)
    )
