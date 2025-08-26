// MongoDB Schema for Legal Contract Templates
// Used for storing versioned legal contract templates with metadata

const templateSchema = {
  // Template identification
  template_id: String, // Unique identifier (e.g., "rental_residential_basic_v1")
  name: String, // Human readable name
  category: String, // "rental", "commercial", "sale", etc.
  type: String, // "residential", "commercial", "mixed"
  
  // Version control
  version: {
    major: Number, // Breaking changes (1.0.0)
    minor: Number, // New features (1.1.0) 
    patch: Number, // Bug fixes (1.1.1)
    full: String   // "1.1.1"
  },
  
  // Legal metadata
  legal_info: {
    applicable_law: String, // "Lei 8.245/91", "Código Civil"
    jurisdiction: String,   // "Brasil", "SP", "RJ"
    effective_date: Date,   // When template becomes valid
    expiry_date: Date,      // When template expires (optional)
    lawyer_reviewed: Boolean,
    lawyer_info: {
      name: String,
      oab: String, // Ordem dos Advogados do Brasil number
      review_date: Date,
      signature: String
    }
  },
  
  // Template content
  content: {
    html: String,      // HTML template with {{variables}}
    css: String,       // Separate CSS for styling
    variables: [{      // Available template variables
      name: String,           // "locador_nome"
      label: String,          // "Nome do Locador"
      type: String,           // "text", "number", "date", "currency"
      required: Boolean,
      validation: String,     // Regex pattern for validation
      placeholder: String,    // Example value
      help_text: String      // User guidance
    }],
    clauses: [{        // Contract clauses
      id: String,            // "rental_payment"
      title: String,         // "CLÁUSULA 3ª - DO ALUGUEL"
      content: String,       // Clause text with variables
      required: Boolean,     // Must be included
      conditional: {         // Show clause only if conditions met
        field: String,       // "imovel_tipo"
        operator: String,    // "equals", "not_equals", "contains"
        value: String        // "apartamento"
      },
      legal_basis: String    // Article reference
    }]
  },
  
  // Usage metadata
  usage: {
    total_generated: Number,  // How many contracts generated
    last_used: Date,
    success_rate: Number,     // % of successful generations
    avg_generation_time: Number, // Milliseconds
    common_errors: [String]
  },
  
  // Compliance
  compliance: {
    lgpd_compliant: Boolean,
    data_retention_days: Number, // How long to keep generated contracts
    personal_data_fields: [String], // Which fields contain personal data
    audit_required: Boolean,
    encryption_required: Boolean
  },
  
  // Timestamps
  created_at: Date,
  updated_at: Date,
  created_by: String, // User ID
  updated_by: String,
  
  // Status
  status: String, // "draft", "review", "active", "deprecated", "archived"
  tags: [String], // ["residential", "basic", "sao_paulo"]
  
  // Indexes for performance
  indexes: [
    { template_id: 1 }, // Unique
    { category: 1, type: 1, status: 1 }, // Common queries
    { "version.full": 1 },
    { "legal_info.effective_date": 1 },
    { created_at: -1 },
    { tags: 1 }
  ]
};

// Template validation schema
const templateValidation = {
  $jsonSchema: {
    bsonType: "object",
    required: ["template_id", "name", "category", "version", "content", "status"],
    properties: {
      template_id: {
        bsonType: "string",
        pattern: "^[a-z_]+_v[0-9]+$",
        description: "Must be lowercase with underscores and version suffix"
      },
      name: {
        bsonType: "string",
        minLength: 5,
        maxLength: 100
      },
      category: {
        bsonType: "string",
        enum: ["rental", "commercial", "sale", "service", "other"]
      },
      status: {
        bsonType: "string", 
        enum: ["draft", "review", "active", "deprecated", "archived"]
      },
      version: {
        bsonType: "object",
        required: ["major", "minor", "patch", "full"],
        properties: {
          major: { bsonType: "int", minimum: 1 },
          minor: { bsonType: "int", minimum: 0 },
          patch: { bsonType: "int", minimum: 0 }
        }
      },
      content: {
        bsonType: "object",
        required: ["html", "variables"],
        properties: {
          html: {
            bsonType: "string",
            minLength: 100,
            description: "HTML template content"
          },
          variables: {
            bsonType: "array",
            minItems: 1,
            items: {
              bsonType: "object",
              required: ["name", "label", "type", "required"],
              properties: {
                name: {
                  bsonType: "string",
                  pattern: "^[a-z_]+$"
                },
                type: {
                  bsonType: "string",
                  enum: ["text", "number", "date", "currency", "email", "phone", "cpf", "cnpj"]
                }
              }
            }
          }
        }
      }
    }
  }
};

module.exports = {
  templateSchema,
  templateValidation,
  collectionName: "templates"
};