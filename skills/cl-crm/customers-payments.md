# Owner relationships and separate platform reads

## My customers

```python
page = crm("crm.ownerCustomers.list", source="offer_order", limit=25)
detail = crm("crm.ownerCustomers.get", id=page["items"][0]["id"])
```

These two read-only commands always use the signed-in owner's business. Scope
defaults to `owner`; platform scope and caller-supplied actor/owner IDs are
rejected. They do not require manual source imports. Sources are `offer_order`,
`native_offer_order`, `offer_subscription`, `offer_lead`, `calling_contact`, and
`crm_contact`. Native orders intentionally omit absent buyer snapshots rather
than loading an unrelated global account profile.
Distinct source relationships remain separate; matching email/phone never merges
people or authorizes an account lookup. Pass the returned exact `id` to get;
never guess a platform user ID.

List filters: `search`, `source`, source-native `status`, owned `offerName`,
`planId`, `campaignId`, and inclusive ISO `from`/`to`. Sort is `created` (newest),
`createdAsc`, `name`, `nameDesc`, `status`, or `statusDesc`. Pagination limit is
1–100, default 50. Use `nextCursor` unchanged with identical filters, limit and
sort; reset it after changes. Filtering and sorting apply to the entire owner
set, not just the current page. Plan filters exclude contacts without that plan.

The list returns filtered `total` and `summary.relationships`, both covering all
matching pages; filter options cover the owner's full authorized relationship set.
Amounts are decimal strings in minor units, with explicit currency and
`currencyExponent`; never sum unlike currencies. `paidVerified` describes stored
historical payment evidence, not current access. Contact/lead status never proves
payment. Detail includes only that source's owner-authorized offer financial
records, buyer-provided contact fields, calling associations or CRM notes/tasks.
It never includes global profiles, private chats, other creators' purchases,
refund controls or account mutations. Source/storage errors are errors, not an
empty successful list.

## Platform customer and payment reads

The following two commands require explicit `scope:"platform"` and a current platform ADMIN
session, exactly like the CRM admin readers. Owner scope and DEALS_ADMIN alone
are insufficient. Neither command mutates anything or accepts acknowledgement.

## Customers

```python
crm("crm.customers.get", scope="platform", by="email", value="synthetic@example.test")
```

`by` is `userId`, `email`, or `phone`; `value` is a nonempty string (max 254).
Email is normalized to lowercase; phone matches the stored phone exactly.
An identifier is a lookup, not proof of ownership or a request to link accounts.
Ambiguous matches return at most 10 accounts and `truncated:true`; prefer an
explicit user ID. No CRM email/phone collision is treated as an account link.

Accounts use the existing customer drawer read model: TradingLead access,
at most 20 subscriptions and 20 checkout orders per account, and up to 20
payment references per subscription. Access includes unexpired ACTIVE
subscriptions (including lifetime) or PAUSED subscriptions within payment
grace, independently of the bounded display history. Other products are not
covered by this access summary. Payment section failures remain visible.
`linkedContacts` includes at most 50 explicitly platform-user-linked CRM contacts
per account, not guessed contact matches. It does not change support account links.

## Payments

```python
crm("crm.payments.list", scope="platform", customerUserId="synthetic-user",
    status="paid", limit=25)
```

Optional filters: `customerUserId` (max 191), provider `status` (max 40),
inclusive ISO timestamp `from` and `to`. `limit` defaults to 50 (1–100);
`cursor` is optional/null. Use the returned opaque `nextCursor` unchanged
with identical filters, scope and limit. Restart pagination after filter changes.

Rows are Razorpay checkout transactions only: amount/refund amount in major
units, explicit currency per row, status, order/payment IDs and product/offer.
No cross-currency total is produced. This excludes OfferSubscription recurring
cycles and Deals escrow/creator payouts. A CRM WON/CUSTOMER status, active
subscription, pending order or manual grant is not proof of captured money.

Never charge, refund, call, message, grant consent, or change account/access
state through these commands. Minimize returned PII in your response; opening
an account is not permission to publish its profile.
