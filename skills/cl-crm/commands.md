# CRM command reference

Generated from `lib/crm/commandContracts.ts`. The live manifest is authoritative.
Examples are synthetic schema fixtures, not permission, ownership, consent, or approval.

## crm.customers.get

Read platform customer accounts, bounded subscriptions, entitlement access and explicitly linked CRM contacts. Platform administrators only; no account or access changes.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "const": "platform"
    },
    "by": {
      "type": "string",
      "enum": [
        "userId",
        "email",
        "phone"
      ]
    },
    "value": {
      "type": "string",
      "maxLength": 254,
      "minLength": 1
    }
  },
  "required": [
    "scope",
    "by",
    "value"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "scope": "platform",
    "by": "email",
    "value": "synthetic@example.test"
  }
}
```
## crm.payments.list

Read cursor-paged Razorpay checkout payments filtered by customer, status and timestamps. Currency stays per row; no charging, refunds or cross-currency totals.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "const": "platform"
    },
    "cursor": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        {
          "type": "null"
        }
      ]
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 50
    },
    "customerUserId": {
      "type": "string",
      "maxLength": 191,
      "minLength": 1
    },
    "status": {
      "type": "string",
      "maxLength": 40,
      "minLength": 1
    },
    "from": {
      "type": "string",
      "format": "date-time"
    },
    "to": {
      "type": "string",
      "format": "date-time"
    }
  },
  "required": [
    "scope"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "scope": "platform",
    "customerUserId": "synthetic-user",
    "status": "paid",
    "limit": 25
  }
}
```
## crm.workspace.get

Get CRM workspace counts, scope permissions, inbox eligibility, and source availability.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {}
}
```
## crm.contacts.list

List scoped CRM contacts with bounded search, filters, and cursor paging.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "cursor": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        {
          "type": "null"
        }
      ]
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 50
    },
    "search": {
      "type": "string",
      "maxLength": 200,
      "default": ""
    },
    "sort": {
      "type": "string",
      "enum": [
        "updated",
        "created",
        "name",
        "updatedAsc",
        "createdAsc",
        "nameDesc"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "LEAD",
        "ACTIVE",
        "CUSTOMER",
        "INACTIVE"
      ]
    },
    "label": {
      "type": "string",
      "maxLength": 48
    },
    "archived": {
      "type": "boolean",
      "default": false
    },
    "sourceKind": {
      "type": "string",
      "enum": [
        "calls_contact",
        "offer_lead",
        "event_registration",
        "storefront_lead",
        "brand_profile",
        "brand_outreach",
        "platform_user",
        "whatsapp_thread",
        "tradingchat_thread",
        "deals_brand",
        "deals_campaign"
      ]
    }
  },
  "required": [],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "search": "Synthetic",
    "limit": 25
  }
}
```
## crm.contacts.detail

Get one scoped contact with links, first-page work, activities, and refreshed source projections.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "id": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000001"
  }
}
```
## crm.tasks.list

List scoped follow-up tasks with contact, status, assignment, due, search, and cursor filters.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "cursor": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        {
          "type": "null"
        }
      ]
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 50
    },
    "search": {
      "type": "string",
      "maxLength": 200,
      "default": ""
    },
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "contactId": {
      "type": "string",
      "format": "uuid"
    },
    "status": {
      "type": "string",
      "enum": [
        "OPEN",
        "DONE",
        "CANCELED"
      ]
    },
    "assignee": {
      "type": "string",
      "enum": [
        "me",
        "unassigned",
        "all"
      ],
      "default": "all"
    },
    "due": {
      "type": "string",
      "enum": [
        "overdue",
        "today",
        "upcoming",
        "all"
      ],
      "default": "all"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000002",
    "limit": 1
  }
}
```
## crm.opportunities.list

