# 📱 Aplicación de Registro de Intervenciones - Bomberos

Una aplicación móvil offline desarrollada con Expo para registrar intervenciones de bomberos y generar informes automáticos con IA.

## 🎯 Características Principales

- ✅ **100% Offline**: Funciona sin conexión a internet
- 📊 **Base de datos local**: SQLite embebida
- 🤖 **IA para informes**: Generación automática con Gemini Flash 2.0
- 📍 **GPS integrado**: Captura de coordenadas automática
- 📷 **Multimedia**: Soporte para fotos y notas de voz
- 📄 **Exportación PDF**: Informes listos para compartir
- 🔒 **Sin autenticación**: Acceso directo sin contraseñas

## 🚀 Instalación y Configuración

### Prerrequisitos
- Node.js (versión 18 o superior)
- Expo CLI
- Android Studio (para Android) o Xcode (para iOS)

### Pasos de instalación

1. **Clonar e instalar dependencias:**
```bash
cd IntervencionBomberos
npm install
```

2. **Ejecutar la aplicación:**
```bash
# Para desarrollo
npm start

# Para Android
npm run android

# Para iOS
npm run ios

# Para web
npm run web
```

## 📋 Funcionalidades Detalladas

### 1. Lista de Intervenciones
- Visualización de todas las intervenciones registradas
- Filtros por fecha y tipo de intervención
- Búsqueda por dirección o notas
- Acceso rápido a detalles

### 2. Formulario de Nueva Intervención

#### Datos Cronológicos
- Hora del llamado
- Hora de salida
- Hora de regreso al cuartel
- Botones "Ahora" para captura automática

#### Ubicación
- Dirección o punto de referencia
- Captura automática de coordenadas GPS
- Almacenamiento offline de ubicación

#### Medios Intervinientes
- **Bomberos**: Móvil, conductor, jefe de dotación
- **Policía**: Cantidad de móviles, IDs, personal
- **Ambulancias**: Cantidad, identificación, personal
- **Otros servicios**: Grúas, electricidad, gas, etc.

#### Personas Involucradas
- **Testigos**: Lista de nombres
- **Víctimas**: Nombres y descripciones detalladas

#### Clasificación
- Incendio estructural
- Incendio forestal
- Accidente de tránsito
- Rescate
- Alarma falsa
- Otro

### 3. Notas de Campo
- Campo de texto libre para descripción
- Adjuntar fotos desde galería o cámara
- Soporte para notas de voz (futuro)
- Croquis y dibujos (futuro)

### 4. Generación de Informes con IA
- Procesamiento automático de datos estructurados
- Generación de informe técnico profesional
- Estructura estándar: cronología, descripción, medios, apreciación
- Solo requiere internet para generación (datos se mantienen offline)

### 5. Exportación y Compartir
- Exportación a PDF con formato profesional
- Compartir por WhatsApp, email, Drive
- Copia de texto al portapapeles
- Almacenamiento local de informes

## 🗄️ Estructura de la Base de Datos

La aplicación utiliza SQLite con la siguiente estructura:

```sql
CREATE TABLE interventions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  callTime TEXT NOT NULL,
  departureTime TEXT NOT NULL,
  returnTime TEXT NOT NULL,
  address TEXT NOT NULL,
  coordinates TEXT, -- JSON: {latitude, longitude}
  type TEXT NOT NULL,
  firetruckId TEXT NOT NULL,
  driver TEXT NOT NULL,
  chief TEXT NOT NULL,
  policeUnits INTEGER DEFAULT 0,
  policeIds TEXT,
  policeOfficer TEXT,
  ambulanceUnits INTEGER DEFAULT 0,
  ambulanceIds TEXT,
  ambulancePersonnel TEXT,
  otherServices TEXT,
  otherCompany TEXT,
  otherOperator TEXT,
  witnesses TEXT, -- JSON array
  victims TEXT, -- JSON array
  fieldNotes TEXT,
  photos TEXT, -- JSON array
  audioNotes TEXT, -- JSON array
  sketches TEXT, -- JSON array
  report TEXT,
  createdAt TEXT NOT NULL,
  updatedAt TEXT NOT NULL
);
```

## 🔧 Configuración de IA

Para habilitar la generación automática de informes, configura tu API key de Gemini:

1. Obtén una API key de Google AI Studio
2. Agrega la configuración en tu entorno
3. La app se conectará solo para generar informes

## 📱 Uso de la Aplicación

### Crear Nueva Intervención
1. Presiona el botón "+" en la pantalla principal
2. Completa los campos obligatorios (marcados con *)
3. Usa los botones "Ahora" para timestamps automáticos
4. Captura GPS si está disponible
5. Agrega testigos y víctimas según corresponda
6. Escribe notas detalladas de campo
7. Adjunta fotos si es necesario
8. Guarda la intervención

### Generar Informe
1. Abre el detalle de una intervención
2. Presiona "Generar Informe con IA"
3. Espera el procesamiento (requiere internet)
4. Revisa el informe generado
5. Exporta como PDF o comparte

### Gestionar Intervenciones
- Filtra por tipo usando los chips superiores
- Busca por dirección o contenido
- Toca una intervención para ver detalles
- Elimina intervenciones desde el detalle

## 🔒 Privacidad y Seguridad

- **Sin autenticación**: Acceso directo sin contraseñas
- **Datos locales**: Toda la información se almacena en el dispositivo
- **Sin sincronización**: No hay respaldo automático en la nube
- **Uso puntual de IA**: Solo se conecta para generar informes
- **Sin cuentas**: No requiere registro de usuario

## 🛠️ Tecnologías Utilizadas

- **Expo**: Framework de desarrollo
- **React Native**: UI multiplataforma
- **TypeScript**: Tipado estático
- **SQLite**: Base de datos local
- **React Navigation**: Navegación entre pantallas
- **React Native Paper**: Componentes Material Design
- **Expo Location**: Servicios de geolocalización
- **Expo Image Picker**: Captura de fotos
- **Expo Print**: Generación de PDFs
- **Expo Sharing**: Compartir archivos

## 📄 Licencia

Este proyecto está desarrollado para uso interno del Cuerpo de Bomberos.

## 🤝 Soporte

Para soporte técnico o reportar problemas, contacta al equipo de desarrollo.

---

**Versión**: 1.0.0  
**Última actualización**: Enero 2025