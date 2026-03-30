# π¬ Chat App β Next.js + Supabase

Aplicativo de chat em tempo real com autenticaΓ§Γ£o, salas por cΓ³digo e temas claro/escuro.

---

## π Stack
- **Next.js 14** (App Router)
- **Supabase** (Auth + Realtime + PostgreSQL)
- **Tailwind CSS**
- **Vercel** (Deploy)

---

## π Estrutura de Arquivos

```
chat-app/
βββ app/
β   βββ layout.tsx
β   βββ page.tsx                  # Landing / Login
β   βββ auth/
β   β   βββ callback/route.ts     # OAuth callback
β   βββ chat/
β   β   βββ page.tsx              # Sala de chat
β   βββ globals.css
βββ components/
β   βββ LoginForm.tsx
β   βββ JoinRoomForm.tsx
β   βββ ChatRoom.tsx
β   βββ Message.tsx
β   βββ SettingsMenu.tsx
β   βββ ThemeProvider.tsx
βββ lib/
β   βββ supabase/
β   β   βββ client.ts
β   β   βββ server.ts
β   βββ hooks/
β       βββ useChat.ts
β       βββ useTheme.ts
βββ middleware.ts
βββ .env.local.example
βββ supabase/
    βββ schema.sql
```

---

## βοΈ Setup

### 1. Clone e instale dependΓͺncias

```bash
npx create-next-app@latest chat-app --typescript --tailwind --app
cd chat-app
npm install @supabase/supabase-js @supabase/ssr lucide-react
```

### 2. Configure o Supabase

1. Crie um projeto em [supabase.com](https://supabase.com)
2. VΓ‘ em **SQL Editor** e rode o conteΓΊdo de `supabase/schema.sql`
3. Em **Authentication > Providers**, habilite Email

### 3. VariΓ‘veis de ambiente

Copie `.env.local.example` para `.env.local` e preencha:

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
```

### 4. Deploy no Vercel

```bash
npm install -g vercel
vercel
```

Adicione as mesmas variΓ‘veis em **Vercel > Project > Settings > Environment Variables**.

---

## ποΈ Schema SQL (Supabase)

Execute em **SQL Editor** no Supabase:

```sql
-- Ver arquivo supabase/schema.sql
```

---

## β¨ Funcionalidades

- β Login/Signup com email e senha
- β Entrar em sala por cΓ³digo
- β Criar sala com cΓ³digo personalizado
- β Chat em tempo real (Supabase Realtime)
- β Tema claro/escuro
- β HistΓ³rico de mensagens
- β Menu de configuraΓ§Γ΅es
- β Logout
