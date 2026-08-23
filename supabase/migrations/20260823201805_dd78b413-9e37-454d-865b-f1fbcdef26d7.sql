-- Coach memory: rolling learner memory for the AI mentor
CREATE TABLE IF NOT EXISTS public.coach_memory (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  goals text NOT NULL DEFAULT '',
  current_focus text NOT NULL DEFAULT '',
  last_commitment text NOT NULL DEFAULT '',
  notes text NOT NULL DEFAULT '',
  last_session_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.coach_memory TO authenticated;
GRANT ALL ON public.coach_memory TO service_role;
ALTER TABLE public.coach_memory ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own coach memory" ON public.coach_memory FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER coach_memory_updated_at BEFORE UPDATE ON public.coach_memory
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Learning tasks: study plan items the coach can create
CREATE TABLE IF NOT EXISTS public.learning_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  detail text NOT NULL DEFAULT '',
  due_date date,
  done boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'coach',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.learning_tasks TO authenticated;
GRANT ALL ON public.learning_tasks TO service_role;
ALTER TABLE public.learning_tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own learning tasks" ON public.learning_tasks FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX IF NOT EXISTS idx_learning_tasks_user ON public.learning_tasks(user_id, done, due_date);

-- Conversation context label (what the chat was opened from)
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS context_label text;