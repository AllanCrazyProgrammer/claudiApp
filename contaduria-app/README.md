# Sistema de Contaduría

Una aplicación moderna de gestión contable que funciona tanto en web como en escritorio, completamente offline.

## 🚀 Características

- ✅ **Offline First**: Funciona completamente sin conexión a internet
- ✅ **Multiplataforma**: Web y escritorio (con Tauri)
- ✅ **Base de datos local**: IndexedDB con Dexie.js
- ✅ **UI Moderna**: Tailwind CSS + Shadcn/ui
- ✅ **Responsive**: Diseño adaptable a móviles y tablets
- ✅ **Modo oscuro**: Tema claro y oscuro
- ✅ **PWA**: Instalable como aplicación web

## 🛠️ Stack Tecnológico

- **Frontend**: React 18 + TypeScript + Vite
- **UI**: Tailwind CSS + Shadcn/ui components
- **Estado**: Zustand
- **Base de datos**: Dexie.js (IndexedDB)
- **PWA**: Vite PWA Plugin
- **Escritorio**: Tauri (próximamente)

## 📦 Instalación

1. Clona el repositorio:
\`\`\`bash
git clone <url-del-repo>
cd contaduria-app
\`\`\`

2. Instala las dependencias:
\`\`\`bash
npm install
\`\`\`

3. Ejecuta en modo desarrollo:
\`\`\`bash
npm run dev
\`\`\`

4. Abre tu navegador en `http://localhost:5173`

## 🏗️ Compilación

Para compilar la aplicación para producción:

\`\`\`bash
npm run build
\`\`\`

## 📱 Funcionalidades

### ✅ Implementadas
- Dashboard con resumen general
- Navegación entre módulos
- Configuración de empresa
- Base de datos local configurada
- Tema oscuro/claro
- Diseño responsive

### 🔄 En desarrollo
- Gestión de clientes
- Creación de facturas
- Registro de gastos
- Reportes y análisis
- Aplicación de escritorio (Tauri)

## 📁 Estructura del Proyecto

\`\`\`
src/
├── components/          # Componentes reutilizables
│   ├── ui/             # Componentes de UI base
│   └── Layout.tsx      # Layout principal
├── pages/              # Páginas de la aplicación
├── stores/             # Gestión de estado (Zustand)
├── lib/                # Utilidades y configuraciones
│   ├── database.ts     # Configuración de base de datos
│   └── utils.ts        # Funciones de utilidad
└── types/              # Tipos de TypeScript
\`\`\`

## 🎯 Próximos Pasos

1. **Gestión de Clientes**: CRUD completo de clientes
2. **Sistema de Facturas**: Creación, edición y gestión de facturas
3. **Control de Gastos**: Registro y categorización de gastos
4. **Reportes**: Dashboard con gráficos y análisis
5. **Tauri**: Aplicación de escritorio
6. **Exportación**: PDF de facturas y reportes
7. **Backup**: Importar/exportar datos

## 🤝 Contribuir

Este proyecto está diseñado para crecer de manera incremental. Las funcionalidades se van agregando según las necesidades del departamento de contaduría.

## 📄 Licencia

MIT License