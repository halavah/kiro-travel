-- =============================================
-- Full-Text Search Enhancement for Spots
-- =============================================

-- Create FTS5 virtual table for spots full-text search
-- Using tokenize='porter unicode61' for better Chinese support
CREATE VIRTUAL TABLE IF NOT EXISTS spots_fts USING fts5(
  id UNINDEXED,
  name,
  description,
  location,
  tokenize='porter unicode61'
);

-- Populate FTS table with existing data
INSERT INTO spots_fts(id, name, description, location)
SELECT id, name, description, location FROM spots;

-- Create triggers to keep FTS table in sync

-- Trigger: After INSERT on spots
CREATE TRIGGER IF NOT EXISTS spots_ai AFTER INSERT ON spots BEGIN
  INSERT INTO spots_fts(id, name, description, location)
  VALUES (new.id, new.name, new.description, new.location);
END;

-- Trigger: After DELETE on spots
CREATE TRIGGER IF NOT EXISTS spots_ad AFTER DELETE ON spots BEGIN
  DELETE FROM spots_fts WHERE id = old.id;
END;

-- Trigger: After UPDATE on spots
CREATE TRIGGER IF NOT EXISTS spots_au AFTER UPDATE ON spots BEGIN
  UPDATE spots_fts
  SET name = new.name, description = new.description, location = new.location
  WHERE id = new.id;
END;

-- Create index for better performance on combined queries
CREATE INDEX IF NOT EXISTS idx_spots_status_created ON spots(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spots_category_status ON spots(category_id, status);
CREATE INDEX IF NOT EXISTS idx_spots_recommended ON spots(is_recommended, status);
