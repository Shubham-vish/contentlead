# Generated command reference

Generated from the executable typed schemas. Do not edit by hand.
Refresh live discovery before use. Refinements (valid dates/ranges and owner checks) are also enforced server-side.

## metaAds.getConnection

JSON Schema:

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {}
}
```

## metaAds.beginOAuth

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "returnPath": {
      "type": "string",
      "maxLength": 500,
      "pattern": "^\\/(?!\\/)",
      "default": "/content/ads/owned"
    }
  },
  "required": [],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {
    "returnPath": "/content/ads/owned"
  }
}
```

## metaAds.listAdAccounts

JSON Schema:

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {}
}
```

## metaAds.listDatasets

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "adAccountId": {
      "type": "string",
      "pattern": "^act_\\d{1,40}$"
    }
  },
  "required": [
    "adAccountId"
  ],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {
    "adAccountId": "act_123456"
  }
}
```

## metaAds.selectAssets

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "adAccountId": {
      "type": "string",
      "pattern": "^act_\\d{1,40}$"
    },
    "datasetId": {
      "anyOf": [
        {
          "type": "string",
          "pattern": "^\\d{1,40}$"
        },
        {
          "type": "null"
        }
      ]
    }
  },
  "required": [
    "adAccountId"
  ],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {
    "adAccountId": "act_123456",
    "datasetId": "123456"
  }
}
```

## metaAds.disconnect

JSON Schema:

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {}
}
```

## metaAds.requestInsightsSync

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "adAccountId": {
      "type": "string",
      "pattern": "^act_\\d{1,40}$"
    },
    "since": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
    },
    "until": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
    },
    "level": {
      "type": "string",
      "enum": [
        "ad",
        "adset",
        "campaign"
      ],
      "default": "ad"
    }
  },
  "required": [
    "adAccountId",
    "since",
    "until"
  ],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {
    "adAccountId": "act_123456",
    "since": "2026-10-01",
    "until": "2026-10-07",
    "level": "ad"
  }
}
```

## metaAds.getInsightsReport

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "adAccountId": {
      "type": "string",
      "pattern": "^act_\\d{1,40}$"
    },
    "since": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
    },
    "until": {
      "type": "string",
      "pattern": "^\\d{4}-\\d{2}-\\d{2}$"
    },
    "level": {
      "type": "string",
      "enum": [
        "ad",
        "adset",
        "campaign"
      ],
      "default": "ad"
    },
    "offerId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 191
    },
    "currency": {
      "type": "string",
      "pattern": "^[A-Z]{3}$"
    }
  },
  "required": [
    "adAccountId",
    "since",
    "until"
  ],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {
    "adAccountId": "act_123456",
    "since": "2026-10-01",
    "until": "2026-10-07",
    "level": "ad",
    "currency": "INR"
  }
}
```

## metaAds.listJobs

JSON Schema:

```json
{
  "type": "object",
  "properties": {},
  "required": [],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {}
}
```

## metaAds.getJob

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "jobId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 191
    }
  },
  "required": [
    "jobId"
  ],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {
    "jobId": "job_example"
  }
}
```
