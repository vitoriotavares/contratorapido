// MongoDB Schema Definitions for ContratoRápido
// Used by CR-005: WhatsApp Message Handler Workflow

// Rate Limits Collection Schema
const rateLimitsSchema = {
  collection: 'rate_limits',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['phoneNumber', 'messageCount', 'windowStart', 'lastMessage'],
      properties: {
        phoneNumber: {
          bsonType: 'string',
          description: 'WhatsApp phone number (wa_id format)'
        },
        messageCount: {
          bsonType: 'int',
          minimum: 0,
          description: 'Number of messages in current window'
        },
        windowStart: {
          bsonType: 'date',
          description: 'Start timestamp of current rate limit window'
        },
        lastMessage: {
          bsonType: 'date',
          description: 'Timestamp of last message received'
        },
        isBlocked: {
          bsonType: 'bool',
          description: 'Whether user is currently blocked'
        },
        blockedUntil: {
          bsonType: ['date', 'null'],
          description: 'Timestamp when block expires'
        }
      }
    }
  },
  indexes: [
    { phoneNumber: 1 }, // Primary lookup index
    { windowStart: 1 }, // Cleanup old windows
    { blockedUntil: 1 }, // Check expired blocks
    { lastMessage: -1 } // Activity monitoring
  ]
};

// Conversations Collection Schema
const conversationsSchema = {
  collection: 'conversations',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['userId', 'phoneNumber', 'status', 'currentStep', 'createdAt', 'updatedAt'],
      properties: {
        userId: {
          bsonType: 'string',
          description: 'User identifier (same as phoneNumber for WhatsApp)'
        },
        phoneNumber: {
          bsonType: 'string',
          description: 'WhatsApp phone number (wa_id format)'
        },
        contactName: {
          bsonType: 'string',
          description: 'Contact display name from WhatsApp'
        },
        status: {
          bsonType: 'string',
          enum: ['active', 'completed', 'cancelled', 'paused'],
          description: 'Current conversation status'
        },
        currentStep: {
          bsonType: 'string',
          enum: [
            'welcome',
            'contract_type_selection',
            'collecting_personal_data',
            'collecting_address',
            'collecting_rental_details',
            'awaiting_confirmation',
            'generating_contract',
            'delivery'
          ],
          description: 'Current step in conversation flow'
        },
        contractType: {
          bsonType: 'string',
          enum: ['rental', 'sale', 'commercial'],
          description: 'Type of contract being generated'
        },
        createdAt: {
          bsonType: 'date',
          description: 'Conversation creation timestamp'
        },
        updatedAt: {
          bsonType: 'date',
          description: 'Last update timestamp'
        },
        lastMessageAt: {
          bsonType: 'date',
          description: 'Timestamp of last message in conversation'
        },
        cancelledAt: {
          bsonType: ['date', 'null'],
          description: 'Cancellation timestamp if applicable'
        },
        completedAt: {
          bsonType: ['date', 'null'],
          description: 'Completion timestamp if applicable'
        },
        context: {
          bsonType: 'object',
          description: 'Conversation context data (collected information)',
          properties: {
            // Landlord (Locador) information
            landlord: {
              bsonType: 'object',
              properties: {
                name: { bsonType: 'string' },
                cpf: { bsonType: 'string' },
                rg: { bsonType: 'string' },
                phone: { bsonType: 'string' },
                email: { bsonType: 'string' },
                address: {
                  bsonType: 'object',
                  properties: {
                    street: { bsonType: 'string' },
                    number: { bsonType: 'string' },
                    complement: { bsonType: 'string' },
                    neighborhood: { bsonType: 'string' },
                    city: { bsonType: 'string' },
                    state: { bsonType: 'string' },
                    zipCode: { bsonType: 'string' }
                  }
                }
              }
            },
            // Tenant (Locatário) information
            tenant: {
              bsonType: 'object',
              properties: {
                name: { bsonType: 'string' },
                cpf: { bsonType: 'string' },
                rg: { bsonType: 'string' },
                phone: { bsonType: 'string' },
                email: { bsonType: 'string' },
                address: {
                  bsonType: 'object',
                  properties: {
                    street: { bsonType: 'string' },
                    number: { bsonType: 'string' },
                    complement: { bsonType: 'string' },
                    neighborhood: { bsonType: 'string' },
                    city: { bsonType: 'string' },
                    state: { bsonType: 'string' },
                    zipCode: { bsonType: 'string' }
                  }
                }
              }
            },
            // Property information
            property: {
              bsonType: 'object',
              properties: {
                address: {
                  bsonType: 'object',
                  properties: {
                    street: { bsonType: 'string' },
                    number: { bsonType: 'string' },
                    complement: { bsonType: 'string' },
                    neighborhood: { bsonType: 'string' },
                    city: { bsonType: 'string' },
                    state: { bsonType: 'string' },
                    zipCode: { bsonType: 'string' }
                  }
                },
                type: { bsonType: 'string' }, // apartment, house, commercial
                description: { bsonType: 'string' },
                furnished: { bsonType: 'bool' },
                bedrooms: { bsonType: 'int' },
                bathrooms: { bsonType: 'int' }
              }
            },
            // Contract terms
            contract: {
              bsonType: 'object',
              properties: {
                rentAmount: { bsonType: 'decimal' },
                depositAmount: { bsonType: 'decimal' },
                startDate: { bsonType: 'date' },
                duration: { bsonType: 'int' }, // months
                dueDay: { bsonType: 'int' }, // day of month
                guaranteeType: { bsonType: 'string' }, // guarantor, insurance, deposit
                specialClauses: { 
                  bsonType: 'array',
                  items: { bsonType: 'string' }
                }
              }
            }
          }
        },
        messages: {
          bsonType: 'array',
          description: 'Message history for this conversation',
          items: {
            bsonType: 'object',
            properties: {
              messageId: { bsonType: 'string' },
              direction: { bsonType: 'string', enum: ['inbound', 'outbound'] },
              content: { bsonType: 'string' },
              timestamp: { bsonType: 'date' },
              intent: { bsonType: 'string' },
              confidence: { bsonType: 'double' }
            }
          }
        }
      }
    }
  },
  indexes: [
    { phoneNumber: 1 }, // Primary lookup
    { userId: 1 }, // User lookup
    { status: 1 }, // Status filtering
    { currentStep: 1 }, // Step filtering
    { createdAt: -1 }, // Recent conversations
    { updatedAt: -1 }, // Last activity
    { lastMessageAt: -1 }, // Message activity
    { 'context.contract.startDate': 1 }, // Contract date queries
    { contractType: 1, status: 1 } // Contract type analytics
  ]
};

