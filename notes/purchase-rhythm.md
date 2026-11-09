# Learn purchase rhythm

**Status:** pinned, not planned yet.

## The idea

Learn how often a household buys each food, such as "they buy milk every 6 days", and use it to make the app feel finely tuned after long use.

## Why

What the app learns is limited today:

- **Scores:** each food keeps only its last 8 answers, and buying wipes them, so scores reflect recent answers rather than long-term habits.
- **Store order:** this improves over time, but only the 99 most recent pairs are kept per food.
- **Purchase rhythm:** nothing uses it yet.

## What it depends on

Purchase dates are already stored in each shop run's `buyLog`, for accounts. Guest mode should keep completed shop runs on the phone and upload them at signup. That way the history exists when this gets built, because it can't be recovered later.

## Open questions

- What should rhythm change: scores, the daily deck, shopping suggestions, or all of them?
- How many purchases are needed before trusting a rhythm?
- How should irregular purchases be handled, such as holidays or one-off buys?
