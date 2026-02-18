-- Migration to add tico_state to proyectos table
ALTER TABLE proyectos ADD COLUMN IF NOT EXISTS tico_state JSONB DEFAULT '{
  "current_outfit_id": null,
  "unlocked_outfits": [],
  "experience": {
    "VisualArts": 0,
    "Entertainment": 0,
    "Letters": 0,
    "Analysis": 0,
    "Uncategorized": 0
  },
  "total_resources_ingested": 0
}'::JSONB;