List scoped opportunities with contact, stage, archive, search, and cursor filters.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "cursor": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        {
          "type": "null"
        }
      ]
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 50
    },
    "search": {
      "type": "string",
      "maxLength": 200,
      "default": ""
    },
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "contactId": {
      "type": "string",
      "format": "uuid"
    },
    "stage": {
      "type": "string",
      "enum": [
        "PROSPECT",
        "QUALIFIED",
        "PROPOSAL",
        "WON",
        "LOST"
      ]
    },
    "archived": {
      "type": "boolean",
      "default": false
    }
  },
  "required": [],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "id": "00000000-0000-4000-8000-000000000002",
    "archived": false,
    "limit": 1
  }
}
```
## crm.activities.list

List the durable CRM activity timeline for one scoped contact.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "cursor": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        {
          "type": "null"
        }
      ]
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 50
    },
    "contactId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "contactId"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "contactId": "00000000-0000-4000-8000-000000000001",
    "limit": 25
  }
}
```
## crm.sources.list

Browse bounded, authorized source candidates for explicit CRM import or linking.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "cursor": {
      "anyOf": [
        {
          "type": "string",
          "minLength": 1,
          "maxLength": 2048
        },
        {
          "type": "null"
        }
      ]
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 50
    },
    "kind": {
      "type": "string",
      "enum": [
        "calls_contact",
        "offer_lead",
        "event_registration",
        "storefront_lead",
        "brand_profile",
        "brand_outreach",
        "platform_user",
        "whatsapp_thread",
        "tradingchat_thread",
        "deals_brand",
        "deals_campaign"
      ]
    },
    "parentId": {
      "type": "string",
      "maxLength": 191,
      "minLength": 1
    },
    "search": {
      "type": "string",
      "maxLength": 200,
      "default": ""
    }
  },
  "required": [
    "kind"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "kind": "calls_contact",
    "search": "Synthetic"
  }
}
```
## crm.sources.preview

Preview source resolution and conflicts without writing, granting consent, or changing source systems.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "sources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "kind": {
            "type": "string",
            "enum": [
              "calls_contact",
              "offer_lead",
              "event_registration",
              "storefront_lead",
              "brand_profile",
              "brand_outreach",
              "platform_user",
              "whatsapp_thread",
              "tradingchat_thread",
              "deals_brand",
              "deals_campaign"
            ]
          },
          "sourceId": {
            "type": "string",
            "minLength": 1,
            "maxLength": 191
          },
          "parentId": {
            "type": "string",
            "minLength": 1,
            "maxLength": 191
          }
        },
        "required": [
          "kind",
          "sourceId"
        ],
        "additionalProperties": false
      },
      "minItems": 1,
      "maxItems": 50
    },
    "contactId": {
      "type": "string",
      "format": "uuid"
    }
  },
  "required": [
    "sources"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "sources": [
      {
        "kind": "calls_contact",
        "sourceId": "source-contact-1"
      }
    ],
    "contactId": "00000000-0000-4000-8000-000000000001"
  }
}
```
## crm.contacts.create

