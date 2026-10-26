# Source preview and explicit apply

CRM source links point to existing systems; they do not replace those systems'
authorization, consent, billing, support, marketplace or calling rules.

## Safe workflow

1. `crm.sources.list` with one exact `kind`; some kinds require `parentId`.
2. Select only needed candidates and minimize displayed PII.
3. `crm.sources.preview {sources, contactId?}`. This writes nothing and grants
   no consent.
4. Show candidates and every rejection/conflict to the user.
5. After explicit approval, call `crm.sources.apply` with the exact same refs,
   `acknowledged:true`, and:
   - existing contact: `contactId` + current `expectedRevision`;
   - new contacts: omit both.
   Platform identity/thread apply also needs a meaningful `reason`.
6. Reload contact detail and report actual outcomes.

Apply re-resolves every source transactionally. Existing imports are idempotent;
a source linked to another target conflicts. Existing contact fields are never
silently overwritten.

`crm.sources.unlink` removes only the CRM edge and requires the contact revision.
It never deletes the source, account, conversation, Calls contact, lead,
subscription, order, support link, entitlement or consent record.

Available v1 kinds are listed in [commands.md](commands.md). Platform user and
support-thread sources are platform-only. Unavailable/deleted/revoked sources
must remain visibly unavailable; a persisted edge is not continuing authority.
