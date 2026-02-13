 -- Add 'modo' column to distinguish AI chat from Group chat
ALTER TABLE public.mensajes_chat 
ADD COLUMN IF NOT EXISTS modo text DEFAULT 'ia' CHECK (modo IN ('ia', 'equipo'));

-- Update RLS if needed (Public access already exists in schema.sql but implicit update is good)
-- No RLS change needed if "Public access" policy is "USING (true)".

-- Ensure indexes for performance
CREATE INDEX IF NOT EXISTS idx_mensajes_chat_grupo_modo ON public.mensajes_chat(grupo_id, modo);
