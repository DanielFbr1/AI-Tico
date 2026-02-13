# v0.dev Export - Part 4: Styles, Config, and Structure

This artifact contains the global styling rules, build configuration, and the full directory map.

## File List
- `src/index.css`
- `src/styles/globals.css`
- `vite.config.ts`
- `Directory Structure`

---

### src/styles/globals.css
```css
@custom-variant dark (&:is(.dark *));

:root {
  --background: #ffffff;
  --foreground: #030213;
  --primary: #030213;
  --primary-foreground: #ffffff;
  --secondary: #f3f3f5;
  --muted: #ececf0;
  --border: rgba(0, 0, 0, 0.1);
}

.dark {
  --background: #030213;
  --foreground: #ffffff;
  --primary: #ffffff;
  --primary-foreground: #030213;
}

@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-secondary: var(--secondary);
}
```

---

### vite.config.ts
```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: { "@": path.resolve(__dirname, "./src") },
  },
});
```

---

### Directory Structure
```text
/
├── src/
│   ├── components/
│   │   ├── ui/ (shadcn)
│   │   ├── GrupoCard.tsx
│   │   ├── MentorIA.tsx
│   │   └── Sidebar_Docente.tsx
│   ├── context/
│   │   └── AuthContext.tsx
│   ├── pages/
│   │   ├── DashboardDocente.tsx
│   │   └── LandingPage.tsx
│   ├── services/
│   │   └── ai.ts
│   ├── types/
│   │   └── index.ts
│   └── App.tsx
├── package.json
└── vite.config.ts
```
