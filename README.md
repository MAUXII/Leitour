# Leitour

Hub social de livros — Letterboxd da leitura.

## Stack

- Next.js 14 (App Router) + TypeScript
- Tailwind CSS
- **Ruixen UI** + **Glass CN**
- **Open Library** — catálogo de livros
- **Firebase** — Auth + Firestore (conta, perfil, estante)

## Começar

```bash
npm install
.\scripts\setup-firebase.ps1
npm run dev
```

Copie `.env.example` → `.env.local` e preencha as chaves.

Publique as rules do Firestore (uma vez):

```powershell
.\scripts\publish-firestore-rules.ps1
```

Depois: `/auth/signup` → `/books` → `/book/…` → review → `/feed` → `/profile`.

## UI

Ruixen UI (registry) + Glass CN para superfícies glass.
