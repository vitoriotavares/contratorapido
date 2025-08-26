// Database Testing Script
// Tests MongoDB connection, collections, and basic operations

const { MongoClient } = require('mongodb');
const DatabaseInitializer = require('./init-database');

class DatabaseTester {
  constructor(connectionString) {
    this.connectionString = connectionString;
    this.client = null;
    this.db = null;
  }

  async connect() {
    console.log('🔌 Connecting to MongoDB for testing...');
    this.client = new MongoClient(this.connectionString);
    await this.client.connect();
    this.db = this.client.db('criador_contrato');
    console.log('✅ Connected to MongoDB');
  }

  async testCollections() {
    console.log('\n📦 Testing Collections');
    console.log('======================');

    const expectedCollections = [
      'templates',
      'conversations', 
      'audit_trail',
      'template_versions',
      'generated_contracts',
      'user_sessions',
      'system_config'
    ];

    const actualCollections = await this.db.listCollections().toArray();
    const actualNames = actualCollections.map(c => c.name);

    for (const expected of expectedCollections) {
      if (actualNames.includes(expected)) {
        const count = await this.db.collection(expected).countDocuments();
        console.log(`✅ ${expected}: exists (${count} documents)`);
      } else {
        console.log(`❌ ${expected}: missing`);
      }
    }
  }

  async testIndexes() {
    console.log('\n🔍 Testing Indexes');
    console.log('==================');

    const collections = ['templates', 'conversations', 'audit_trail'];
    
    for (const collectionName of collections) {
      console.log(`\n${collectionName}:`);
      const indexes = await this.db.collection(collectionName).listIndexes().toArray();
      
      for (const index of indexes) {
        const keyStr = Object.keys(index.key).map(k => 
          `${k}:${index.key[k]}`).join(', ');
        const unique = index.unique ? ' (unique)' : '';
        const ttl = index.expireAfterSeconds ? ` (TTL: ${index.expireAfterSeconds}s)` : '';
        console.log(`  ✅ ${index.name}: {${keyStr}}${unique}${ttl}`);
      }
    }
  }

  async testTemplateOperations() {
    console.log('\n📄 Testing Template Operations');
    console.log('===============================');

    const templatesCollection = this.db.collection('templates');

    // Test template retrieval
    const baseTemplate = await templatesCollection.findOne({ 
      template_id: "rental_residential_basic_v1" 
    });

    if (baseTemplate) {
      console.log('✅ Base template found');
      console.log(`   Name: ${baseTemplate.name}`);
      console.log(`   Version: ${baseTemplate.version.full}`);
      console.log(`   Variables: ${baseTemplate.content.variables.length}`);
      console.log(`   Status: ${baseTemplate.status}`);
    } else {
      console.log('❌ Base template not found');
      return;
    }

    // Test template search by category
    const rentalTemplates = await templatesCollection.find({ 
      category: "rental",
      status: "active" 
    }).toArray();
    console.log(`✅ Found ${rentalTemplates.length} active rental templates`);

    // Test template variable validation
    const requiredVariables = baseTemplate.content.variables.filter(v => v.required);
    console.log(`✅ Template has ${requiredVariables.length} required variables`);

    // Validate template structure
    const hasHtml = baseTemplate.content.html && baseTemplate.content.html.length > 0;
    const hasVariables = baseTemplate.content.variables && baseTemplate.content.variables.length > 0;
    const hasClauses = baseTemplate.content.clauses && baseTemplate.content.clauses.length > 0;

    console.log(`✅ Template structure: HTML(${hasHtml}), Variables(${hasVariables}), Clauses(${hasClauses})`);
  }

