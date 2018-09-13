module Body exposing (..)

import Array exposing (Array)
import Dict exposing (Dict)
import List.Extra

import Svg.Styled exposing (..)
import Svg.Styled.Attributes exposing (..)

import Muscles 
import Types exposing (..) -- TODO: remove namespace pollution

-- model

type alias Context =
  { selections : Selections 
  }

-- view

lineStyle =
  [ stroke "#000000"
  , fill "#FFFFFF"
  , strokeWidth "1.5px"
  ]
  
colorMap : Array String
colorMap =
  Array.fromList
  <| [ "#FEBD2A", "#F48849", "#DB5C68", "#B83289", "#8B0AA5", "#5302A3" ]

bodyElement = 
  [ Svg.Styled.path (lineStyle ++ [d Muscles.body]) [] ]

colorMuscles : (List String) -> Muscles.MuscleDict -> Selections -> List (Svg msg)
colorMuscles names muscleDict selections =
  List.Extra.zip3 names (Array.toList selections.left) (Array.toList selections.right)
  |> List.map 
    (\(name, levelLeft, levelRight) -> 
      let
        lines =
          Dict.get name muscleDict
          -- TODO: better handling of error state when muscle lines not found
          |> Maybe.withDefault { left = "", right = "" }
      in
        List.Extra.zip [ lines.left, lines.right ] [ levelLeft, levelRight ]
        |> List.map (\(line, level) -> makeMuscleElement line level)
    )
  |> List.concat

makeMuscleElement : String -> Maybe Int -> Svg msg
makeMuscleElement line level =
  let
    color = case level of
      Nothing -> "#FFFFFF"
      Just i -> case (Array.get (i-1) colorMap) of
        Nothing -> "#000000" -- should be unreachable
        Just colorString -> colorString 
  in
    Svg.Styled.path ( lineStyle ++ [ d line ] ++  [ fill color ] ) [ ]


view : Context -> Svg msg
view context =
  let
    muscles = colorMuscles Muscles.names Muscles.muscles context.selections
  in
    svg
      [ width "250", height "700", viewBox "-15 0 300 800", Svg.Styled.Attributes.style "outline: 0.5px solid #0000FF" ]
      ( bodyElement ++ muscles )
