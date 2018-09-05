import Browser
import Html
import Array exposing (Array)

import Html.Styled exposing (..)
import Html.Styled.Attributes exposing (css)
import Css exposing (..)

import StatefulButton 
import ButtonRow 
import ButtonPanel

main = Browser.element
  { init = init
  , update = update
  , subscriptions = subscriptions
  , view = viewUnstyled
  }

-- model

config = 
  { buttonsPerRow = 5
  , numRows = 3
  }

type alias SideSelections = Array (Maybe Int)

type alias Selections = 
  { left : SideSelections
  , right: SideSelections
  }

setSelection
setSelection row selection selections =
  


--setLeftSelections : SideSelections -> Selections -> Selections
--setLeftSelections left selections =
--  { selections | left = left }
--
--setRightSelections : SideSelection -> Selections -> Selections
--setRightSelections left selections =
--  { selections | left = left }

type alias Model = 
  { selections : Selections 
  }

init : () -> (Model, Cmd Msg)
init _ = 
  ( { selections = 
      { left = Array.repeat config.numRows Nothing
      , right = Array.repeat config.numRows Nothin
      }
    }
  , Cmd.none 
  )

-- update

type Side = Left | Right

type Msg = Select Side Int Int

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  let
    newModel = case msg of
      Select side row selection -> updateWithSelect side row selection model
  in
    (newModel, Cmd.none)

updateWithSelect : Side -> Int -> Int -> Model -> Model
updateWithSelect side row selection model =
  case side of
    Left -> 
      { model
      | model.selections.left = updateSide side row model.selections.left
      }
    Right -> 
      { model
      | model.selections.right = updateSide side row model.selections.right
      }

updateSide Int -> Int -> SideSelections -> SideSelections 
updateSide row newSelection selections =
  case Array.get row selections of
    Nothing -> selections -- should be unreachable
    Just oldSelection ->
      case oldSelection of
        Nothing -> Array.set row (Just newSelection) selections 
        Just nOld -> 
          if newSelection == nOld then
            Array.set row Nothing selections
          else
            Array.set row (Just newSelection) selections

-- subscriptions

subscriptions : Model -> Sub Msg
subscriptions model = Sub.none

-- view

viewUnstyled : Model -> Html.Html Msg
viewUnstyled model = 
  view model |> toUnstyled

view : Model -> Html Msg
view model =
  span []
    [ ButtonPanel.view 
        { buttonsPerRow = config.buttonsPerRow
        , selectionMessage = Select Left
        }
        { selections = model.selections.left }
    , ButtonPanel.view 
        { buttonsPerRow = config.buttonsPerRow
        , selectionMessage = Select Right 
        }
        { selections = model.selections.left }
    ]
