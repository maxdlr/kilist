# Aisle manager

Give an aisle to items that have none, from the shop tab.

## Entry

- Calm only, shop tab before Start (the only screen with aisle sections).
- Small "Manage" / "Gérer" button to the right of the "Other" section title. Shown only when "Other" has items.
- Opens a bottom panel listing every item without an aisle, each row with a chevron-down.

## Row states

| State | Look |
|---|---|
| Closed | Item name, chevron-down. |
| Open, empty search | Search bar only, focused (keyboard opens). Chevron-up. |
| Open, typing | Search bar slides up; horizontal suggestion chips appear under it; round xmark button next to the search bar clears it. |
| Matched | Row shrinks to a smaller height than closed. Item name + discreet coloured checkmark + chosen aisle. Chevron still there to edit. |

## Rules

- Only one row open at a time.
- Search matches aisle names and item names (taxonomy), e.g. "cheese" → Dairy. The placeholder says so.
- Only a tapped suggestion sets an aisle. No custom aisles.
- Chevron-up before a match cancels: clears the search and closes the row back.
- Nothing is saved until "Done" at the bottom of the panel: then save all, close the panel, refresh the shop list.
- Every transition uses `AnimationService.easeOut`.

## Shared component

Turn `NameSuggestions` into a generic `Suggestions` chip row (`{ key, label }[]` + `onPick`). Name suggestions and aisle suggestions both use it.

## Data

`foods.aisle` already exists. Saving is a normal food update through the offline queue and `/sync`.

- After a match, the next unmatched row opens automatically.
- Closing the panel without "Done" (swipe down, back): if nothing was matched, close silently; otherwise confirm with "Save matched" (save those, ignore the rest) or "Discard all".
