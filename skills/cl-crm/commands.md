# CRM command reference

Generated from `lib/crm/commandContracts.ts`. The live manifest is authoritative.
Examples are synthetic schema fixtures, not permission, ownership, consent, or approval.

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
        "tradingchat_thread"
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
        "tradingchat_thread"
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
              "tradingchat_thread"
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

Create a scoped opportunity linked to an existing scoped contact.

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

Update a scoped opportunity using optimistic revision control.

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
      "stage": "QUALIFIED"
    }
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
              "tradingchat_thread"
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