// Message Log Collection Schema (Audit Trail)
const messageLogSchema = {
  collection: 'message_log',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['messageId', 'phoneNumber', 'direction', 'messageText', 'timestamp', 'processedAt'],
      properties: {
        messageId: {
          bsonType: 'string',
          description: 'WhatsApp message ID'
        },
        phoneNumber: {
          bsonType: 'string',
          description: 'WhatsApp phone number'
        },
        direction: {
          bsonType: 'string',
          enum: ['inbound', 'outbound'],
          description: 'Message direction'
        },
        messageText: {
          bsonType: 'string',
          description: 'Message content'
        },
        messageType: {
          bsonType: 'string',
          enum: ['text', 'button', 'interactive', 'media', 'document'],
          description: 'WhatsApp message type'
        },
        intent: {
          bsonType: 'string',
          enum: [
            'novo_contrato', 'continuacao', 'ajuda', 'cancelar',
            'dados_pessoais', 'endereco', 'unknown'
          ],
          description: 'Classified message intent'
        },
        confidence: {
          bsonType: 'double',
          minimum: 0,
          maximum: 1,
          description: 'Intent classification confidence'
        },
        route: {
          bsonType: 'string',
          enum: [
            'new_conversation', 'continue_conversation',
            'help_handler', 'cancel_conversation'
          ],
          description: 'Routing decision made'
        },
        timestamp: {
          bsonType: 'date',
          description: 'Original message timestamp from WhatsApp'
        },
        processedAt: {
          bsonType: 'date',
          description: 'When message was processed by our system'
        },
        businessPhoneNumberId: {
          bsonType: 'string',
          description: 'WhatsApp Business phone number ID'
        },
        conversationId: {
          bsonType: ['string', 'null'],
          description: 'Associated conversation ID'
        },
        errorDetails: {
          bsonType: ['object', 'null'],
          description: 'Error information if processing failed'
        }
      }
    }
  },
  indexes: [
    { messageId: 1 }, // Unique message lookup
    { phoneNumber: 1, timestamp: -1 }, // User message history
    { processedAt: -1 }, // Recent processing activity
    { intent: 1, confidence: -1 }, // Intent analysis
    { route: 1 }, // Routing analytics
    { businessPhoneNumberId: 1 }, // Business number filtering
    { conversationId: 1 }, // Conversation message lookup
    { timestamp: -1 }, // Chronological order
    { direction: 1, messageType: 1 } // Message type analytics
  ]
};