Create a scoped CRM contact without auto-merging or inferring consent.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "data": {
      "type": "object",
      "properties": {
        "kind": {
          "type": "string",
          "enum": [
            "PERSON",
            "ORGANIZATION"
          ]
        },
        "displayName": {
          "type": "string",
          "maxLength": 191,
          "minLength": 1
        },
        "organizationName": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 191
            },
            {
              "type": "null"
            }
          ]
        },
        "email": {
          "anyOf": [
            {
              "type": "string",
              "format": "email",
              "maxLength": 254
            },
            {
              "type": "null"
            }
          ]
        },
        "phone": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 40
            },
            {
              "type": "null"
            }
          ]
        },
        "status": {
          "type": "string",
          "enum": [
            "LEAD",
            "ACTIVE",
            "CUSTOMER",
            "INACTIVE"
          ]
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 48,
            "minLength": 1
          },
          "maxItems": 20
        }
      },
      "required": [
        "kind",
        "displayName",
        "organizationName",
        "email",
        "phone",
        "status",
        "labels"
      ],
      "additionalProperties": false
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "data",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "data": {
      "kind": "PERSON",
      "displayName": "Synthetic Contact",
      "organizationName": null,
      "email": "synthetic@example.test",
      "phone": null,
      "status": "LEAD",
      "labels": [
        "sample"
      ]
    }
  }
}
```
## crm.contacts.update

Update a scoped CRM contact using optimistic revision control.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "expectedRevision": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "data": {
      "type": "object",
      "properties": {
        "kind": {
          "type": "string",
          "enum": [
            "PERSON",
            "ORGANIZATION"
          ]
        },
        "displayName": {
          "type": "string",
          "maxLength": 191,
          "minLength": 1
        },
        "organizationName": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 191
            },
            {
              "type": "null"
            }
          ]
        },
        "email": {
          "anyOf": [
            {
              "type": "string",
              "format": "email",
              "maxLength": 254
            },
            {
              "type": "null"
            }
          ]
        },
        "phone": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 40
            },
            {
              "type": "null"
            }
          ]
        },
        "status": {
          "type": "string",
          "enum": [
            "LEAD",
            "ACTIVE",
            "CUSTOMER",
            "INACTIVE"
          ]
        },
        "labels": {
          "type": "array",
          "items": {
            "type": "string",
            "maxLength": 48,
            "minLength": 1
          },
          "maxItems": 20
        }
      },
      "required": [],
      "additionalProperties": false
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "id",
    "expectedRevision",
    "data",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "id": "00000000-0000-4000-8000-000000000001",
    "expectedRevision": 1,
    "data": {
      "displayName": "Updated Synthetic Contact"
    }
  }
}
```
## crm.contacts.archive

Archive or restore a scoped CRM contact using optimistic revision control.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "expectedRevision": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "archived": {
      "type": "boolean"
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "id",
    "expectedRevision",
    "archived",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "id": "00000000-0000-4000-8000-000000000001",
    "expectedRevision": 1,
    "archived": true
  }
}
```
## crm.tasks.create

Create a scoped follow-up task assigned only to the caller or left unassigned.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "data": {
      "type": "object",
      "properties": {
        "contactId": {
          "anyOf": [
            {
              "type": "string",
              "format": "uuid"
            },
            {
              "type": "null"
            }
          ]
        },
        "title": {
          "type": "string",
          "maxLength": 191,
          "minLength": 1
        },
        "description": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 4000
            },
            {
              "type": "null"
            }
          ]
        },
        "dueAt": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ]
        },
        "status": {
          "type": "string",
          "enum": [
            "OPEN",
            "DONE",
            "CANCELED"
          ]
        },
        "priority": {
          "type": "string",
          "enum": [
            "LOW",
            "NORMAL",
            "HIGH"
          ]
        },
        "assignee": {
          "type": "string",
          "enum": [
            "me",
            "unassigned"
          ]
        }
      },
      "required": [
        "contactId",
        "title",
        "description",
        "dueAt",
        "status",
        "priority",
        "assignee"
      ],
      "additionalProperties": false
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "data",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "data": {
      "contactId": "00000000-0000-4000-8000-000000000001",
      "title": "Follow up",
      "description": null,
      "dueAt": null,
      "status": "OPEN",
      "priority": "NORMAL",
      "assignee": "me"
    }
  }
}
```
## crm.tasks.update

