module Types exposing (..)

import Array exposing (Array)


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