// Templates Collection Schema (for CR-004 integration)
const templatesSchema = {
  collection: 'templates',
  validator: {
    $jsonSchema: {
      bsonType: 'object',
      required: ['templateId', 'name', 'type', 'version', 'content', 'isActive'],
      properties: {
        templateId: {
          bsonType: 'string',
          description: 'Unique template identifier'
        },
        name: {
          bsonType: 'string',
          description: 'Template display name'
        },
        type: {
          bsonType: 'string',
          enum: ['rental', 'sale', 'commercial'],
          description: 'Contract type'
        },
        version: {
          bsonType: 'string',
          description: 'Template version (semantic versioning)'
        },
        content: {
          bsonType: 'string',
          description: 'HTML template content with placeholders'
        },
        metadata: {
          bsonType: 'object',
          properties: {
            jurisdiction: { bsonType: 'string' }, // Brazil, specific states
            effectiveDate: { bsonType: 'date' },
            expirationDate: { bsonType: ['date', 'null'] },
            legalReview: {
              bsonType: 'object',
              properties: {
                reviewedBy: { bsonType: 'string' },
                reviewDate: { bsonType: 'date' },
                approved: { bsonType: 'bool' }
              }
            }
          }
        },
        placeholders: {
          bsonType: 'array',
          description: 'Available template placeholders',
          items: {
            bsonType: 'object',
            properties: {
              key: { bsonType: 'string' },
              description: { bsonType: 'string' },
              required: { bsonType: 'bool' },
              dataType: { bsonType: 'string' }
            }
          }
        },
        isActive: {
          bsonType: 'bool',
          description: 'Whether template is currently active'
        },
        createdAt: {
          bsonType: 'date'
        },
        updatedAt: {
          bsonType: 'date'
        }
      }
    }
  },
  indexes: [
    { templateId: 1 },
    { type: 1, isActive: 1 },
    { version: -1 },
    { 'metadata.jurisdiction': 1 },
    { 'metadata.effectiveDate': 1, 'metadata.expirationDate': 1 },
    { createdAt: -1 }
  ]
};

// Export schemas for database initialization
module.exports = {
  rateLimitsSchema,
  conversationsSchema,
  messageLogSchema,
  templatesSchema
};

// MongoDB Database Initialization Script
const initializeDatabase = async (db) => {
  try {
    // Create collections with validators
    const collections = [
      rateLimitsSchema,
      conversationsSchema,
      messageLogSchema,
      templatesSchema
    ];

    for (const schema of collections) {
      // Create collection
      await db.createCollection(schema.collection, {
        validator: schema.validator
      });

      // Create indexes
      if (schema.indexes) {
        for (const index of schema.indexes) {
          await db.collection(schema.collection).createIndex(index);
        }
      }
      
      console.log(`✅ Created collection: ${schema.collection}`);
    }

    console.log('🎉 Database initialization complete!');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

// TTL (Time To Live) configuration for cleanup
const configureTTL = async (db) => {
  try {
    // Rate limits - clean up after 24 hours of inactivity
    await db.collection('rate_limits').createIndex(
      { lastMessage: 1 },
      { expireAfterSeconds: 24 * 60 * 60 }
    );

    // Message log - keep for 90 days for audit
    await db.collection('message_log').createIndex(
      { processedAt: 1 },
      { expireAfterSeconds: 90 * 24 * 60 * 60 }
    );

    console.log('✅ TTL indexes configured for automatic cleanup');
  } catch (error) {
    console.error('❌ TTL configuration failed:', error);
    throw error;
  }
};

module.exports.initializeDatabase = initializeDatabase;
module.exports.configureTTL = configureTTL;