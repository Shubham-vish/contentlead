# Platform customer and payment reads

Both commands require explicit `scope:"platform"` and a current platform ADMIN
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