Update a scoped follow-up task using optimistic revision control.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "expectedRevision": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "data": {
      "type": "object",
      "properties": {
        "contactId": {
          "anyOf": [
            {
              "type": "string",
              "format": "uuid"
            },
            {
              "type": "null"
            }
          ]
        },
        "title": {
          "type": "string",
          "maxLength": 191,
          "minLength": 1
        },
        "description": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 4000
            },
            {
              "type": "null"
            }
          ]
        },
        "dueAt": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ]
        },
        "status": {
          "type": "string",
          "enum": [
            "OPEN",
            "DONE",
            "CANCELED"
          ]
        },
        "priority": {
          "type": "string",
          "enum": [
            "LOW",
            "NORMAL",
            "HIGH"
          ]
        },
        "assignee": {
          "type": "string",
          "enum": [
            "me",
            "unassigned"
          ]
        }
      },
      "required": [],
      "additionalProperties": false
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "id",
    "expectedRevision",
    "data",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "id": "00000000-0000-4000-8000-000000000002",
    "expectedRevision": 1,
    "data": {
      "status": "DONE"
    }
  }
}
```
## crm.opportunities.create

Create a scoped opportunity linked to an existing scoped contact; won/lost stages require a closure reason.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "data": {
      "type": "object",
      "properties": {
        "contactId": {
          "type": "string",
          "format": "uuid"
        },
        "title": {
          "type": "string",
          "maxLength": 191,
          "minLength": 1
        },
        "stage": {
          "type": "string",
          "enum": [
            "PROSPECT",
            "QUALIFIED",
            "PROPOSAL",
            "WON",
            "LOST"
          ]
        },
        "amountMinor": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 0,
              "maximum": 1000000000000
            },
            {
              "type": "null"
            }
          ]
        },
        "currency": {
          "type": "string",
          "pattern": "^[A-Z]{3}$"
        },
        "expectedCloseAt": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ]
        },
        "description": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 4000
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [
        "contactId",
        "title",
        "stage",
        "amountMinor",
        "currency",
        "expectedCloseAt",
        "description"
      ],
      "additionalProperties": false
    },
    "closureReason": {
      "type": "string",
      "maxLength": 500,
      "minLength": 3
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "data",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "data": {
      "contactId": "00000000-0000-4000-8000-000000000001",
      "title": "Synthetic opportunity",
      "stage": "PROSPECT",
      "amountMinor": 10000,
      "currency": "INR",
      "expectedCloseAt": null,
      "description": null
    }
  }
}
```
## crm.opportunities.update

Update a scoped opportunity using optimistic revision control; won/lost moves require a closure reason.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "expectedRevision": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "data": {
      "type": "object",
      "properties": {
        "contactId": {
          "type": "string",
          "format": "uuid"
        },
        "title": {
          "type": "string",
          "maxLength": 191,
          "minLength": 1
        },
        "stage": {
          "type": "string",
          "enum": [
            "PROSPECT",
            "QUALIFIED",
            "PROPOSAL",
            "WON",
            "LOST"
          ]
        },
        "amountMinor": {
          "anyOf": [
            {
              "type": "integer",
              "minimum": 0,
              "maximum": 1000000000000
            },
            {
              "type": "null"
            }
          ]
        },
        "currency": {
          "type": "string",
          "pattern": "^[A-Z]{3}$"
        },
        "expectedCloseAt": {
          "anyOf": [
            {
              "type": "string",
              "format": "date-time"
            },
            {
              "type": "null"
            }
          ]
        },
        "description": {
          "anyOf": [
            {
              "type": "string",
              "maxLength": 4000
            },
            {
              "type": "null"
            }
          ]
        }
      },
      "required": [],
      "additionalProperties": false
    },
    "closureReason": {
      "type": "string",
      "maxLength": 500,
      "minLength": 3
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "id",
    "expectedRevision",
    "data",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "id": "00000000-0000-4000-8000-000000000002",
    "expectedRevision": 1,
    "data": {
      "stage": "WON"
    },
    "closureReason": "Customer signed the annual plan."
  }
}
```
## crm.opportunities.archive

Archive or restore a scoped opportunity using optimistic revision control.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "id": {
      "type": "string",
      "format": "uuid"
    },
    "expectedRevision": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "archived": {
      "type": "boolean"
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "id",
    "expectedRevision",
    "archived",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "id": "00000000-0000-4000-8000-000000000002",
    "expectedRevision": 1,
    "archived": true
  }
}
```
## crm.notes.create

