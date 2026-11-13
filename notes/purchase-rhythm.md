# Learn purchase rhythm

**Status:** built on 2026-11-13 (deck wait only), not device-tested.

## What it does

Each food keeps its last 8 purchase dates. Once a food has 3 purchases, the wait before it returns to the daily deck is half its usual gap between purchases (the median gap), with a floor of 2 days. Below 3 purchases, the fixed 7 days (10 for big packs) still applies.

Example: milk bought every 6 days comes back after 3 days; rice bought every 2 months comes back after about a month.

Two purchases less than 12 hours apart count as one.

## Where

- Rule values: `rhythm` in `kilist-api/src/api/catalog/rules.ts`.
- API: `waitDaysFor` in `src/api/foods/helpers.ts`; dates stored in `foods.boughtDates`.
- Phone: `waitDaysFor` in `src/offline/domain.ts`.
- Guest signup uploads the dates, and the API also reads them from the uploaded shop runs.

## Not done

- Scores and shopping suggestions do not use the rhythm.
- Foods bought before this shipped start with no purchase dates; a backfill from each shop run's `buyLog` is possible.
- Half the gap and 3 purchases are starting guesses, to tune after real use.
