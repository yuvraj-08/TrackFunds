# Shared Ledger Mobile App -- Product Design Notes

## 1. Purpose

Build a personal finance tracking system that: - Tracks multiple bank
accounts - Supports shared ownership of money in an account - Helps
track when one participant spends another participant's money -
Calculates how much one participant owes another automatically

Primary initial users: - Yuvraj - Yuvraj's sister

Goal: Build for personal use first, but with architecture suitable for a
real product later.

---

# 2. Core Problem

One savings account contains money belonging to two people.

Example: - Sister deposits savings (₹10,000) - Yuvraj adds monthly
savings (₹500--₹1000) - Sometimes Yuvraj spends from the account
including sister's money - Later he must return it

Problem: It becomes difficult to remember: - how much was spent - whose
money was used - how much needs to be returned

The app solves this by maintaining a transaction ledger with ownership
tracking.

---

# 3. Platform Decisions

## Mobile First

- Primary interface: Mobile App
- Technology: React Native
- Reason: Developer already knows React ecosystem

## Backend

- Separate backend API
- Mobile communicates through API
- Makes web support easy later

## Architecture

Monorepo structure:

apps/ - mobile (React Native app) - api (backend)

packages/ - database - shared types - utilities

---

# 4. Core Data Model Concepts

### Users

Individuals who can log into the system.

Example: - Yuvraj - Sister

### Accounts

Represents a real bank account.

Example: - Shop account - Salary account - Shared savings account

Users can create **multiple accounts**.

### Participants

Users linked to an account.

Example:

Shared Savings - Yuvraj - Sister

A participant may have permissions.

### Transactions

All financial actions are stored as transactions.

No balance is stored directly. Balances are **calculated from
transaction history**.

---

# 5. Ownership Model

The bank account has one real balance, but the system tracks ownership
internally.

Example:

Real Bank Balance: ₹15,000

Ownership: - Yuvraj → ₹5,000 - Sister → ₹10,000

Rule:

Sum of ownership shares = total account balance

---

# 6. Transaction Fields

Each transaction stores:

- Account
- Amount
- Type (Deposit / Withdrawal)
- Owner (whose money)
- Spent By (who executed transaction)
- Note
- Source (Manual / SMS)
- Timestamp

Example:

Withdrawal ₹2000 Owner: Sister Spent by: Yuvraj

System calculates: Yuvraj owes sister ₹2000.

---

# 7. Debt Calculation

Debt is NOT stored directly.

It is derived:

Money spent by Yuvraj from sister's funds minus Money returned to sister

Result: Amount owed.

---

# 8. Transaction Input

### Manual Entry

User opens app and records transaction manually.

Fields:

Amount Account Owner Spent by Note

Default Owner: Logged-in user.

User can change owner if spending someone else's money.

---

# 9. SMS Transaction Detection (Android)

App reads bank SMS to detect UPI transactions.

Flow:

1.  Bank SMS arrives
2.  App reads SMS
3.  Parser extracts amount and merchant
4.  Confirmation screen shown

Example:

₹500 UPI payment detected

Account: Shared Savings Owner: Yuvraj Spent by: Yuvraj

\[Save\] \[Ignore\]

Transactions are recorded **only after confirmation**.

Reason: Prevent errors from SMS parsing.

Note: SMS reading only works on Android (iOS restricts access).

Manual entry remains fallback.

---

# 10. Accounts System

Users can create multiple accounts.

Example:

Accounts: - Shop Account - Salary Account - Shared Savings

Participants can be added to any account.

---

# 11. Participant Permissions

Permissions are configurable when adding a participant.

Example:

Sister permissions:

✓ View transactions ✗ Add transactions ✗ Edit transactions ✗ Delete
transactions

Manager permissions (Yuvraj):

✓ View ✓ Add ✓ Edit ✓ Delete ✓ Manage participants

Permissions can be customized per participant.

---

# 12. Notifications

Notifications will NOT be included in Version 1.

Reason: User preference to keep transactions private initially.

Participants can still view transaction history inside the app.

Notifications may be added later as optional feature.

---

# 13. Categories

Categories will NOT exist in Version 1.

Reason: Note field provides enough flexibility initially.

If usage patterns show need, categories can be added later without
breaking structure.

---

# 14. Security Considerations

Authentication system with individual user accounts.

Security basics:

- HTTPS communication
- Hashed passwords (bcrypt / argon2)
- API authorization checks

Example rule:

User must be participant of an account to access it.

Sensitive text fields (like notes) may be encrypted later if desired.

Amounts remain numeric for calculations.

---

# 15. UX Design Decisions

When adding a transaction:

Owner field always shown.

Default value: Logged-in user.

User must confirm if spending another participant's funds.

This keeps ownership explicit.

---

# 16. Version 1 Feature Scope

Accounts Participants Transactions Ownership tracking Debt calculation
Manual entry SMS detection (Android) Participant permissions Transaction
notes

Excluded from V1:

Notifications Categories Analytics Charts

---

# 17. Product Philosophy

Build for real daily use first.

Process:

Build → Use daily → Improve → Consider launch later.

Primary goal: Solve the real financial tracking problem.

If useful to others later, it can evolve into a full product.
