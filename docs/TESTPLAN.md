# Student Account System Test Plan

This test plan validates the current COBOL application business logic and implementation behavior so it can be used as a baseline during migration to Node.js.

| Test Case ID | Test Case Description | Pre-conditions | Test Steps | Expected Result | Actual Result | Status (Pass/Fail) | Comments |
| --- | --- | --- | --- | --- | --- | --- | --- |
| TC-001 | Launch app and display main menu | `accountsystem` is compiled and executable | 1. Run `./accountsystem` | Main menu is displayed with options 1-4 and prompt `Enter your choice (1-4):` | TBD | TBD | Verifies startup behavior and user prompt. |
| TC-002 | Exit application from main menu | App is running at main menu | 1. Enter `4` | Program exits loop and displays `Exiting the program. Goodbye!` | TBD | TBD | Validates exit path from `MainProgram`. |
| TC-003 | Reject invalid menu option outside 1-4 | App is running at main menu | 1. Enter `9` (or another out-of-range value) | Message `Invalid choice, please select 1-4.` is displayed; menu is shown again | TBD | TBD | Covers `WHEN OTHER` branch in menu `EVALUATE`. |
| TC-004 | View initial balance before any transactions | Fresh app run, no prior credit/debit in this process | 1. Enter `1` to view balance | Current balance is displayed as initial value (`1000.00` format may appear zero-padded) | TBD | TBD | Confirms default in-memory starting balance. |
| TC-005 | Credit account with valid amount | Fresh app run or known current balance | 1. Enter `2` 2. Enter amount `100.00` | App reads existing balance, adds amount, writes updated balance, and displays `Amount credited. New balance: ...` | TBD | TBD | Verifies credit business rule and write-back behavior. |
| TC-006 | Verify balance reflects prior credit in same run | Execute TC-005 in same process | 1. Enter `1` | Displayed balance equals previous balance + credited amount | TBD | TBD | Validates persistence within app runtime (in-memory state). |
| TC-007 | Debit account with sufficient funds | Known balance greater than or equal to debit amount | 1. Enter `3` 2. Enter amount `50.00` | App reads balance, subtracts amount, writes updated balance, and displays `Amount debited. New balance: ...` | TBD | TBD | Verifies successful debit branch. |
| TC-008 | Verify balance reflects prior debit in same run | Execute TC-007 in same process | 1. Enter `1` | Displayed balance equals prior balance - debited amount | TBD | TBD | Confirms debit write-back to in-memory storage. |
| TC-009 | Reject debit when funds are insufficient | Known balance less than debit amount | 1. Enter `3` 2. Enter amount larger than current balance (for example `999999.99` when balance is lower) | Message `Insufficient funds for this debit.` is displayed; stored balance remains unchanged | TBD | TBD | Verifies overdraft prevention rule. |
| TC-010 | Confirm balance unchanged after failed debit | Execute TC-009 in same process | 1. Enter `1` | Displayed balance is identical to pre-debit balance | TBD | TBD | Ensures failed debit does not write changes. |
| TC-011 | Sequential transaction flow in one session | Fresh app run | 1. Enter `1` (capture starting balance) 2. Enter `2`, credit `200.00` 3. Enter `3`, debit `75.00` 4. Enter `1` | Final balance = starting balance + 200.00 - 75.00 | TBD | TBD | End-to-end business flow validation for migration baseline. |
| TC-012 | Verify runtime-only persistence (no cross-run persistence) | App compiled; ability to run app twice | 1. Run app and credit amount (for example `100.00`) 2. Exit app with `4` 3. Start app again 4. Enter `1` | Balance resets to initial `1000.00` in new process | TBD | TBD | Confirms current implementation stores balance only in memory. |
| TC-013 | Credit zero amount | Known balance in current session | 1. Enter `2` 2. Enter `0.00` 3. Enter `1` | Operation succeeds; balance remains unchanged | TBD | TBD | Documents current behavior for zero-value transactions. |
| TC-014 | Debit zero amount | Known balance in current session | 1. Enter `3` 2. Enter `0.00` 3. Enter `1` | Operation succeeds; balance remains unchanged | TBD | TBD | Documents current behavior for zero-value transactions. |
| TC-015 | Decimal precision handling for two decimal places | Known balance in current session | 1. Enter `2` 2. Enter `10.25` 3. Enter `1` | Updated balance reflects two-decimal arithmetic with COBOL numeric formatting | TBD | TBD | Useful for Node.js parity checks with money calculations. |
| TC-016 | Non-numeric amount input handling (observational) | App is running and waiting for amount in credit or debit flow | 1. Enter `2` 2. At amount prompt, enter non-numeric text (for example `ABC`) | Behavior is captured and documented (acceptance/error depends on runtime/compiler behavior) | TBD | TBD | Current code has no explicit non-numeric validation; stakeholder sign-off needed for target behavior in Node.js. |
| TC-017 | Negative amount input handling (observational) | App is running and waiting for amount in credit or debit flow | 1. Enter `2` and provide negative value (if accepted by runtime) 2. Repeat with `3` | Behavior is captured and documented (no explicit negative-value guard in current logic) | TBD | TBD | Required to clarify future business rule intent during migration. |
| TC-018 | Menu loop continuity after non-exit operations | App is running at main menu | 1. Execute `1` or `2` or `3` 2. Observe next screen | After each non-exit operation, menu is shown again and app remains active | TBD | TBD | Confirms loop control via `CONTINUE-FLAG`. |

## Notes For Node.js Test Implementation

- Use these cases as acceptance-level scenarios first, then split into unit and integration tests.
- Prioritize parity for: balance math, insufficient-funds rule, session-only persistence, and user-facing messages.
- For `Actual Result` and `Status (Pass/Fail)`, fill during stakeholder/UAT execution.
