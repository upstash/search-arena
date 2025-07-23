-- Search Arena Database Schema for Neon PostgreSQL 17

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Provider types enum
CREATE TYPE provider_type AS ENUM ('algolia', 'upstash_search');

-- Database table to store search database credentials
CREATE TABLE databases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label VARCHAR(255) NOT NULL,
    provider provider_type NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Database credentials table (separated for security)
CREATE TABLE database_credentials (
    database_id UUID PRIMARY KEY REFERENCES databases(id) ON DELETE CASCADE,
    -- Algolia credentials
    algolia_application_id VARCHAR(255),
    algolia_api_key VARCHAR(255),
    -- Upstash credentials
    upstash_url TEXT,
    upstash_token TEXT,
    upstash_index VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Battle table to store battle metadata
CREATE TABLE battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label VARCHAR(255) NOT NULL,
    database_id_1 UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    database_id_2 UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP WITH TIME ZONE,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed')),
    mean_score_db1 DECIMAL(4,2),
    mean_score_db2 DECIMAL(4,2),
    CONSTRAINT different_databases CHECK (database_id_1 <> database_id_2)
);

-- Battle queries table to store the queries used in a battle
CREATE TABLE battle_queries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_id UUID NOT NULL REFERENCES battles(id) ON DELETE CASCADE,
    query_text TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Search results table to store results from each database for each query
CREATE TABLE search_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    battle_query_id UUID NOT NULL REFERENCES battle_queries(id) ON DELETE CASCADE,
    database_id UUID NOT NULL REFERENCES databases(id) ON DELETE CASCADE,
    results JSONB NOT NULL, -- Store the raw search results as JSON
    score DECIMAL(4,2), -- LLM-assigned score out of 10
    llm_feedback TEXT, -- Store any additional feedback from the LLM
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(battle_query_id, database_id)
);

-- Indexes for performance
CREATE INDEX idx_databases_provider ON databases(provider);
CREATE INDEX idx_battles_databases ON battles(database_id_1, database_id_2);
CREATE INDEX idx_battles_status ON battles(status);
CREATE INDEX idx_battle_queries_battle_id ON battle_queries(battle_id);
CREATE INDEX idx_search_results_battle_query_id ON search_results(battle_query_id);
CREATE INDEX idx_search_results_database_id ON search_results(database_id);

-- Trigger function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to update timestamps
CREATE TRIGGER update_databases_timestamp
BEFORE UPDATE ON databases
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

CREATE TRIGGER update_database_credentials_timestamp
BEFORE UPDATE ON database_credentials
FOR EACH ROW EXECUTE FUNCTION update_timestamp();

-- View to get battle results with database labels
CREATE OR REPLACE VIEW battle_results_view AS
SELECT 
    b.id AS battle_id,
    b.label AS battle_label,
    b.created_at AS battle_date,
    b.status,
    b.mean_score_db1,
    b.mean_score_db2,
    db1.label AS database_1_label,
    db1.provider AS database_1_provider,
    db2.label AS database_2_label,
    db2.provider AS database_2_provider
FROM 
    battles b
JOIN 
    databases db1 ON b.database_id_1 = db1.id
JOIN 
    databases db2 ON b.database_id_2 = db2.id;

-- View to get detailed battle query results
CREATE OR REPLACE VIEW battle_query_results_view AS
SELECT 
    bq.id AS battle_query_id,
    b.id AS battle_id,
    b.label AS battle_label,
    bq.query_text,
    db1.id AS database_1_id,
    db1.label AS database_1_label,
    sr1.score AS database_1_score,
    db2.id AS database_2_id,
    db2.label AS database_2_label,
    sr2.score AS database_2_score
FROM 
    battles b
JOIN 
    battle_queries bq ON b.id = bq.battle_id
JOIN 
    databases db1 ON b.database_id_1 = db1.id
JOIN 
    databases db2 ON b.database_id_2 = db2.id
LEFT JOIN 
    search_results sr1 ON bq.id = sr1.battle_query_id AND sr1.database_id = db1.id
LEFT JOIN 
    search_results sr2 ON bq.id = sr2.battle_query_id AND sr2.database_id = db2.id;