Add a durable private CRM note to one scoped contact.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "contactId": {
      "type": "string",
      "format": "uuid"
    },
    "body": {
      "type": "string",
      "maxLength": 8000,
      "minLength": 1
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "contactId",
    "body",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "contactId": "00000000-0000-4000-8000-000000000001",
    "body": "Synthetic private note."
  }
}
```
## crm.sources.apply

Explicitly import or link previewed sources transactionally after user approval.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "sources": {
      "type": "array",
      "items": {
        "type": "object",
        "properties": {
          "kind": {
            "type": "string",
            "enum": [
              "calls_contact",
              "offer_lead",
              "event_registration",
              "storefront_lead",
              "brand_profile",
              "brand_outreach",
              "platform_user",
              "whatsapp_thread",
              "tradingchat_thread",
              "deals_brand",
              "deals_campaign"
            ]
          },
          "sourceId": {
            "type": "string",
            "minLength": 1,
            "maxLength": 191
          },
          "parentId": {
            "type": "string",
            "minLength": 1,
            "maxLength": 191
          }
        },
        "required": [
          "kind",
          "sourceId"
        ],
        "additionalProperties": false
      },
      "minItems": 1,
      "maxItems": 50
    },
    "contactId": {
      "type": "string",
      "format": "uuid"
    },
    "expectedRevision": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "reason": {
      "type": "string",
      "maxLength": 300,
      "minLength": 3
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "sources",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "sources": [
      {
        "kind": "calls_contact",
        "sourceId": "source-contact-1"
      }
    ],
    "contactId": "00000000-0000-4000-8000-000000000001",
    "expectedRevision": 1
  }
}
```
## crm.sources.unlink

Remove only a CRM source edge using optimistic revision control.

Side effect: **yes**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "scope": {
      "type": "string",
      "enum": [
        "owner",
        "platform"
      ],
      "default": "owner"
    },
    "contactId": {
      "type": "string",
      "format": "uuid"
    },
    "linkId": {
      "type": "string",
      "format": "uuid"
    },
    "expectedRevision": {
      "type": "integer",
      "exclusiveMinimum": 0
    },
    "acknowledged": {
      "const": true
    }
  },
  "required": [
    "contactId",
    "linkId",
    "expectedRevision",
    "acknowledged"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "acknowledged": true,
    "contactId": "00000000-0000-4000-8000-000000000001",
    "linkId": "00000000-0000-4000-8000-000000000002",
    "expectedRevision": 1
  }
}
```
## crm.ownerCustomers.list

List only the signed-in owner's offer buyers, free leads, calling contacts and CRM contacts. Filters and sorting cover all owner relationships; no imports, calls or account access changes.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "search": {
      "type": "string",
      "maxLength": 160
    },
    "source": {
      "type": "string",
      "enum": [
        "offer_order",
        "native_offer_order",
        "offer_subscription",
        "offer_lead",
        "calling_contact",
        "crm_contact"
      ]
    },
    "status": {
      "type": "string",
      "minLength": 1,
      "maxLength": 32
    },
    "offerName": {
      "type": "string",
      "minLength": 1,
      "maxLength": 100
    },
    "planId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 191
    },
    "campaignId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 191
    },
    "from": {
      "type": "string",
      "format": "date-time"
    },
    "to": {
      "type": "string",
      "format": "date-time"
    },
    "sort": {
      "type": "string",
      "enum": [
        "created",
        "createdAsc",
        "name",
        "nameDesc",
        "status",
        "statusDesc"
      ],
      "default": "created"
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 50
    },
    "cursor": {
      "type": "string",
      "maxLength": 2048
    },
    "scope": {
      "const": "owner",
      "default": "owner"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "source": "offer_order",
    "search": "Synthetic",
    "limit": 25
  }
}
```
## crm.ownerCustomers.get

Read one exact owner-bound source relationship, its own offer financial records, calling associations or CRM notes. Never reads platform profiles or another creator's purchases.

Side effect: **no**.

### Params schema

```json
{
  "type": "object",
  "properties": {
    "id": {
      "type": "string",
      "maxLength": 191,
      "pattern": "^(offer_order|native_offer_order|offer_subscription|offer_lead|calling_contact|crm_contact):[A-Za-z0-9_-]{1,150}$"
    },
    "scope": {
      "const": "owner",
      "default": "owner"
    }
  },
  "required": [
    "id"
  ],
  "additionalProperties": false
}
```

### Example request

```json
{
  "params": {
    "id": "offer_order:synthetic-order"
  }
}
```
