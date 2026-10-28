# Generated command reference

Generated from the executable typed schemas. Do not edit by hand.
Refresh live discovery before use. Refinements (valid dates/ranges and owner checks) are also enforced server-side.

## offer.tracking.get

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "offerId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 191
    }
  },
  "required": [
    "offerId"
  ],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {
    "offerId": "offer_example"
  }
}
```

## offer.tracking.update

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "offerId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 191
    },
    "input": {
      "type": "object",
      "properties": {
        "enabled": {
          "type": "boolean"
        },
        "pixelId": {
          "anyOf": [
            {
              "type": "string",
              "pattern": "^\\d{1,40}$"
            },
            {
              "type": "null"
            }
          ]
        },
        "connectionId": {
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
        "adAccountId": {
          "anyOf": [
            {
              "type": "string",
              "pattern": "^act_\\d{1,40}$"
            },
            {
              "type": "null"
            }
          ]
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
        },
        "events": {
          "type": "object",
          "properties": {
            "landing": {
              "anyOf": [
                {
                  "const": "ViewContent"
                },
                {
                  "type": "null"
                }
              ]
            },
            "landingPageView": {
              "type": "boolean",
              "default": false
            },
            "checkout": {
              "anyOf": [
                {
                  "const": "InitiateCheckout"
                },
                {
                  "type": "null"
                }
              ]
            },
            "addPaymentInfo": {
              "anyOf": [
                {
                  "const": "AddPaymentInfo"
                },
                {
                  "type": "null"
                }
              ],
              "default": null
            },
            "thankyou": {
              "type": "null"
            },
            "thankyouPageView": {
              "type": "boolean",
              "default": false
            },
            "freelead": {
              "anyOf": [
                {
                  "const": "Lead"
                },
                {
                  "type": "null"
                }
              ]
            },
            "purchase": {
              "anyOf": [
                {
                  "const": "Purchase"
                },
                {
                  "type": "null"
                }
              ]
            },
            "custom": {
              "type": "array",
              "items": {
                "type": "object",
                "properties": {
                  "id": {
                    "type": "string",
                    "pattern": "^[A-Za-z0-9_-]{1,100}$"
                  },
                  "label": {
                    "type": "string",
                    "minLength": 1,
                    "maxLength": 80
                  },
                  "eventName": {
                    "type": "string",
                    "pattern": "^[A-Za-z][A-Za-z0-9_]{0,39}$"
                  },
                  "enabled": {
                    "type": "boolean",
                    "default": false
                  },
                  "surface": {
                    "type": "string",
                    "enum": [
                      "offer",
                      "checkout",
                      "thankyou"
                    ]
                  },
                  "trigger": {
                    "anyOf": [
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "const": "action"
                          },
                          "actionName": {
                            "type": "string",
                            "pattern": "^[A-Za-z][A-Za-z0-9_.:-]{0,99}$"
                          },
                          "phase": {
                            "const": "success"
                          }
                        },
                        "required": [
                          "type",
                          "actionName",
                          "phase"
                        ],
                        "additionalProperties": false
                      },
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "const": "click"
                          },
                          "sectionId": {
                            "type": "string",
                            "pattern": "^[A-Za-z0-9_-]{1,100}$"
                          }
                        },
                        "required": [
                          "type",
                          "sectionId"
                        ],
                        "additionalProperties": false
                      },
                      {
                        "type": "object",
                        "properties": {
                          "type": {
                            "const": "section_view"
                          },
                          "sectionId": {
                            "type": "string",
                            "pattern": "^[A-Za-z0-9_-]{1,100}$"
                          }
                        },
                        "required": [
                          "type",
                          "sectionId"
                        ],
                        "additionalProperties": false
                      }
                    ]
                  }
                },
                "required": [
                  "id",
                  "eventName",
                  "surface",
                  "trigger"
                ],
                "additionalProperties": false
              },
              "maxItems": 20
            }
          },
          "required": [
            "landing",
            "checkout",
            "thankyou",
            "freelead",
            "purchase"
          ],
          "additionalProperties": false
        },
        "consentRequired": {
          "const": true
        }
      },
      "required": [
        "enabled",
        "pixelId",
        "events",
        "consentRequired"
      ],
      "additionalProperties": false
    }
  },
  "required": [
    "offerId",
    "input"
  ],
  "additionalProperties": false
}
```

Example body:

```json
{
  "params": {
    "offerId": "offer_example",
    "input": {
      "enabled": false,
      "pixelId": null,
      "consentRequired": true,
      "events": {
        "landing": "ViewContent",
        "landingPageView": false,
        "checkout": "InitiateCheckout",
        "addPaymentInfo": null,
        "thankyou": null,
        "thankyouPageView": false,
        "freelead": "Lead",
        "purchase": "Purchase",
        "custom": [
          {
            "id": "details-view",
            "eventName": "DetailsViewed",
            "enabled": false,
            "surface": "offer",
            "trigger": {
              "type": "section_view",
              "sectionId": "details"
            }
          }
        ]
      }
    }
  }
}
```

## offer.tracking.getLedger

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "offerId": {
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
    "currency": {
      "type": "string",
      "pattern": "^[A-Z]{3}$"
    },
    "productId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 191
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
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
    "offerId": "offer_example",
    "productId": "product_example",
    "currency": "INR",
    "limit": 20
  }
}
```

## offer.tracking.getDeliveryDiagnostics

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "offerId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 191
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100
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
    "offerId": "offer_example",
    "limit": 20
  }
}
```

## offer.tracking.events.list

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "offerIds": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 191
      },
      "minItems": 1,
      "maxItems": 50
    },
    "from": {
      "type": "string",
      "format": "date-time"
    },
    "to": {
      "type": "string",
      "format": "date-time"
    },
    "eventName": {
      "type": "string",
      "pattern": "^[A-Za-z][A-Za-z0-9_]{0,39}$"
    },
    "source": {
      "type": "string",
      "enum": [
        "browser",
        "server"
      ]
    },
    "status": {
      "type": "string",
      "enum": [
        "browser_observed",
        "pixel_dispatch_attempted",
        "failed",
        "verified",
        "pending",
        "processing",
        "blocked",
        "retry",
        "delivered",
        "dead",
        "cancelled"
      ]
    },
    "cursor": {
      "type": "string",
      "minLength": 1,
      "maxLength": 2048
    },
    "limit": {
      "type": "integer",
      "minimum": 1,
      "maximum": 100,
      "default": 50
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
    "offerIds": [
      "offer_example",
      "offer_second"
    ],
    "source": "browser",
    "limit": 20
  }
}
```

## offer.tracking.summaries.get

JSON Schema:

```json
{
  "type": "object",
  "properties": {
    "offerIds": {
      "type": "array",
      "items": {
        "type": "string",
        "minLength": 1,
        "maxLength": 191
      },
      "minItems": 1,
      "maxItems": 50
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
    "offerIds": [
      "offer_example",
      "offer_second"
    ]
  }
}
```
