// MongoDB Database Initialization Script
// Creates collections, indexes, and initial data for ContratoRápido

const { MongoClient } = require('mongodb');
const fs = require('fs').promises;
const path = require('path');

// Import schemas
const { templateSchema, templateValidation } = require('./schemas/template');
const { conversationSchema, conversationValidation, conversationTTL } = require('./schemas/conversation');
const { auditSchema, auditValidation } = require('./schemas/audit');

class DatabaseInitializer {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.client = null;
    this.db = null;
  }

  async connect() {
    console.log('🔌 Connecting to MongoDB...');
    this.client = new MongoClient(this.connectionString, {
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
    });
    
    await this.client.connect();
    this.db = this.client.db('criador_contrato');
    console.log('✅ Connected to MongoDB');
  }

  async createCollections() {
    console.log('📦 Creating collections...');

    // Templates collection
    try {
      await this.db.createCollection('templates', {
        validator: templateValidation,
        validationLevel: 'strict',
        validationAction: 'error'
      });
      console.log('✅ Created templates collection');
    } catch (error) {
      if (error.code === 48) {
        console.log('⚠️  Templates collection already exists');
      } else {
        throw error;
      }
    }

    // Conversations collection
    try {
      await this.db.createCollection('conversations', {
        validator: conversationValidation,
        validationLevel: 'strict',
        validationAction: 'error'
      });
      console.log('✅ Created conversations collection');
    } catch (error) {
      if (error.code === 48) {
        console.log('⚠️  Conversations collection already exists');
      } else {
        throw error;
      }
    }

    // Audit trail collection
    try {
      await this.db.createCollection('audit_trail', {
        validator: auditValidation,
        validationLevel: 'strict',
        validationAction: 'error'
      });
      console.log('✅ Created audit_trail collection');
    } catch (error) {
      if (error.code === 48) {
        console.log('⚠️  Audit trail collection already exists');
      } else {
        throw error;
      }
    }

    // Additional collections
    const additionalCollections = [
      'template_versions',  // Version history
      'generated_contracts', // Contract metadata
      'user_sessions',      // Session management
      'system_config'       // System configuration
    ];

    for (const collectionName of additionalCollections) {
      try {
        await this.db.createCollection(collectionName);
        console.log(`✅ Created ${collectionName} collection`);
      } catch (error) {
        if (error.code === 48) {
          console.log(`⚠️  ${collectionName} collection already exists`);
        } else {
          console.log(`❌ Failed to create ${collectionName}: ${error.message}`);
        }
      }
    }
  }

  async createIndexes() {
    console.log('🔍 Creating indexes...');

    // Templates indexes
    const templatesIndexes = [
      { key: { template_id: 1 }, options: { unique: true } },
      { key: { category: 1, type: 1, status: 1 } },
      { key: { "version.full": 1 } },
      { key: { "legal_info.effective_date": 1 } },
      { key: { created_at: -1 } },
      { key: { tags: 1 } },
      { key: { status: 1, "usage.total_generated": -1 } }
    ];

    await this.createCollectionIndexes('templates', templatesIndexes);

    // Conversations indexes
    const conversationsIndexes = [
      { key: { conversation_id: 1 }, options: { unique: true } },
      { key: { phone_number: 1 } },
      { key: { "state.current_step": 1 } },
      { key: { "session.last_activity": -1 } },
      { key: { created_at: -1 } },
      { key: { "consent.lgpd_consent_given": 1 } },
      { key: { "generated_contracts.contract_id": 1 } },
      { key: { "session.last_activity": 1 }, options: { expireAfterSeconds: 7776000 } } // 90 days TTL
    ];

    await this.createCollectionIndexes('conversations', conversationsIndexes);

    // Audit trail indexes
    const auditIndexes = [
      { key: { audit_id: 1 }, options: { unique: true } },
      { key: { "data_subject.phone_number": 1 } },
      { key: { "data_subject.conversation_id": 1 } },
      { key: { event_type: 1, timestamp: -1 } },
      { key: { "processing.purpose": 1 } },
      { key: { "request.type": 1, "request.status": 1 } },
      { key: { "compliance.breach_related": 1 } },
      { key: { timestamp: -1 } },
      { key: { created_at: 1 }, options: { expireAfterSeconds: 157680000 } } // 5 years TTL
    ];

    await this.createCollectionIndexes('audit_trail', auditIndexes);
  }

  async createCollectionIndexes(collectionName, indexes) {
    for (const index of indexes) {
      try {
        await this.db.collection(collectionName).createIndex(index.key, index.options || {});
        const keyStr = Object.keys(index.key).join(', ');
        console.log(`✅ Created index on ${collectionName}: ${keyStr}`);
      } catch (error) {
        if (error.code === 85) {
          console.log(`⚠️  Index already exists on ${collectionName}`);
        } else {
          console.log(`❌ Failed to create index on ${collectionName}: ${error.message}`);
        }
      }
    }
  }

  async insertInitialData() {
    console.log('📝 Inserting initial data...');

    // Load base template
    const templateHtml = await fs.readFile(
      path.join(__dirname, '../pdf-templates/contract-base.html'),
      'utf8'
    );

    // Base rental template
    const baseTemplate = {
      template_id: "rental_residential_basic_v1",
      name: "Contrato de Locação Residencial Básico",
      category: "rental",
      type: "residential",
      version: {
        major: 1,
        minor: 0,
        patch: 0,
        full: "1.0.0"
      },
      legal_info: {
        applicable_law: "Lei nº 8.245/91 (Lei do Inquilinato)",
        jurisdiction: "Brasil",
        effective_date: new Date(),
        lawyer_reviewed: true,
        lawyer_info: {
          name: "Sistema ContratoRápido",
          oab: "Revisão Automática",
          review_date: new Date(),
          signature: "Sistema Automatizado"
        }
      },
      content: {
        html: templateHtml,
        css: "",
        variables: [
          { name: "locador_nome", label: "Nome do Locador", type: "text", required: true, placeholder: "João da Silva", help_text: "Nome completo do proprietário" },
          { name: "locador_documento", label: "CPF/CNPJ do Locador", type: "cpf", required: true, validation: "^[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}|[0-9]{2}\\.[0-9]{3}\\.[0-9]{3}/[0-9]{4}-[0-9]{2}$", placeholder: "123.456.789-00" },
          { name: "locador_endereco", label: "Endereço do Locador", type: "text", required: true, placeholder: "Rua das Flores, 123" },
          { name: "locador_cidade", label: "Cidade do Locador", type: "text", required: true, placeholder: "São Paulo" },
          { name: "locador_estado", label: "Estado do Locador", type: "text", required: true, placeholder: "SP" },
          { name: "locador_cep", label: "CEP do Locador", type: "text", required: true, validation: "^[0-9]{5}-[0-9]{3}$", placeholder: "01234-567" },
          
          { name: "locatario_nome", label: "Nome do Locatário", type: "text", required: true, placeholder: "Maria da Silva", help_text: "Nome completo do inquilino" },
          { name: "locatario_documento", label: "CPF do Locatário", type: "cpf", required: true, validation: "^[0-9]{3}\\.[0-9]{3}\\.[0-9]{3}-[0-9]{2}$", placeholder: "987.654.321-00" },
          { name: "locatario_endereco", label: "Endereço do Locatário", type: "text", required: true, placeholder: "Avenida Paulista, 1000" },
          { name: "locatario_cidade", label: "Cidade do Locatário", type: "text", required: true, placeholder: "São Paulo" },
          { name: "locatario_estado", label: "Estado do Locatário", type: "text", required: true, placeholder: "SP" },
          { name: "locatario_cep", label: "CEP do Locatário", type: "text", required: true, validation: "^[0-9]{5}-[0-9]{3}$", placeholder: "01310-100" },
          
          { name: "imovel_endereco", label: "Endereço do Imóvel", type: "text", required: true, placeholder: "Rua dos Jardins, 456", help_text: "Endereço completo do imóvel a ser alugado" },
          { name: "imovel_tipo", label: "Tipo do Imóvel", type: "text", required: true, placeholder: "Casa/Apartamento/Kitnet" },
          { name: "imovel_cidade", label: "Cidade do Imóvel", type: "text", required: true, placeholder: "São Paulo" },
          { name: "imovel_estado", label: "Estado do Imóvel", type: "text", required: true, placeholder: "SP" },
          { name: "imovel_cep", label: "CEP do Imóvel", type: "text", required: true, validation: "^[0-9]{5}-[0-9]{3}$", placeholder: "04567-890" },
          
          { name: "valor_aluguel", label: "Valor do Aluguel", type: "currency", required: true, placeholder: "2.500,00", help_text: "Valor mensal em reais" },
          { name: "valor_aluguel_extenso", label: "Valor por Extenso", type: "text", required: true, placeholder: "dois mil e quinhentos reais" },
          { name: "valor_caucao", label: "Valor da Caução", type: "currency", required: true, placeholder: "5.000,00", help_text: "Depósito de segurança" },
          { name: "dia_vencimento", label: "Dia do Vencimento", type: "number", required: true, placeholder: "05", help_text: "Dia do mês para pagamento (1-31)" },
          
          { name: "duracao_contrato", label: "Duração do Contrato", type: "text", required: true, placeholder: "12 (doze) meses" },
          { name: "data_inicio", label: "Data de Início", type: "date", required: true, placeholder: "01 de dezembro de 2024" },
          { name: "data_fim", label: "Data de Fim", type: "date", required: true, placeholder: "30 de novembro de 2025" },
          
          { name: "comarca", label: "Comarca", type: "text", required: true, placeholder: "São Paulo/SP", help_text: "Foro competente" },
          { name: "cidade_assinatura", label: "Cidade da Assinatura", type: "text", required: true, placeholder: "São Paulo/SP" },
          { name: "data_assinatura", label: "Data da Assinatura", type: "date", required: true, placeholder: "23 de agosto de 2024" },
          
          { name: "data_geracao", label: "Data de Geração", type: "text", required: false, placeholder: "23/08/2024 14:30:15", help_text: "Preenchido automaticamente" },
          { name: "documento_id", label: "ID do Documento", type: "text", required: false, placeholder: "CR-20240823143015-ABC", help_text: "Identificador único do contrato" }
        ],
        clauses: [
          {
            id: "objeto",
            title: "CLÁUSULA 1ª - DO OBJETO",
            content: "O LOCADOR dá em locação ao LOCATÁRIO, que aceita, o imóvel descrito acima, destinado exclusivamente para fins residenciais, em perfeito estado de conservação e funcionamento.",
            required: true,
            legal_basis: "Art. 3º da Lei 8.245/91"
          },
          {
            id: "prazo",
            title: "CLÁUSULA 2ª - DO PRAZO",
            content: "A locação vigorará pelo prazo de {{duracao_contrato}}, iniciando-se em {{data_inicio}} e findando-se em {{data_fim}}, podendo ser renovado por acordo entre as partes.",
            required: true,
            legal_basis: "Art. 46 da Lei 8.245/91"
          },
          {
            id: "aluguel",
            title: "CLÁUSULA 3ª - DO ALUGUEL",
            content: "O LOCATÁRIO pagará ao LOCADOR o valor mensal de R$ {{valor_aluguel}} ({{valor_aluguel_extenso}}), vencível todo dia {{dia_vencimento}} de cada mês.",
            required: true,
            legal_basis: "Art. 9º da Lei 8.245/91"
          }
        ]
      },
      usage: {
        total_generated: 0,
        last_used: null,
        success_rate: 100,
        avg_generation_time: 0,
        common_errors: []
      },
      compliance: {
        lgpd_compliant: true,
        data_retention_days: 1825, // 5 years
        personal_data_fields: ["locador_nome", "locador_documento", "locatario_nome", "locatario_documento"],
        audit_required: true,
        encryption_required: true
      },
      created_at: new Date(),
      updated_at: new Date(),
      created_by: "system_init",
      updated_by: "system_init",
      status: "active",
      tags: ["residential", "basic", "rental", "standard"]
    };

    // Insert base template
    try {
      await this.db.collection('templates').insertOne(baseTemplate);
      console.log('✅ Inserted base rental template');
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠️  Base template already exists');
      } else {
        console.log(`❌ Failed to insert base template: ${error.message}`);
      }
    }

    // Insert system configuration
    const systemConfig = {
      config_id: "system_default",
      version: "1.0.0",
      settings: {
        default_template: "rental_residential_basic_v1",
        max_concurrent_conversations: 1000,
        session_timeout_minutes: 30,
        pdf_generation_timeout_seconds: 30,
        ai_processing_timeout_seconds: 60,
        max_file_size_mb: 10,
        supported_languages: ["pt_BR"],
        default_timezone: "America/Sao_Paulo",
        lgpd: {
          retention_days: 1825,
          consent_required: true,
          audit_enabled: true,
          encryption_required: true,
          dpo_contact: "dpo@contratorapido.com"
        },
        rate_limits: {
          messages_per_hour: 100,
          contracts_per_day: 50,
          ai_calls_per_minute: 60
        }
      },
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      await this.db.collection('system_config').insertOne(systemConfig);
      console.log('✅ Inserted system configuration');
    } catch (error) {
      if (error.code === 11000) {
        console.log('⚠️  System configuration already exists');
      } else {
        console.log(`❌ Failed to insert system config: ${error.message}`);
      }
    }
  }

  async createAuditEntry(action, details = {}) {
    const auditEntry = {
      audit_id: `AUD-${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)}-${Math.random().toString(36).substr(2, 6).toUpperCase()}`,
      event_type: "system_access",
      action: action,
      subject: {
        type: "system",
        id: "database_init",
        ip_address: "127.0.0.1"
      },
      data_subject: {
        phone_number: null,
        conversation_id: null,
        consent_status: "not_applicable",
        legal_basis: "system_operation"
      },
      processing: {
        purpose: "system_initialization",
        legal_basis: "legitimate_interests",
        automated: true,
        ai_involved: false,
        third_party_sharing: false,
        cross_border_transfer: false,
        encryption_used: true,
        pseudonymization: false
      },
      system: {
        component: "database_init",
        version: "1.0.0",
        environment: process.env.NODE_ENV || "development",
        server_id: require('os').hostname(),
        process_id: process.pid.toString()
      },
      compliance: {
        controller: "ContratoRápido",
        processor: "ContratoRápido",
        dpo_notified: false,
        authority_reporting_required: false,
        breach_related: false
      },
      timestamp: new Date(),
      created_at: new Date(),
      metadata: {
        correlation_id: `INIT-${Date.now()}`,
        tags: ["initialization", "system"],
        severity: "low",
        automated_flag: true,
        human_review_required: false,
        ...details
      }
    };

    await this.db.collection('audit_trail').insertOne(auditEntry);
  }

  async verifySetup() {
    console.log('🔍 Verifying database setup...');

    const collections = await this.db.listCollections().toArray();
    console.log(`✅ Found ${collections.length} collections`);

    for (const collection of collections) {
      const count = await this.db.collection(collection.name).countDocuments();
      const indexes = await this.db.collection(collection.name).listIndexes().toArray();
      console.log(`   ${collection.name}: ${count} documents, ${indexes.length} indexes`);
    }

    // Test template retrieval
    const template = await this.db.collection('templates').findOne({ template_id: "rental_residential_basic_v1" });
    if (template) {
      console.log('✅ Base template accessible');
    } else {
      console.log('❌ Base template not found');
    }

    console.log('✅ Database verification complete');
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('🔌 Disconnected from MongoDB');
    }
  }

  async run() {
    try {
      await this.connect();
      
      // Create audit entry for initialization start
      await this.createAuditEntry("create", { action_details: "Database initialization started" });
      
      await this.createCollections();
      await this.createIndexes();
      await this.insertInitialData();
      await this.verifySetup();
      
      // Create audit entry for initialization completion
      await this.createAuditEntry("create", { action_details: "Database initialization completed successfully" });
      
      console.log('🎉 Database initialization complete!');
    } catch (error) {
      console.error('❌ Database initialization failed:', error);
      
      // Create audit entry for initialization failure
      try {
        await this.createAuditEntry("create", { 
          action_details: "Database initialization failed",
          error_message: error.message 
        });
      } catch (auditError) {
        console.error('Failed to create audit entry:', auditError);
      }
      
      throw error;
    } finally {
      await this.close();
    }
  }
}

// Main execution
if (require.main === module) {
  const connectionString = process.env.DB_MONGODB_CONNECTION_URL || 
    'mongodb://root:your_secure_mongo_password_here@localhost:27017/criador_contrato?replicaSet=rs0&authSource=admin';
  
  const initializer = new DatabaseInitializer(connectionString);
  initializer.run().catch(console.error);
}

module.exports = DatabaseInitializer;