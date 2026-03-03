// Run with: mongosh db_megastore_exam docs/mongodb_schema_validation.js

// ── client_histories ─────────────────────────────────────────────────────────
db.createCollection("client_histories", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["clientEmail", "clientName", "purchases"],
         properties: {
            clientEmail: { bsonType: "string", description: "Client email (unique index)" },
            clientName:  { bsonType: "string", description: "Client full name" },
            purchases:   { bsonType: "array",  description: "Embedded purchase records" }
         }
      }
   }
});

db.client_histories.createIndex({ clientEmail: 1 }, { unique: true });

// ── audit_logs ────────────────────────────────────────────────────────────────
// FIX: schema validation was missing from original submission
db.createCollection("audit_logs", {
   validator: {
      $jsonSchema: {
         bsonType: "object",
         required: ["action", "entity", "entityId", "deletedAt", "snapshot"],
         properties: {
            action:    { bsonType: "string", enum: ["DELETE", "UPDATE", "CREATE"] },
            entity:    { bsonType: "string", description: "Entity/table name" },
            entityId:  { bsonType: "int",    description: "Primary key of deleted record" },
            deletedAt: { bsonType: "date",   description: "Timestamp of deletion" },
            snapshot:  { bsonType: "object", description: "Full record snapshot for audit" }
         }
      }
   }
});

db.audit_logs.createIndex({ entity: 1, deletedAt: -1 });

print("Schema validation applied to client_histories and audit_logs.");
