// MongoDB Schema for WhatsApp Conversation Management
// Stores conversation state and message history

const conversationSchema = {
  // Conversation identification
  conversation_id: String, // WhatsApp phone number (e.g., "5511999999999")
  phone_number: String,    // Normalized phone number
  display_name: String,    // User's WhatsApp display name
  
  // Conversation state
  state: {
    current_step: String,    // "welcome", "collecting_data", "generating_contract", "completed"
    sub_step: String,        // More granular state tracking
    progress: Number,        // 0-100 completion percentage
    language: String,        // "pt_BR" (default)
    timezone: String         // "America/Sao_Paulo"
  },
  
  // Contract data being collected
  contract_data: {
    // Locador (Landlord) information
    locador: {
      nome: String,
      documento: String,     // CPF or CNPJ
      documento_tipo: String, // "cpf" or "cnpj"
      endereco: String,
      cidade: String,
      estado: String,
      cep: String,
      telefone: String,
      email: String,
      banco: {               // For rent payments
        nome: String,
        agencia: String,
        conta: String,
        pix: String
      }
    },
    
    // Locatário (Tenant) information
    locatario: {
      nome: String,
      documento: String,     // CPF
      endereco: String,
      cidade: String,
      estado: String,
      cep: String,
      telefone: String,
      email: String,
      profissao: String,
      renda: Number
    },
    
    // Imóvel (Property) information
    imovel: {
      endereco: String,
      tipo: String,          // "casa", "apartamento", "kitnet"
      cidade: String,
      estado: String,
      cep: String,
      area: Number,          // Square meters
      quartos: Number,
      banheiros: Number,
      vagas_garagem: Number,
      mobiliado: Boolean,
      descricao: String
    },
    
    // Contract terms
    contrato: {
      valor_aluguel: Number,
      valor_caucao: Number,  // Security deposit
      dia_vencimento: Number, // 1-31
      duracao_meses: Number,
      data_inicio: Date,
      data_fim: Date,
      reajuste_anual: Boolean,
      incluir_condominio: Boolean,
      incluir_iptu: Boolean,
      pets_permitidos: Boolean,
      fumantes_permitidos: Boolean
    },
    
    // Additional metadata
    template_id: String,     // Which template will be used
    special_clauses: [String], // Additional clauses requested
    observations: String     // Any special notes
  },
  
  // Message history
  messages: [{
    message_id: String,      // WhatsApp message ID
    timestamp: Date,
    direction: String,       // "inbound" or "outbound"
    content: {
      type: String,          // "text", "image", "document", "location"
      text: String,
      media_url: String,
      media_type: String,
      location: {
        latitude: Number,
        longitude: Number,
        address: String
      }
    },
    processed: Boolean,      // Has AI processed this message?
    ai_extracted_data: Object, // Data extracted by AI
    template_used: String,   // Which message template was used for response
    delivery_status: String  // "sent", "delivered", "read", "failed"
  }],
  
  // AI processing metadata
  ai_processing: {
    total_tokens_used: Number,
    gpt4_calls: Number,
    gpt4_mini_calls: Number,
    total_cost_usd: Number,
    extraction_attempts: Number,
    last_ai_call: Date,
    confidence_scores: [{
      field: String,         // "locador_nome"
      confidence: Number,    // 0-1
      source_message: String // Message ID where data was extracted
    }]
  },
  
  // Compliance and consent
  consent: {
    lgpd_consent_given: Boolean,
    consent_timestamp: Date,
    consent_version: String,
    data_processing_purposes: [String],
    retention_agreed: Boolean,
    withdrawal_requested: Boolean,
    withdrawal_timestamp: Date
  },
  
  // Session management
  session: {
    started_at: Date,
    last_activity: Date,
    session_duration: Number, // Seconds
    idle_timeout: Date,       // When session expires
    completed: Boolean,
    completion_timestamp: Date,
    abandonment_reason: String
  },
  
  // Generated contracts
  generated_contracts: [{
    contract_id: String,
    template_id: String,
    generated_at: Date,
    file_path: String,       // PDF storage location
    file_size: Number,
    delivery_status: String, // "generated", "sent", "failed"
    download_count: Number,
    valid_until: Date
  }],
  
  // Error tracking
  errors: [{
    timestamp: Date,
    error_type: String,      // "ai_extraction", "pdf_generation", "whatsapp_send"
    error_message: String,
    recovery_attempted: Boolean,
    resolved: Boolean
  }],
  
  // Timestamps
  created_at: Date,
  updated_at: Date,
  
  // Indexes for performance
  indexes: [
    { conversation_id: 1 },  // Unique
    { phone_number: 1 },     // Alternative lookup
    { "state.current_step": 1 },
    { "session.last_activity": -1 }, // For cleanup
    { created_at: -1 },
    { "consent.lgpd_consent_given": 1 },
    { "generated_contracts.contract_id": 1 }
  ]
};

// Conversation validation schema
const conversationValidation = {
  $jsonSchema: {
    bsonType: "object",
    required: ["conversation_id", "phone_number", "state", "created_at"],
    properties: {
      conversation_id: {
        bsonType: "string",
        pattern: "^55[0-9]{10,11}$",
        description: "Brazilian phone number with country code"
      },
      phone_number: {
        bsonType: "string",
        pattern: "^55[0-9]{10,11}$"
      },
      state: {
        bsonType: "object",
        required: ["current_step", "progress"],
        properties: {
          current_step: {
            bsonType: "string",
            enum: ["welcome", "consent", "collecting_locador", "collecting_locatario", 
                   "collecting_imovel", "collecting_contrato", "reviewing", 
                   "generating", "completed", "error", "abandoned"]
          },
          progress: {
            bsonType: "int",
            minimum: 0,
            maximum: 100
          }
        }
      },
      messages: {
        bsonType: "array",
        items: {
          bsonType: "object",
          required: ["message_id", "timestamp", "direction", "content"],
          properties: {
            direction: {
              bsonType: "string",
              enum: ["inbound", "outbound"]
            },
            content: {
              bsonType: "object",
              required: ["type"],
              properties: {
                type: {
                  bsonType: "string",
                  enum: ["text", "image", "document", "location", "template"]
                }
              }
            }
          }
        }
      }
    }
  }
};

// TTL index for automatic conversation cleanup (90 days)
const conversationTTL = {
  "session.last_activity": 1
};

module.exports = {
  conversationSchema,
  conversationValidation,
  conversationTTL,
  collectionName: "conversations"
};