module StatefulButton exposing (..)

import Html.Styled exposing (..)
import Html.Styled.Events exposing (..)
import Html.Styled.Attributes exposing (css)
import Css exposing (..)

-- model

type alias Config msg = 
  { text : String
  , clickedMessage : msg
  , style : Style 
  }

type alias Context =
  { selected : Bool
  }

-- view

defaultStyle : Style
defaultStyle =
  batch
    [ height (px 30)
    , width (px 30)
    , border3 (px 2) solid (rgb 0 0 0)
    , focus [outline none]
    ]

view : Config msg -> Context -> Html msg
view config context =
  let
    bgColor = if context.selected
      then (rgb 100 100 100)
      else (rgb 255 255 255)
    textColor = if context.selected
      then (rgb 255 255 255)
      else (rgb 0 0 0)
  in
    button
      [ onClick config.clickedMessage
      , css
        [ defaultStyle 
        , config.style
        , color textColor
        , backgroundColor bgColor 
        ]
      ]
      [ text config.text ]
