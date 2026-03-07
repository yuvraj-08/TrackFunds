# Product Requirements Document (PRD)

## Project: Shared Savings Ledger

## 1. Product Overview

Shared Savings Ledger is a mobile-first application designed to track
shared bank account savings and spending between trusted participants
(initially between siblings).

The primary goal is to help users track: - deposits - withdrawals -
ownership of money within the same account

The app ensures that when one person spends money from a shared savings
pool, the system tracks whose money was used and how much needs to be
returned.

Initial target users: personal/family use.

---

## 2. Problem Statement

Many people manage shared savings informally: - sibling savings - family
savings pools - joint accounts - parents holding children's savings

Problems: - Hard to track who owns how much - Easy to accidentally spend
someone else's money - No transparent history - Manual tracking via
notes or memory

---

## 3. Goals

Primary goals:

1.  Track deposits and withdrawals from a shared bank account.
2.  Maintain per-person ownership balance within the account.
3.  Provide transaction transparency to participants.
4.  Allow the account manager to operate the account while others can
    view activity.

Secondary goals:

- Support automatic expense detection via SMS (UPI / bank alerts).
- Enable multi-account support.
- Allow multiple participants per account.

---

## 4. Non‑Goals (V1)

The following will NOT be included in version 1:

- Payment gateway integration
- Push notifications
- Expense categories
- AI analytics
- Bank integrations via API

---

## 5. User Roles

### Account Owner

- Creates the account
- Adds participants
- Records transactions
- Manages settings

### Participant

- Can view account balance
- Can view transactions
- Cannot modify records unless granted permission

---

## 6. Key Features

### 6.1 Multi‑Account Support

Users can create multiple savings accounts.

Example: - Sister Savings - Emergency Fund - Travel Fund

Each account has: - participants - balance ledger - transaction history

---

### 6.2 Participant Ownership Tracking

Each participant has a balance representing their contribution.

Example:

Account Balance: ₹12,000

Breakdown: - Yuvraj → ₹7,000 - Sister → ₹5,000

If money is spent, the system tracks whose money was used.

---

### 6.3 Transaction Types

Supported transactions:

1.  Deposit
2.  Withdrawal
3.  Transfer (future)

Each transaction records: - amount - participant responsible - notes -
timestamp

---

### 6.4 Expense Ownership Selection

Whenever a withdrawal occurs, the app asks:

"Whose money is being used?"

Options: - default to logged-in user - select another participant

---

### 6.5 SMS Transaction Detection (Android)

The mobile app can optionally read bank/UPI SMS messages to detect
transactions.

Detected messages can suggest: - transaction amount - merchant or
recipient - timestamp

User confirms before saving.

iOS users will manually add transactions.

---

### 6.6 Notes Instead of Categories

Instead of expense categories, users can add notes.

Example: "Paid electricity bill" "Transferred to sister" "Emergency
withdrawal"

Categories may be introduced later if needed.

---

### 6.7 Permissions

Participants can have configurable permissions:

Options: - View only - Add transactions - Full access (future)

Default: View only.

---

## 7. Security Considerations

Although initially for personal use, security principles will be
followed.

Measures:

- Authentication required
- Encrypted sensitive fields
- API authorization checks
- Secure backend access

Optional idea: Balances stored in encrypted form to protect financial
data in case of database leaks.

---

## 8. Technology Stack

### Mobile App

React Native

### Backend

Node.js / NestJS API

### Database

PostgreSQL

### Architecture

Monorepo structure

Example:

/apps /mobile /api /packages /shared-types

---

## 9. Future Features

Potential roadmap:

- Notifications
- Expense categories
- Monthly reports
- Budget limits
- Debt tracking system
- Bank API integration
- Web dashboard

---

## 10. Success Criteria

For personal usage success:

- Users track all deposits and withdrawals.
- Ownership balances remain accurate.
- No confusion about who owes whom.

For public product potential:

- Easy onboarding
- Transparent tracking
- Reliable ledger accuracy