  async testConversationOperations() {
    console.log('\n💬 Testing Conversation Operations');
    console.log('===================================');

    const conversationsCollection = this.db.collection('conversations');

    // Create test conversation
    const testConversation = {
      conversation_id: "5511999999999",
      phone_number: "5511999999999",
      display_name: "Test User",
      state: {
        current_step: "welcome",
        sub_step: null,
        progress: 0,
        language: "pt_BR",
        timezone: "America/Sao_Paulo"
      },
      contract_data: {
        locador: {},
        locatario: {},
        imovel: {},
        contrato: {}
      },
      messages: [],
      ai_processing: {
        total_tokens_used: 0,
        gpt4_calls: 0,
        gpt4_mini_calls: 0,
        total_cost_usd: 0,
        extraction_attempts: 0,
        confidence_scores: []
      },
      consent: {
        lgpd_consent_given: false,
        data_processing_purposes: ["contract_generation"],
        retention_agreed: false
      },
      session: {
        started_at: new Date(),
        last_activity: new Date(),
        session_duration: 0,
        completed: false
      },
      generated_contracts: [],
      errors: [],
      created_at: new Date(),
      updated_at: new Date()
    };

    try {
      // Insert test conversation
      await conversationsCollection.insertOne(testConversation);
      console.log('✅ Test conversation inserted');

      // Test conversation retrieval
      const retrieved = await conversationsCollection.findOne({ 
        conversation_id: "5511999999999" 
      });
      
      if (retrieved) {
        console.log('✅ Test conversation retrieved');
        console.log(`   State: ${retrieved.state.current_step}`);
        console.log(`   Progress: ${retrieved.state.progress}%`);
      }

      // Test conversation update
      await conversationsCollection.updateOne(
        { conversation_id: "5511999999999" },
        { 
          $set: { 
            "state.current_step": "collecting_data",
            "state.progress": 25,
            updated_at: new Date()
          }
        }
      );
      console.log('✅ Test conversation updated');

      // Test conversation state queries
      const welcomeConversations = await conversationsCollection.countDocuments({
        "state.current_step": "welcome"
      });
      console.log(`✅ Found ${welcomeConversations} conversations in welcome state`);

      // Clean up test data
      await conversationsCollection.deleteOne({ conversation_id: "5511999999999" });
      console.log('✅ Test conversation cleaned up');

    } catch (error) {
      console.log(`❌ Conversation test failed: ${error.message}`);
    }
  }

  async testAuditOperations() {
    console.log('\n📋 Testing Audit Operations');
    console.log('============================');

    const auditCollection = this.db.collection('audit_trail');

    // Create test audit entry
    const testAudit = {
      audit_id: `AUD-${new Date().toISOString().replace(/[-:.]/g, '').slice(0, 14)}-TEST01`,
      event_type: "data_processing",
      action: "create",
      subject: {
        type: "system",
        id: "database_test"
      },
      data_subject: {
        phone_number: "5511999999999",
        conversation_id: "5511999999999",
        consent_status: "given",
        legal_basis: "consent"
      },
      processing: {
        purpose: "contract_generation",
        legal_basis: "consent",
        automated: true,
        ai_involved: true,
        third_party_sharing: false,
        encryption_used: true
      },
      system: {
        component: "database_test",
        version: "1.0.0",
        environment: "test"
      },
      compliance: {
        controller: "ContratoRápido",
        dpo_notified: false,
        breach_related: false
      },
      timestamp: new Date(),
      created_at: new Date(),
      metadata: {
        correlation_id: `TEST-${Date.now()}`,
        tags: ["test"],
        severity: "low",
        automated_flag: true
      }
    };

    try {
      // Insert test audit entry
      await auditCollection.insertOne(testAudit);
      console.log('✅ Test audit entry inserted');

      // Test audit retrieval by phone number
      const userAudits = await auditCollection.find({
        "data_subject.phone_number": "5511999999999"
      }).toArray();
      console.log(`✅ Found ${userAudits.length} audit entries for test user`);

      // Test audit retrieval by event type
      const dataProcessingAudits = await auditCollection.countDocuments({
        event_type: "data_processing"
      });
      console.log(`✅ Found ${dataProcessingAudits} data processing audit entries`);

      // Test audit retrieval by date range
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayAudits = await auditCollection.countDocuments({
        timestamp: { $gte: today }
      });
      console.log(`✅ Found ${todayAudits} audit entries from today`);

      // Clean up test audit
      await auditCollection.deleteOne({ audit_id: testAudit.audit_id });
      console.log('✅ Test audit entry cleaned up');

    } catch (error) {
      console.log(`❌ Audit test failed: ${error.message}`);
    }
  }

