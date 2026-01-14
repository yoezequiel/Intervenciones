# 📋 Documentación Técnica - Aplicación de Registro de Intervenciones de Bomberos

## Índice

1. [Descripción General](#descripción-general)
2. [Arquitectura del Proyecto](#arquitectura-del-proyecto)
3. [Estructura de Directorios](#estructura-de-directorios)
4. [Base de Datos](#base-de-datos)
5. [Funcionalidades Detalladas](#funcionalidades-detalladas)
6. [Componentes Principales](#componentes-principales)
7. [Pantallas de la Aplicación](#pantallas-de-la-aplicación)
8. [Gestión de Estado](#gestión-de-estado)
9. [Configuración y Variables de Entorno](#configuración-y-variables-de-entorno)
10. [Guía de Desarrollo](#guía-de-desarrollo)
11. [Integración con IA](#integración-con-ia)
12. [Compilación y Despliegue](#compilación-y-despliegue)
13. [Solución de Problemas](#solución-de-problemas)

---

## Descripción General

Aplicación móvil multiplataforma diseñada específicamente para el Cuerpo de Bomberos que permite registrar intervenciones de emergencia de manera offline, capturar información detallada en campo y generar informes técnicos profesionales utilizando inteligencia artificial.

### Características Principales

-   **Funcionamiento 100% Offline**: La aplicación funciona completamente sin conexión a internet. Todos los datos se almacenan localmente en el dispositivo.
-   **Base de Datos SQLite**: Persistencia de datos robusta y eficiente mediante SQLite embebida.
-   **Generación de Informes con IA**: Utiliza Google Gemini para generar informes técnicos profesionales automáticamente.
-   **Captura GPS**: Registro automático de coordenadas geográficas de las intervenciones.
-   **Multimedia**: Soporte para adjuntar fotografías a las intervenciones.
-   **Sin Autenticación**: Acceso directo sin necesidad de login o contraseñas.

### Tecnologías Utilizadas

| Tecnología                | Versión | Propósito                     |
| ------------------------- | ------- | ----------------------------- |
| Expo                      | 54.0.0  | Framework de desarrollo       |
| React Native              | 0.81.5  | UI multiplataforma            |
| React                     | 19.1.0  | Librería base                 |
| Expo SQLite               | 16.0.10 | Base de datos local           |
| React Navigation          | 7.x     | Navegación entre pantallas    |
| React Native Paper        | 5.14.5  | Componentes Material Design   |
| Google Generative AI      | 1.35.0  | Generación de informes con IA |
| React Native Image Picker | 8.2.1   | Captura de fotografías        |

---

## Arquitectura del Proyecto

### Patrón Arquitectónico

La aplicación sigue una arquitectura basada en **componentes funcionales con hooks** y utiliza el patrón **Context API** para la gestión de estado global.

```
┌─────────────────────────────────────────┐
│         Capa de Presentación            │
│   (Screens + Components + Navigation)   │
├─────────────────────────────────────────┤
│         Capa de Lógica de Negocio       │
│        (Context API + Custom Hooks)      │
├─────────────────────────────────────────┤
│         Capa de Datos                   │
│    (SQLite + DatabaseContext)           │
├─────────────────────────────────────────┤
│         Servicios Externos              │
│    (Google Gemini API - Opcional)       │
└─────────────────────────────────────────┘
```

### Flujo de Datos

1. **Inicialización**: La app inicia y DatabaseContext crea/abre la base de datos SQLite
2. **Carga de Datos**: Se cargan todas las intervenciones desde SQLite al estado de React
3. **Interacción del Usuario**: El usuario navega por las pantallas y realiza operaciones (crear, leer, actualizar, eliminar)
4. **Persistencia**: Todas las operaciones se guardan inmediatamente en SQLite
5. **Sincronización de Estado**: El estado de React se actualiza para reflejar los cambios
6. **Generación de Informes** (Opcional): Conexión puntual a la API de Gemini para generar informes

---

## Estructura de Directorios

```
Intervenciones/
│
├── android/                      # Código nativo de Android
│   ├── app/
│   │   ├── src/
│   │   │   ├── main/
│   │   │   │   ├── AndroidManifest.xml
│   │   │   │   ├── java/com/yoezequiel/intervencionbomberos/
│   │   │   │   │   ├── MainActivity.kt
│   │   │   │   │   └── MainApplication.kt
│   │   │   │   └── res/           # Recursos (iconos, colores, strings)
│   │   │   ├── debug/             # Configuración para desarrollo
│   │   │   └── debugOptimized/    # Configuración optimizada
│   │   └── build.gradle           # Configuración de build de Android
│   ├── build.gradle               # Configuración global de Gradle
│   └── gradle.properties          # Propiedades de Gradle
│
├── ios/                           # Código nativo de iOS
│   ├── IntervencionesBomberos/
│   │   ├── AppDelegate.swift
│   │   ├── Info.plist
│   │   └── Images.xcassets/       # Assets de iOS
│   ├── Podfile                    # Dependencias de CocoaPods
│   └── IntervencionesBomberos.xcodeproj/
│
├── src/                           # Código fuente principal
│   ├── components/                # Componentes reutilizables
│   │   ├── AccordionSection.js    # Componente de acordeón
│   │   └── ErrorBoundary.js       # Manejo de errores de React
│   │
│   ├── context/                   # Contextos de React
│   │   └── DatabaseContext.js     # Contexto para gestión de BD
│   │
│   ├── screens/                   # Pantallas de la aplicación
│   │   ├── HomeScreen.js          # Pantalla principal (lista)
│   │   ├── InterventionFormScreen.js   # Formulario de nueva intervención
│   │   ├── InterventionDetailScreen.js # Detalle de intervención
│   │   └── ReportScreen.js        # Pantalla de visualización de informe
│   │
│   ├── types/                     # Definiciones de tipos
│   │   └── index.js               # Tipos y constantes
│   │
│   ├── utils/                     # Utilidades
│   │   └── databaseInit.js        # Inicialización de BD
│   │
│   └── theme.js                   # Tema personalizado (colores bomberiles)
│
├── assets/                        # Recursos estáticos
│
├── App.js                         # Componente raíz de la aplicación
├── index.js                       # Punto de entrada de la aplicación
├── app.json                       # Configuración de Expo
├── app.config.js                  # Configuración dinámica de Expo
├── babel.config.js                # Configuración de Babel
├── metro.config.js                # Configuración de Metro bundler
├── react-native.config.js         # Configuración de React Native
├── eas.json                       # Configuración de EAS Build
├── env.js                         # Variables de entorno
├── package.json                   # Dependencias del proyecto
└── README.md                      # Guía rápida
```

### Descripción de Directorios Principales

#### `/src/components`

Componentes React reutilizables que se usan en múltiples pantallas:

-   **AccordionSection**: Componente para crear secciones desplegables en formularios
-   **ErrorBoundary**: Manejo de errores a nivel de componente para evitar crashes

#### `/src/context`

Contextos de React para gestión de estado global:

-   **DatabaseContext**: Proporciona acceso a la base de datos y operaciones CRUD en toda la app

#### `/src/screens`

Pantallas principales de la aplicación:

-   **HomeScreen**: Lista de todas las intervenciones con búsqueda y filtros
-   **InterventionFormScreen**: Formulario completo para crear/editar intervenciones
-   **InterventionDetailScreen**: Vista detallada de una intervención específica
-   **ReportScreen**: Visualización del informe generado por IA

#### `/src/utils`

Funciones utilitarias y helpers:

-   **databaseInit.js**: Funciones para inicializar y gestionar la base de datos SQLite

#### `/src/types`

Definiciones de tipos, constantes y enums:

-   Tipos de intervención (incendio, rescate, accidente, etc.)
-   Interfaces y tipos de datos

---

## Base de Datos

### Tecnología: SQLite (Expo SQLite)

La aplicación utiliza SQLite como motor de base de datos local, proporcionando:

-   **Persistencia offline**: Todos los datos se almacenan localmente
-   **Alto rendimiento**: Consultas rápidas sin latencia de red
-   **Confiabilidad**: Base de datos probada y estable
-   **Portabilidad**: Funciona igual en Android e iOS

### Esquema de la Base de Datos

#### Tabla: `interventions`

```sql
CREATE TABLE IF NOT EXISTS interventions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  callTime TEXT,                    -- Hora del llamado (formato: HH:MM)
  departureTime TEXT,               -- Hora de salida del cuartel
  returnTime TEXT,                  -- Hora de regreso al cuartel
  address TEXT,                     -- Dirección o ubicación de la intervención
  type TEXT,                        -- Tipo de intervención
  otherServices TEXT,               -- Servicios intervinientes (JSON)
  witnesses TEXT,                   -- Testigos (JSON array)
  victims TEXT,                     -- Víctimas (JSON array)
  fieldNotes TEXT,                  -- Notas de campo (texto libre)
  audioNotes TEXT,                  -- Notas de audio (JSON array) [Futuro]
  sketches TEXT,                    -- Croquis/dibujos (JSON array) [Futuro]
  report TEXT,                      -- Informe generado por IA
  createdAt TEXT NOT NULL,          -- Fecha de creación (ISO 8601)
  updatedAt TEXT NOT NULL           -- Fecha de última actualización (ISO 8601)
);
```

### Estructura de Datos JSON

#### Campo `otherServices` (Otros Servicios)

```json
[
    {
        "type": "Policía",
        "description": "2 móviles - Patrulla 101"
    },
    {
        "type": "Ambulancia",
        "description": "1 unidad - SAME 15"
    }
]
```

#### Campo `witnesses` (Testigos)

```json
["Juan Pérez", "María González", "Carlos Rodríguez"]
```

#### Campo `victims` (Víctimas)

```json
[
    {
        "name": "José López",
        "description": "Trauma en pierna izquierda, consciente"
    },
    {
        "name": "Ana Martínez",
        "description": "Inhalación de humo, derivada al hospital"
    }
]
```

### Operaciones CRUD

Todas las operaciones CRUD están implementadas en el `DatabaseContext`:

#### Create (Crear)

```javascript
const addIntervention = async (interventionData) => {
    // Inserta una nueva intervención en la BD
    // Actualiza el estado de React automáticamente
};
```

#### Read (Leer)

```javascript
const loadInterventions = async () => {
    // Carga todas las intervenciones desde SQLite
    // Ordena por fecha descendente
};

const getIntervention = async (id) => {
    // Obtiene una intervención específica por ID
};
```

#### Update (Actualizar)

```javascript
const updateIntervention = async (id, updates) => {
    // Actualiza campos específicos de una intervención
    // Actualiza el campo updatedAt automáticamente
};
```

#### Delete (Eliminar)

```javascript
const deleteIntervention = async (id) => {
    // Elimina una intervención de la BD
    // Actualiza el estado de React
};
```

### Inicialización de la Base de Datos

El proceso de inicialización ocurre en `DatabaseContext.js`:

1. **Verificación del directorio**: Se verifica que exista el directorio `SQLite`
2. **Creación del directorio**: Si no existe, se crea
3. **Apertura de la base de datos**: Se abre o crea el archivo `interventions.db`
4. **Creación de tablas**: Se ejecuta el SQL para crear la tabla si no existe
5. **Carga inicial**: Se cargan todas las intervenciones en el estado
6. **Estado listo**: Se marca `isDbReady` como `true`

### Gestión de Errores

-   **Modo desarrollo**: Si ocurre un error, la BD se elimina y recrea automáticamente
-   **Modo producción**: Los errores se registran pero no se elimina la BD
-   **Logs detallados**: En desarrollo, se registran todas las operaciones de BD

---

## Funcionalidades Detalladas

### 1. Lista de Intervenciones (HomeScreen)

**Características:**

-   **Vista de Lista**: Muestra todas las intervenciones en formato de tarjetas
-   **Búsqueda en Tiempo Real**: Busca por dirección o notas de campo
-   **Filtros por Tipo**: Chips interactivos para filtrar por tipo de intervención
-   **Ordenamiento**: Las intervenciones más recientes aparecen primero
-   **Navegación Rápida**: Toque en una tarjeta para ver detalles

**Información Mostrada en Cada Tarjeta:**

-   Tipo de intervención (título)
-   Dirección de la intervención
-   Fecha y hora de creación
-   Hora de llamado y salida
-   Extracto de notas de campo (2 líneas máximo)

**Botón de Acción Flotante (FAB):**

-   Icono: "+"
-   Acción: Navega al formulario de nueva intervención

### 2. Formulario de Nueva Intervención (InterventionFormScreen)

El formulario está organizado en secciones desplegables (acordeones) para mejor organización:

#### Sección 1: Datos Cronológicos

-   **Hora del Llamado**: Campo de hora con botón "Ahora"
-   **Hora de Salida**: Campo de hora con botón "Ahora"
-   **Hora de Regreso**: Campo de hora con botón "Ahora"

_Funcionalidad especial_: Los botones "Ahora" capturan automáticamente la hora actual del dispositivo.

#### Sección 2: Ubicación

-   **Dirección**: Campo de texto para ingresar la dirección o punto de referencia
-   **Captura GPS**: Botón para capturar coordenadas automáticamente
-   **Coordenadas**: Se muestran las coordenadas capturadas (latitud, longitud)

#### Sección 3: Tipo de Intervención

Selector de tipo con las siguientes opciones:

-   Incendio Estructural
-   Incendio Forestal
-   Accidente de Tránsito
-   Rescate
-   Alarma Falsa
-   Servicio Especial
-   Otro

#### Sección 4: Otros Servicios Intervinientes

Lista dinámica para agregar servicios que colaboraron:

-   **Tipo de Servicio**: Policía, Ambulancia, Grúa, Electricidad, Gas, Agua, Defensa Civil, Otro
-   **Descripción**: Detalles del servicio (cantidad, identificación, personal)
-   **Agregar/Eliminar**: Botones para gestionar la lista

#### Sección 5: Testigos

-   **Lista de Testigos**: Agregar nombres de testigos presentes
-   **Agregar/Eliminar**: Botones para gestionar la lista

#### Sección 6: Víctimas

-   **Lista de Víctimas**: Agregar información detallada
    -   Nombre de la víctima
    -   Descripción del estado/lesiones
-   **Agregar/Eliminar**: Botones para gestionar la lista

#### Sección 7: Notas de Campo

-   **Campo de Texto Libre**: Área grande para descripción detallada de la intervención
-   **Adjuntar Fotos**: Botón para seleccionar fotos de galería o cámara
-   **Galería de Fotos**: Muestra miniaturas de las fotos adjuntas
-   **Eliminar Fotos**: Opción para quitar fotos individuales

**Validaciones:**

-   Todos los campos obligatorios están marcados con (\*)
-   Se valida que los campos requeridos no estén vacíos antes de guardar
-   Se muestra un mensaje de error si faltan campos obligatorios

**Guardado:**

-   Botón "Guardar Intervención" al final del formulario
-   Se guardan los datos en SQLite
-   Se actualiza automáticamente la lista en HomeScreen
-   Navegación automática de regreso a la pantalla principal

### 3. Detalle de Intervención (InterventionDetailScreen)

**Información Mostrada:**

-   **Encabezado**: Tipo de intervención y fecha
-   **Datos Cronológicos**: Llamado, salida y regreso
-   **Ubicación**: Dirección y coordenadas (si existen)
-   **Servicios**: Lista de todos los servicios intervinientes
-   **Testigos**: Lista completa de testigos
-   **Víctimas**: Información detallada de cada víctima
-   **Notas**: Notas de campo completas
-   **Fotos**: Galería completa de fotos
-   **Informe**: Informe generado por IA (si existe)

**Acciones Disponibles:**

-   **Editar**: Navega al formulario con datos precargados para edición
-   **Generar Informe con IA**: Genera un informe técnico profesional
-   **Ver Informe**: Navega a la pantalla de visualización del informe
-   **Exportar a PDF**: Exporta el informe como PDF
-   **Compartir**: Comparte el informe por otras apps
-   **Copiar Informe**: Copia el texto del informe al portapapeles
-   **Eliminar**: Elimina la intervención (con confirmación)

### 4. Generación de Informes con IA (ReportScreen)

**Proceso de Generación:**

1. Usuario presiona "Generar Informe con IA" en el detalle
2. Se muestra un indicador de carga
3. Se envían los datos estructurados a Google Gemini
4. La IA procesa y genera un informe técnico profesional
5. El informe se guarda en la intervención
6. Se navega automáticamente a ReportScreen

**Estructura del Informe Generado:**

El informe sigue el formato estándar de bomberos:

```
INFORME DE INTERVENCIÓN

I. DATOS GENERALES
- Fecha y hora del llamado
- Dirección de la intervención
- Tipo de intervención
- Datos cronológicos

II. DESCRIPCIÓN DE LOS HECHOS
Narrativa profesional de lo ocurrido basada en:
- Notas de campo
- Información de testigos
- Descripción de víctimas
- Fotografías

III. MEDIOS INTERVINIENTES
- Servicios de bomberos
- Policía
- Ambulancias
- Otros servicios

IV. PERSONAS INVOLUCRADAS
- Testigos
- Víctimas con estado

V. APRECIACIÓN Y CONCLUSIONES
Análisis técnico y conclusiones profesionales

VI. RECOMENDACIONES
Sugerencias y medidas preventivas
```

**Características del Informe:**

-   Lenguaje técnico y profesional
-   Estructura clara y organizada
-   Redacción objetiva
-   Formato estándar para documentación oficial

**Opciones de Exportación:**

-   **PDF**: Genera un archivo PDF con formato profesional
-   **Texto**: Copia el informe completo al portapapeles
-   **Compartir**: Envía por WhatsApp, email, Drive, etc.

### 5. Gestión Offline

**Almacenamiento Local:**

-   Todos los datos se guardan en SQLite
-   No requiere conexión a internet para operaciones normales
-   Las fotos se almacenan como URIs locales
-   Acceso instantáneo a toda la información

**Sincronización:**

-   No hay sincronización con servicios en la nube
-   Cada dispositivo mantiene sus propios datos
-   Ideal para privacidad y seguridad

---

## Componentes Principales

### DatabaseContext

**Ubicación**: `src/context/DatabaseContext.js`

**Propósito**: Proporcionar acceso centralizado a la base de datos SQLite y operaciones CRUD en toda la aplicación.

**API Proporcionada:**

```javascript
const {
    interventions, // Array de todas las intervenciones
    db, // Instancia de la base de datos
    isDbReady, // Boolean: indica si la BD está lista
    error, // Error de inicialización (si existe)
    addIntervention, // Función para crear intervención
    updateIntervention, // Función para actualizar intervención
    deleteIntervention, // Función para eliminar intervención
    loadInterventions, // Función para recargar intervenciones
} = useDatabase();
```

**Uso en Componentes:**

```javascript
import { useDatabase } from '../context/DatabaseContext';

function MyComponent() {
  const { interventions, addIntervention } = useDatabase();

  const handleCreate = async () => {
    await addIntervention({
      callTime: '10:30',
      address: 'Calle Falsa 123',
      type: 'Incendio Estructural',
      // ... más campos
    });
  };

  return (
    // JSX
  );
}
```

### AccordionSection

**Ubicación**: `src/components/AccordionSection.js`

**Propósito**: Crear secciones desplegables en el formulario para mejor organización visual.

**Props:**

-   `title`: Título de la sección
-   `expanded`: Estado de expansión (controlado)
-   `onPress`: Callback al presionar la sección
-   `children`: Contenido de la sección

**Uso:**

```javascript
<AccordionSection
    title="Datos Cronológicos"
    expanded={cronologiaExpanded}
    onPress={() => setCronologiaExpanded(!cronologiaExpanded)}>
    {/* Contenido del acordeón */}
</AccordionSection>
```

### ErrorBoundary

**Ubicación**: `src/components/ErrorBoundary.js`

**Propósito**: Capturar errores de React y mostrar una pantalla de error amigable en lugar de que la app crashee.

**Uso:**

```javascript
<ErrorBoundary>
    <App />
</ErrorBoundary>
```

---

## Pantallas de la Aplicación

### HomeScreen

**Ruta**: `Home`

**Funcionalidad Principal**: Lista y gestión de intervenciones

**Estado Local:**

-   `searchQuery`: Texto de búsqueda
-   `selectedType`: Tipo de intervención filtrado

**Funciones Principales:**

-   `filteredInterventions()`: Filtra intervenciones por búsqueda y tipo
-   `formatDate()`: Formatea fechas para visualización
-   `renderIntervention()`: Renderiza cada tarjeta de intervención

**Navegación:**

-   A `InterventionDetail`: Al tocar una tarjeta
-   A `InterventionForm`: Al presionar el FAB

### InterventionFormScreen

**Ruta**: `InterventionForm`

**Parámetros de Navegación:**

-   `id` (opcional): ID de intervención para modo edición

**Estado Local:**

-   Todos los campos del formulario
-   Estados de expansión de acordeones
-   Lista de fotos, testigos, víctimas, servicios

**Funciones Principales:**

-   `handleSave()`: Valida y guarda la intervención
-   `handleCaptureGPS()`: Captura coordenadas GPS
-   `handleSelectPhoto()`: Abre selector de fotos
-   `addWitness()`, `addVictim()`, `addService()`: Gestión de listas

**Validaciones:**

-   Campos obligatorios: callTime, departureTime, returnTime, address, type
-   Formato de hora válido
-   Al menos una nota de campo o foto

### InterventionDetailScreen

**Ruta**: `InterventionDetail`

**Parámetros de Navegación:**

-   `id` (requerido): ID de la intervención a mostrar

**Estado Local:**

-   `intervention`: Datos completos de la intervención
-   `loading`: Estado de carga

**Funciones Principales:**

-   `loadIntervention()`: Carga datos desde la BD
-   `handleGenerateReport()`: Inicia generación de informe con IA
-   `handleDelete()`: Elimina la intervención con confirmación
-   `handleExportPDF()`: Exporta informe a PDF
-   `handleShare()`: Comparte el informe

**Navegación:**

-   A `InterventionForm`: Para editar (pasa el ID)
-   A `ReportScreen`: Para visualizar informe generado

### ReportScreen

**Ruta**: `Report`

**Parámetros de Navegación:**

-   `interventionId` (requerido): ID de la intervención
-   `report` (opcional): Texto del informe

**Funciones Principales:**

-   `handleExportPDF()`: Genera y guarda PDF
-   `handleCopyToClipboard()`: Copia texto al portapapeles
-   `handleShare()`: Comparte por otras apps

**Formato de Visualización:**

-   Texto formateado con estilos
-   Secciones claramente diferenciadas
-   Scroll vertical para informes largos

---

## Gestión de Estado

### Context API

La aplicación utiliza Context API de React para gestión de estado global:

**DatabaseContext:**

-   Estado global de intervenciones
-   Operaciones CRUD centralizadas
-   Estado de inicialización de BD

### Estado Local

Cada pantalla mantiene su propio estado local para:

-   Formularios (valores de inputs)
-   UI (estados de carga, modales, acordeones)
-   Datos temporales (búsqueda, filtros)

### Flujo de Datos Unidireccional

```
Usuario Interactúa
      ↓
Evento de UI (onPress, onChange, etc.)
      ↓
Función Handler en Componente
      ↓
Llamada a DatabaseContext
      ↓
Operación en SQLite
      ↓
Actualización del Estado Global
      ↓
Re-render de Componentes
      ↓
UI Actualizada
```

---

## Configuración y Variables de Entorno

### Archivo: `env.js`

```javascript
export const GEMINI_API_KEY = "tu_api_key_aqui";
```

### Obtener API Key de Google Gemini

1. Visita [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Inicia sesión con tu cuenta de Google
3. Crea una nueva API key
4. Copia la clave y pégala en `env.js`

### Configuración de Expo: `app.json`

```json
{
    "expo": {
        "name": "IntervencionesBomberos",
        "slug": "intervenciones-bomberos",
        "version": "1.0.0",
        "orientation": "portrait",
        "icon": "./assets/icon.png",
        "userInterfaceStyle": "light",
        "splash": {
            "image": "./assets/splash.png",
            "resizeMode": "contain",
            "backgroundColor": "#d32f2f"
        },
        "platforms": ["ios", "android"],
        "android": {
            "package": "com.yoezequiel.intervencionbomberos",
            "permissions": [
                "ACCESS_FINE_LOCATION",
                "CAMERA",
                "READ_EXTERNAL_STORAGE",
                "WRITE_EXTERNAL_STORAGE"
            ]
        },
        "ios": {
            "bundleIdentifier": "com.yoezequiel.intervencionbomberos",
            "supportsTablet": true
        }
    }
}
```

### Permisos Requeridos

**Android:**

-   `ACCESS_FINE_LOCATION`: Para captura de coordenadas GPS
-   `CAMERA`: Para tomar fotos
-   `READ_EXTERNAL_STORAGE`: Para seleccionar fotos de galería
-   `WRITE_EXTERNAL_STORAGE`: Para guardar PDFs exportados

**iOS:**

-   Permisos configurados en `Info.plist`
-   Se solicitan automáticamente al usuario cuando son necesarios

---

## Guía de Desarrollo

### Requisitos del Sistema

**Software Necesario:**

-   Node.js 18+ ([descargar](https://nodejs.org/))
-   npm 9+ o yarn 1.22+
-   Git ([descargar](https://git-scm.com/))

**Para Android:**

-   Android Studio ([descargar](https://developer.android.com/studio))
-   JDK 17 o superior
-   Android SDK Platform 33+
-   Android Emulator o dispositivo físico

**Para iOS (solo macOS):**

-   Xcode 14+ ([App Store](https://apps.apple.com/us/app/xcode/id497799835))
-   CocoaPods (`sudo gem install cocoapods`)
-   iOS Simulator o dispositivo físico

### Instalación del Entorno

```bash
# 1. Clonar el repositorio
git clone <url-del-repositorio>
cd Intervenciones

# 2. Instalar dependencias de Node
npm install

# 3. Para iOS: Instalar pods
cd ios && pod install && cd ..

# 4. Configurar variables de entorno
# Editar env.js con tu API key de Gemini
```

### Ejecución en Desarrollo

```bash
# Iniciar Expo Dev Server
npm start

# Ejecutar en Android (requiere emulador o dispositivo)
npm run android

# Ejecutar en iOS (solo macOS, requiere simulador o dispositivo)
npm run ios

# Ejecutar en web (útil para pruebas rápidas de UI)
npm run web
```

### Comandos Útiles

```bash
# Limpiar caché de Metro
npm start -- --clear

# Reinstalar dependencias
rm -rf node_modules && npm install

# Limpiar build de Android
cd android && ./gradlew clean && cd ..

# Limpiar build de iOS
cd ios && xcodebuild clean && cd ..
```

### Estructura de un Nuevo Componente

```javascript
// src/components/MiComponente.js
import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";

const MiComponente = ({ prop1, prop2 }) => {
    return (
        <View style={styles.container}>
            <Text>{prop1}</Text>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        padding: 16,
    },
});

export default MiComponente;
```

### Agregar una Nueva Pantalla

1. **Crear el archivo de la pantalla:**

```javascript
// src/screens/NuevaPantalla.js
import React from "react";
import { View } from "react-native";
import { Text } from "react-native-paper";

const NuevaPantalla = ({ navigation, route }) => {
    return (
        <View>
            <Text>Mi Nueva Pantalla</Text>
        </View>
    );
};

export default NuevaPantalla;
```

2. **Registrar en el navegador (App.js):**

```javascript
import NuevaPantalla from "./src/screens/NuevaPantalla";

// Dentro del Stack.Navigator
<Stack.Screen
    name="NuevaPantalla"
    component={NuevaPantalla}
    options={{ title: "Mi Nueva Pantalla" }}
/>;
```

3. **Navegar a la nueva pantalla:**

```javascript
navigation.navigate("NuevaPantalla", { param1: "valor" });
```

### Modificar el Esquema de la Base de Datos

**IMPORTANTE:** Modificar el esquema requiere migración de datos.

```javascript
// src/utils/databaseInit.js

// Agregar un nuevo campo
await db.execAsync(`
  ALTER TABLE interventions 
  ADD COLUMN nuevoCampo TEXT;
`);

// Crear una nueva tabla
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS nueva_tabla (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    campo1 TEXT,
    campo2 INTEGER
  );
`);
```

**Gestión de Migraciones:**

-   Incrementar versión de BD en un sistema de versioning
-   Implementar migraciones para usuarios existentes
-   Probar exhaustivamente antes de desplegar

### Debugging

**Herramientas:**

-   **Expo Dev Tools**: Interfaz web con logs y herramientas
-   **React Native Debugger**: Standalone debugger
-   **Flipper**: Debugging avanzado para React Native
-   **Chrome DevTools**: Para debugging de JavaScript

**Logs:**

```javascript
console.log("Debug info");
console.error("Error info");
console.warn("Warning");
```

**Debugging de SQLite:**

```javascript
// Activar logs de SQL en desarrollo
if (__DEV__) {
    await db.execAsync("PRAGMA foreign_keys = ON;");
    console.log("SQLite logs enabled");
}
```

---

## Integración con IA

### Google Gemini API

**Biblioteca**: `@google/genai`

**Configuración:**

```javascript
import { GoogleGenerativeAI } from "@google/genai";
import { GEMINI_API_KEY } from "../env";

const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
```

### Generación de Informes

**Proceso:**

1. **Preparar Datos**: Extraer información relevante de la intervención
2. **Crear Prompt**: Estructurar el prompt con instrucciones específicas
3. **Llamar a la API**: Enviar el prompt a Gemini
4. **Procesar Respuesta**: Recibir y formatear el informe generado
5. **Guardar Informe**: Almacenar en la BD

**Ejemplo de Prompt:**

```javascript
const prompt = `
Eres un oficial de bomberos experimentado redactando un informe técnico profesional.

Genera un informe formal de intervención de bomberos basado en los siguientes datos:

DATOS CRONOLÓGICOS:
- Hora del llamado: ${intervention.callTime}
- Hora de salida: ${intervention.departureTime}
- Hora de regreso: ${intervention.returnTime}

UBICACIÓN:
- Dirección: ${intervention.address}

TIPO DE INTERVENCIÓN:
- ${intervention.type}

SERVICIOS INTERVINIENTES:
${intervention.otherServices
    .map((s) => `- ${s.type}: ${s.description}`)
    .join("\n")}

TESTIGOS:
${intervention.witnesses.join(", ")}

VÍCTIMAS:
${intervention.victims.map((v) => `- ${v.name}: ${v.description}`).join("\n")}

NOTAS DE CAMPO:
${intervention.fieldNotes}

Estructura el informe en las siguientes secciones:
1. DATOS GENERALES
2. DESCRIPCIÓN DE LOS HECHOS
3. MEDIOS INTERVINIENTES
4. PERSONAS INVOLUCRADAS
5. APRECIACIÓN Y CONCLUSIONES
6. RECOMENDACIONES

Usa lenguaje técnico, profesional y objetivo. El informe debe ser claro, conciso y completo.
`;
```

**Manejo de Errores:**

-   Sin conexión a internet: Mostrar mensaje apropiado
-   API key inválida: Informar al usuario
-   Error de API: Reintentar o guardar para procesar después

**Costos:**

-   Gemini 1.5 Flash tiene una cuota gratuita generosa
-   Monitorear uso para evitar cargos inesperados
-   Implementar caché de informes para evitar regeneraciones

---

## Compilación y Despliegue

### Build Local (Development)

**Android APK:**

```bash
# Build de desarrollo
cd android
./gradlew assembleDebug

# APK generado en:
# android/app/build/outputs/apk/debug/app-debug.apk
```

**Android Bundle (Release):**

```bash
cd android
./gradlew bundleRelease

# Bundle generado en:
# android/app/build/outputs/bundle/release/app-release.aab
```

### EAS Build (Expo Application Services)

**Requisitos:**

-   Cuenta de Expo
-   EAS CLI instalado (`npm install -g eas-cli`)

**Configuración (`eas.json`):**

```json
{
    "build": {
        "development": {
            "developmentClient": true,
            "distribution": "internal"
        },
        "preview": {
            "distribution": "internal",
            "android": {
                "buildType": "apk"
            }
        },
        "production": {
            "android": {
                "buildType": "app-bundle"
            },
            "ios": {
                "buildConfiguration": "Release"
            }
        }
    }
}
```

**Comandos:**

```bash
# Login en EAS
eas login

# Configurar proyecto
eas build:configure

# Build para Android (APK de prueba)
eas build --platform android --profile preview

# Build de producción
eas build --platform android --profile production

# Build para iOS (requiere cuenta de Apple Developer)
eas build --platform ios --profile production
```

### Publicación en Stores

**Google Play Store:**

1. Crear cuenta de desarrollador ($25 único)
2. Generar signed bundle: `eas build --platform android --profile production`
3. Crear aplicación en Google Play Console
4. Subir el .aab generado
5. Completar información de la app (descripción, screenshots, etc.)
6. Enviar a revisión

**Apple App Store:**

1. Cuenta de Apple Developer ($99/año)
2. Configurar certificados y provisioning profiles
3. Build con EAS: `eas build --platform ios --profile production`
4. Subir a App Store Connect
5. Completar información de la app
6. Enviar a revisión

### Over-the-Air (OTA) Updates

Expo permite actualizar la app sin pasar por las stores para cambios de JavaScript:

```bash
# Publicar actualización
eas update --branch production --message "Corrección de bugs"
```

**Limitaciones:**

-   Solo funciona para código JavaScript/React
-   No funciona para cambios nativos (código Kotlin/Swift, dependencias nativas)

---

## Solución de Problemas

### Problemas Comunes

#### 1. Error al inicializar la base de datos

**Síntoma:** La app muestra error al iniciar o no carga intervenciones.

**Solución:**

```bash
# Opción 1: Limpiar caché
npm start -- --clear

# Opción 2: Eliminar BD en el emulador (solo desarrollo)
# Android: Desinstalar y reinstalar la app
# iOS: Borrar y reinstalar la app

# Opción 3: Verificar logs
# Revisar consola para errores específicos
```

#### 2. "No such table: interventions"

**Causa:** La tabla no se creó correctamente.

**Solución:**

-   Verificar que `DatabaseContext` se está inicializando correctamente
-   Revisar logs de creación de tabla
-   En desarrollo, forzar recreación de BD

#### 3. Fotos no se muestran

**Causa:** Permisos no otorgados o URI inválida.

**Solución:**

```javascript
// Verificar permisos
import * as ImagePicker from "react-native-image-picker";

const checkPermissions = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
        alert("Se necesitan permisos para acceder a la galería");
    }
};
```

#### 4. Error de red al generar informe

**Síntoma:** "Network request failed" al intentar generar informe.

**Solución:**

-   Verificar conexión a internet
-   Verificar que la API key de Gemini sea válida
-   Revisar si hay restricciones de firewall
-   Verificar límites de cuota de la API

#### 5. App crashea al abrir formulario

**Causa:** Probable error en ErrorBoundary o componente.

**Solución:**

-   Revisar logs detallados en consola
-   Verificar que todos los estados iniciales estén correctamente definidos
-   Usar React DevTools para inspeccionar árbol de componentes

#### 6. Build de Android falla

**Síntoma:** Error al ejecutar `./gradlew`

**Solución:**

```bash
# Limpiar y reconstruir
cd android
./gradlew clean
cd ..
npm start -- --clear

# Verificar versión de Java
java -version  # Debe ser JDK 17+

# Actualizar Gradle wrapper
cd android
./gradlew wrapper --gradle-version 8.0
cd ..
```

#### 7. Problemas con CocoaPods (iOS)

**Solución:**

```bash
cd ios
pod deintegrate
pod install
cd ..
```

### Logs y Debugging

**Ver logs de Android:**

```bash
adb logcat
```

**Ver logs de iOS:**

```bash
# En Xcode: Window > Devices and Simulators > Seleccionar dispositivo > Ver logs
```

**Expo Logs:**

-   Se muestran automáticamente en la terminal al ejecutar `npm start`
-   También disponibles en Expo Dev Tools (navegador web)

### Contacto de Soporte

Para problemas no resueltos con esta documentación:

-   Revisar issues del repositorio
-   Consultar documentación oficial de [Expo](https://docs.expo.dev/)
-   Consultar documentación de [React Native](https://reactnative.dev/)

---

## Apéndice

### Tipos de Intervención

```javascript
export const InterventionType = {
    INCENDIO_ESTRUCTURAL: "Incendio Estructural",
    INCENDIO_FORESTAL: "Incendio Forestal",
    ACCIDENTE_TRANSITO: "Accidente de Tránsito",
    RESCATE: "Rescate",
    ALARMA_FALSA: "Alarma Falsa",
    SERVICIO_ESPECIAL: "Servicio Especial",
    OTRO: "Otro",
};
```

### Tipos de Servicios

```javascript
export const ServiceType = {
    POLICIA: "Policía",
    AMBULANCIA: "Ambulancia",
    GRUA: "Grúa",
    ELECTRICIDAD: "Electricidad",
    GAS: "Gas",
    AGUA: "Agua",
    DEFENSA_CIVIL: "Defensa Civil",
    OTRO: "Otro",
};
```

### Colores del Tema

```javascript
export const firefighterTheme = {
    colors: {
        primary: "#d32f2f", // Rojo bomberos
        primaryContainer: "#ffcdd2", // Rojo claro
        secondary: "#FFC107", // Amarillo seguridad
        secondaryContainer: "#FFF8E1", // Amarillo claro
        tertiary: "#212121", // Negro equipamiento
        error: "#b71c1c", // Rojo oscuro
        background: "#FFFFFF", // Blanco
        surface: "#FFFFFF", // Blanco
    },
};
```

### Glosario

-   **APK**: Android Package - Archivo instalable de Android
-   **AAB**: Android App Bundle - Formato moderno de distribución de Android
-   **EAS**: Expo Application Services - Servicios de build y deploy de Expo
-   **FAB**: Floating Action Button - Botón de acción flotante
-   **OTA**: Over-The-Air - Actualización sin pasar por stores
-   **SQLite**: Sistema de gestión de base de datos relacional embebida
-   **CRUD**: Create, Read, Update, Delete - Operaciones básicas de BD

---

**Documento creado**: Enero 2026  
**Versión de la app**: 1.0.0  
**Última actualización**: 13 de enero de 2026
