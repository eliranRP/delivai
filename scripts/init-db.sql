-- Auto-runs on first Postgres container boot
-- Enables pgvector extension required for RAG
CREATE EXTENSION IF NOT EXISTS vector;