  async testPerformance() {
    console.log('\n⚡ Testing Performance');
    console.log('======================');

    const templatesCollection = this.db.collection('templates');
    
    // Test template query performance
    console.time('Template query');
    await templatesCollection.findOne({ 
      category: "rental", 
      status: "active" 
    });
    console.timeEnd('Template query');

    // Test index usage
    const explainResult = await templatesCollection.find({ 
      category: "rental", 
      status: "active" 
    }).explain("executionStats");

    const indexUsed = explainResult.executionStats.executionStages.indexName !== undefined;
    console.log(`✅ Query uses index: ${indexUsed}`);

    if (explainResult.executionStats.totalDocsExamined !== undefined) {
      console.log(`✅ Documents examined: ${explainResult.executionStats.totalDocsExamined}`);
      console.log(`✅ Documents returned: ${explainResult.executionStats.totalDocsReturned}`);
    }
  }

  async testDataIntegrity() {
    console.log('\n🔒 Testing Data Integrity');
    console.log('==========================');

    const templatesCollection = this.db.collection('templates');

    // Test required fields validation
    try {
      await templatesCollection.insertOne({
        template_id: "invalid_test",
        // Missing required fields
      });
      console.log('❌ Validation failed - invalid document was inserted');
    } catch (error) {
      if (error.code === 121) { // Document failed validation
        console.log('✅ Document validation working');
      } else {
        console.log(`❌ Unexpected validation error: ${error.message}`);
      }
    }

    // Test unique constraint
    try {
      const baseTemplate = await templatesCollection.findOne({ 
        template_id: "rental_residential_basic_v1" 
      });
      
      if (baseTemplate) {
        await templatesCollection.insertOne({
          ...baseTemplate,
          _id: undefined // Remove _id to avoid duplicate key error on _id
        });
        console.log('❌ Unique constraint failed - duplicate template_id was inserted');
      }
    } catch (error) {
      if (error.code === 11000) { // Duplicate key error
        console.log('✅ Unique constraint working');
      } else {
        console.log(`❌ Unexpected unique constraint error: ${error.message}`);
      }
    }
  }

  async generateTestReport() {
    console.log('\n📊 Database Test Report');
    console.log('========================');

    const collections = await this.db.listCollections().toArray();
    console.log(`Total collections: ${collections.length}`);

    for (const collection of collections) {
      const count = await this.db.collection(collection.name).countDocuments();
      const indexes = await this.db.collection(collection.name).listIndexes().toArray();
      const stats = await this.db.collection(collection.name).stats();
      
      console.log(`\n${collection.name}:`);
      console.log(`  Documents: ${count}`);
      console.log(`  Indexes: ${indexes.length}`);
      console.log(`  Storage Size: ${Math.round(stats.storageSize / 1024)} KB`);
      console.log(`  Average Document Size: ${Math.round(stats.avgObjSize || 0)} bytes`);
    }

    // Database summary
    const dbStats = await this.db.stats();
    console.log('\nDatabase Summary:');
    console.log(`  Total Size: ${Math.round(dbStats.dataSize / 1024)} KB`);
    console.log(`  Index Size: ${Math.round(dbStats.indexSize / 1024)} KB`);
    console.log(`  Collections: ${dbStats.collections}`);
    console.log(`  Indexes: ${dbStats.indexes}`);
  }

  async close() {
    if (this.client) {
      await this.client.close();
      console.log('\n🔌 Disconnected from MongoDB');
    }
  }

  async run() {
    try {
      await this.connect();
      await this.testCollections();
      await this.testIndexes();
      await this.testTemplateOperations();
      await this.testConversationOperations();
      await this.testAuditOperations();
      await this.testPerformance();
      await this.testDataIntegrity();
      await this.generateTestReport();
      
      console.log('\n🎉 All database tests completed!');
    } catch (error) {
      console.error('\n❌ Database testing failed:', error);
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
  
  const tester = new DatabaseTester(connectionString);
  tester.run().catch(console.error);
}

module.exports = DatabaseTester;