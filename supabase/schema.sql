-- =============================================
-- CHAT APP SCHEMA — Supabase SQL Editor
-- =============================================

-- Tabela de perfis de usuário (complementa auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de salas de chat
CREATE TABLE IF NOT EXISTS public.rooms (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Tabela de mensagens
CREATE TABLE IF NOT EXISTS public.messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID REFERENCES public.rooms(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  username TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS messages_room_id_idx ON public.messages(room_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON public.messages(created_at);

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- Profiles: qualquer usuário autenticado pode ler; cada um edita o seu
CREATE POLICY "Profiles são públicos" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Usuário edita próprio perfil" ON public.profiles
  FOR ALL USING (auth.uid() = id);

-- Rooms: qualquer autenticado pode ler e criar
CREATE POLICY "Rooms são públicas" ON public.rooms
  FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados criam salas" ON public.rooms
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Messages: qualquer autenticado pode ler e enviar
CREATE POLICY "Mensagens são públicas" ON public.messages
  FOR SELECT USING (true);

CREATE POLICY "Usuários autenticados enviam mensagens" ON public.messages
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- =============================================
-- REALTIME
-- =============================================

-- Habilita Realtime na tabela de mensagens
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;

-- =============================================
-- FUNÇÃO: auto-criar perfil após signup
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1))
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
