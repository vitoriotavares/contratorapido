// MongoDB Schema for Audit Trail (LGPD Compliance)
// Tracks all data processing activities for compliance

const auditSchema = {
  // Event identification
  audit_id: String,        // Unique identifier
  event_type: String,      // "data_collection", "data_processing", "data_access", "data_deletion"
  action: String,          // "create", "read", "update", "delete", "export", "anonymize"
  
  // Subject information
  subject: {
    type: String,          // "user", "system", "admin", "ai"
    id: String,            // User ID or system identifier
    phone_number: String,  // For user actions
    ip_address: String,
    user_agent: String,
    session_id: String
  },
  
  // Data subject (person whose data is being processed)
  data_subject: {
    phone_number: String,
    conversation_id: String,
    consent_status: String, // "given", "withdrawn", "pending"
    legal_basis: String     // "consent", "legitimate_interest", "contract"
  },
  
  // What data was affected
  data_affected: {
    categories: [String],   // "personal_identity", "contact_info", "financial", "location"
    fields: [String],       // Specific field names
    record_count: Number,
    sensitive_data: Boolean, // Contains CPF, financial info, etc.
    retention_period: Number // Days
  },
  
  // Processing details
  processing: {
    purpose: String,        // "contract_generation", "customer_support", "analytics"
    legal_basis: String,    // Article 7 of LGPD
    automated: Boolean,     // Was processing automated?
    ai_involved: Boolean,   // Was AI used in processing?
    third_party_sharing: Boolean,
    cross_border_transfer: Boolean,
    encryption_used: Boolean,
    pseudonymization: Boolean
  },
  
  // Request details (for user requests)
  request: {
    type: String,          // "access", "correction", "deletion", "portability", "objection"
    status: String,        // "received", "processing", "completed", "rejected"
    response_due: Date,    // Legal deadline (15-30 days)
    response_sent: Date,
    rejection_reason: String
  },
  
  // System context
  system: {
    component: String,     // "whatsapp_handler", "ai_extractor", "pdf_generator"
    version: String,
    environment: String,   // "production", "staging", "development"
    server_id: String,
    process_id: String
  },
  
  // Before/after values (for updates)
  changes: {
    before: Object,        // Previous values (hashed if sensitive)
    after: Object,         // New values (hashed if sensitive)
    diff_summary: String   // Human readable summary
  },
  
  // Compliance metadata
  compliance: {
    controller: String,    // Data controller (company name)
    processor: String,     // Data processor (if different)
    dpo_notified: Boolean, // Data Protection Officer notified
    authority_reporting_required: Boolean,
    breach_related: Boolean,
    incident_id: String
  },
  
  // Timestamps
  timestamp: Date,         // When event occurred
  created_at: Date,        // When audit record was created
  processed_at: Date,      // When event was processed
  
  // Additional metadata
  metadata: {
    correlation_id: String, // Link related events
    parent_event_id: String,
    tags: [String],
    severity: String,       // "low", "medium", "high", "critical"
    automated_flag: Boolean,
    human_review_required: Boolean
  },
  
  // Indexes for performance and compliance queries
  indexes: [
    { audit_id: 1 },       // Unique
    { "data_subject.phone_number": 1 },
    { "data_subject.conversation_id": 1 },
    { event_type: 1, timestamp: -1 },
    { "processing.purpose": 1 },
    { "request.type": 1, "request.status": 1 },
    { "compliance.breach_related": 1 },
    { timestamp: -1 },
    { created_at: 1 }      // For retention management
  ]
};

// Audit validation schema
const auditValidation = {
  $jsonSchema: {
    bsonType: "object",
    required: ["audit_id", "event_type", "action", "subject", "timestamp"],
    properties: {
      audit_id: {
        bsonType: "string",
        pattern: "^AUD-[0-9]{14}-[A-Z0-9]{6}$",
        description: "Format: AUD-YYYYMMDDHHMMSS-RANDOM"
      },
      event_type: {
        bsonType: "string",
        enum: ["data_collection", "data_processing", "data_access", "data_sharing",
               "data_deletion", "data_export", "consent_change", "system_access",
               "user_request", "breach_detected", "automated_processing"]
      },
      action: {
        bsonType: "string",
        enum: ["create", "read", "update", "delete", "export", "anonymize", 
               "backup", "restore", "share", "process", "analyze"]
      },
      subject: {
        bsonType: "object",
        required: ["type", "id"],
        properties: {
          type: {
            bsonType: "string",
            enum: ["user", "system", "admin", "ai", "third_party", "automated"]
          }
        }
      },
      processing: {
        bsonType: "object",
        properties: {
          purpose: {
            bsonType: "string",
            enum: ["contract_generation", "customer_support", "service_improvement",
                   "legal_compliance", "security", "analytics", "marketing"]
          },
          legal_basis: {
            bsonType: "string",
            enum: ["consent", "contract", "legal_obligation", "vital_interests",
                   "public_task", "legitimate_interests"]
          }
        }
      }
    }
  }
};

// Data retention schema (LGPD compliance)
const dataRetentionSchema = {
  // Data category
  category: String,        // "personal_data", "audit_logs", "contracts", "conversations"
  
  // Retention rules
  retention: {
    period_days: Number,   // How long to keep
    legal_basis: String,   // Why we keep it
    deletion_method: String, // "delete", "anonymize", "pseudonymize"
    automated: Boolean,    // Automatic deletion enabled
    review_required: Boolean // Manual review before deletion
  },
  
  // Processing rules
  processing: {
    allowed_purposes: [String],
    restricted_after_days: Number, // Limited processing after X days
    anonymize_after_days: Number,  // Convert to anonymous after X days
    export_allowed: Boolean,
    sharing_allowed: Boolean
  },
  
  // Compliance tracking
  compliance: {
    created_at: Date,
    created_by: String,
    approved_by_dpo: Boolean,
    last_reviewed: Date,
    next_review: Date
  }
};

module.exports = {
  auditSchema,
  auditValidation,
  dataRetentionSchema,
  collectionName: "audit_trail"
};