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

type Side = Left | Right

type alias SideSelections = Array (Maybe Int)

type alias Selections = 
  { left : SideSelections 
  , right: SideSelections 
  }

setSideSelections : SideSelections -> Side -> Selections -> Selections
setSideSelections newSideSelections side selections =
  case side of
    Left -> { selections | left = newSideSelections }
    Right -> { selections | right = newSideSelections }

asSideSelectionsIn : Selections -> Side -> SideSelections -> Selections
asSideSelectionsIn selections side newSideSelections =
  setSideSelections newSideSelections side selections

type alias Model = 
  { selections : Selections 
  }

setSelections : Selections -> Model -> Model
setSelections newSelections model =
  { model | selections = newSelections }

asSelectionsIn : Model -> Selections -> Model
asSelectionsIn model newSelections =
  setSelections newSelections model

init : () -> (Model, Cmd Msg)
init _ = 
  ( { selections = 
      { left = Array.repeat config.numRows Nothing
      , right = Array.repeat config.numRows Nothing
      }
    }
  , Cmd.none 
  )

-- update

type Msg = Select Side Int Int

update : Msg -> Model -> (Model, Cmd Msg)
update msg model =
  let
    newModel = case msg of
      Select side row selection -> selectUpdate side row selection model
  in
    (newModel, Cmd.none)

selectUpdate : Side -> Int -> Int -> Model -> Model
selectUpdate side row selection model =
  case side of
    Left -> 
      updateSide row selection model.selections.left
      |> asSideSelectionsIn model.selections Left
      |> asSelectionsIn model
    Right -> 
      updateSide row selection model.selections.right
      |> asSideSelectionsIn model.selections Right 
      |> asSelectionsIn model

updateSide : Int -> Int -> SideSelections -> SideSelections 
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
  span 
    [ css [ displayFlex, flexFlow2 row noWrap ] ]
    [ ButtonPanel.view 
        { buttonsPerRow = config.buttonsPerRow
        , selectionMessage = Select Left
        }
        { selections = model.selections.left }
    , ButtonPanel.view 
        { buttonsPerRow = config.buttonsPerRow
        , selectionMessage = Select Right 
        }
        { selections = model.selections.right }
    ]
