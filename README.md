# Kauil Interface — Interfaz de Control para Robot de Rescate

> Interfaz de teleoperación y monitoreo en tiempo real para **Kauil**, un robot de rescate, construida como aplicación de escritorio nativa con **Tauri 2 + React** e integrada con **ROS 2** mediante un puente WebSocket.

<p align="center">
  <img alt="Tauri"      src="https://img.shields.io/badge/Tauri-2-24C8DB?logo=tauri&logoColor=white">
  <img alt="React"      src="https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black">
  <img alt="TypeScript" src="https://img.shields.io/badge/TypeScript-5.8-3178C6?logo=typescript&logoColor=white">
  <img alt="Rust"       src="https://img.shields.io/badge/Rust-Tauri%20backend-000000?logo=rust&logoColor=white">
  <img alt="ROS 2"      src="https://img.shields.io/badge/ROS%202-WebSocket%20bridge-22314E?logo=ros&logoColor=white">
  <img alt="Vite"       src="https://img.shields.io/badge/Vite-7-646CFF?logo=vite&logoColor=white">
  <img alt="TailwindCSS" src="https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss&logoColor=white">
</p>

---

## 📋 Tabla de contenidos

- [Descripción general](#-descripción-general)
- [Características principales](#-características-principales)
- [Stack tecnológico](#-stack-tecnológico)
- [Arquitectura](#-arquitectura)
- [Integración con ROS 2](#-integración-con-ros-2)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Instalación y ejecución](#-instalación-y-ejecución)
- [Vistas de la aplicación](#-vistas-de-la-aplicación)
- [Autores](#-autores)

---

## 🚀 Descripción general

**Kauil Interface** es el puesto de control (*ground control station*) de un robot de rescate.
Desde una sola ventana el operador puede:

- Ver **múltiples cámaras** del robot en vivo (cámara frontal, visión estéreo ZED y feeds procesados por visión por computadora).
- **Teleoperar un brazo robótico** con distintos modos de control (jog cartesiano, trayectorias, control articular) y accionar el gripper.
- **Monitorear sensores del entorno** en tiempo real (temperatura, humedad, gas y campo magnético) con gráficas históricas.
- **Gestionar nodos de visión de ROS 2** (detección de QR y de materiales peligrosos / *hazmat*) mediante el ciclo de vida de nodos administrados de ROS 2.

Toda la comunicación con el robot se realiza en tiempo real sobre **WebSockets**, contra un puente que traduce entre la interfaz y el grafo de ROS 2.

---

## ✨ Características principales

| Módulo | Descripción |
| ------ | ----------- |
| 🎥 **Cámaras** | Panel multi-cámara configurable con hasta 5 streams simultáneos (Raw, QR, Hazmat, ZED izquierda/derecha), indicador de FPS y estado de conexión por stream. |
| 🤖 **Control de brazo** | Modos `idle / joint / jog / trajectory`, jog por retención (*hold-to-move*) en X/Y/Z y pitch, envío de poses objetivo, control de gripper y realimentación de pose en vivo. |
| 🧪 **Sensores** | Tarjetas numéricas con *sparklines* (temperatura, humedad) y tarjetas booleanas animadas (gas, campo magnético), más cámara embebida y tabla de últimas lecturas. |
| 👁️ **Visión estéreo** | Vista de la cámara **ZED** (lentes izquierda y derecha) en la pantalla principal. |
| ⚙️ **Gestión de nodos** | Arranque y parada de los nodos de visión de ROS 2 usando transiciones del ciclo de vida (*configure → activate → deactivate*). |
| 🖥️ **App nativa** | Empaquetada como aplicación de escritorio multiplataforma con Tauri (binario ligero, sin Electron). |

---

## 🛠️ Stack tecnológico

### Frontend
- **React 19** + **TypeScript 5.8** — UI declarativa y tipada.
- **Vite 7** — bundler y servidor de desarrollo con *hot reload*.
- **React Router 7** — navegación entre vistas (Home, Arm, Data, Cameras).
- **Tailwind CSS 4** — estilos utilitarios (integrado vía `@tailwindcss/vite`).
- **Three.js + @react-three/fiber + @react-three/drei** — visualización 3D del brazo robótico (cinemática directa de 4 articulaciones renderizada en `<Canvas>`).
- **Chart.js + react-chartjs-2** — gráficas de series temporales de sensores.
- **lucide-react** — iconografía.

### Backend nativo (escritorio)
- **Tauri 2** (Rust) — capa nativa, ventana de la aplicación y empaquetado. La comunicación Frontend ↔ Rust se realiza vía IPC (`invoke`), y la comunicación con el robot vía WebSocket.
- **serde / serde_json** — serialización en el lado de Rust.

### Comunicación con el robot
- **WebSockets** — canal bidireccional en tiempo real hacia el puente de ROS 2 (`ws://localhost:8000`).

---

## 🏗️ Arquitectura

```
┌──────────────────────────────────────────────────────────┐
│                    Kauil Interface (Tauri)                │
│                                                            │
│   ┌───────────────────────┐      ┌──────────────────────┐ │
│   │   Frontend (React/TS) │◄────►│  Backend nativo (Rust)│ │
│   │   Vistas + WebSockets │ IPC  │       Tauri 2         │ │
│   └───────────┬───────────┘      └──────────────────────┘ │
└───────────────┼──────────────────────────────────────────┘
                │  WebSocket  (ws://localhost:8000)
                ▼
┌──────────────────────────────────────────────────────────┐
│                Puente WebSocket ↔ ROS 2                    │
│   /ws/connection/img/*   /ws/connection/move              │
│   /ws/connection/lab     /ws/connection/lifecycle         │
└───────────────┬──────────────────────────────────────────┘
                │  ROS 2 (topics / services / lifecycle)
                ▼
┌──────────────────────────────────────────────────────────┐
│                      Robot de rescate Kauil               │
│   Cámaras · Cámara estéreo ZED · Brazo · Sensores         │
│   Nodos de visión (QR, Hazmat) · Nodos gestionados        │
└──────────────────────────────────────────────────────────┘
```

La interfaz **no habla ROS 2 directamente** (los navegadores/WebViews no pueden usar DDS). En su lugar, se conecta por WebSocket a un puente que corre junto al robot y que traduce los mensajes JSON de la interfaz hacia *topics*, *services* y transiciones de *lifecycle* de ROS 2, y viceversa.

---

## 🔌 Integración con ROS 2

La comunicación se organiza en **canales WebSocket** independientes, cada uno mapeado a una función del robot. Todos los mensajes viajan como **JSON** con la forma `{ "type": ..., "data": ... }`.

### Canales (endpoints WebSocket)

| Endpoint | Dirección | Propósito |
| -------- | --------- | --------- |
| `/ws/connection/img/raw` | Robot → UI | Cámara frontal sin procesar (frames JPEG en base64). |
| `/ws/connection/img/qr` | Robot → UI | Stream con la detección de códigos **QR** superpuesta. |
| `/ws/connection/img/hazmat` | Robot → UI | Stream con la detección de etiquetas **hazmat**. |
| `/ws/connection/img/zed_left` · `/zed_right` | Robot → UI | Lentes izquierda/derecha de la cámara estéreo **ZED**. |
| `/ws/connection/move` | Bidireccional | Control del brazo y realimentación de pose. |
| `/ws/connection/lab` | Robot → UI | Telemetría de sensores del entorno. |
| `/ws/connection/lifecycle` | Bidireccional | Gestión del ciclo de vida de nodos de ROS 2. |

### 1. Streaming de cámaras

El robot publica imágenes (típicamente desde topics `sensor_msgs/Image` o `CompressedImage`) que el puente reenvía como frames JPEG codificados en base64:

```jsonc
// Robot → UI
{ "data": "<jpeg_base64>" }
```

La interfaz renderiza cada frame en un `<img>` y calcula los FPS del lado del cliente.

### 2. Control del brazo (`/ws/connection/move`)

La interfaz envía comandos de movimiento y recibe la pose actual del efector final:

```jsonc
// UI → Robot
{ "type": "set_mode",   "data": "jog" }                                  // idle | joint | jog | trajectory
{ "type": "jog_mode",   "data": "cartesian" }                            // cartesian | relative
{ "type": "cmd_vel",    "data": { "vx": 0.05, "vy": 0, "vz": 0, "vpitch": 0 } } // twist de jog @ 10 Hz
{ "type": "arm_target", "data": { "x": 0.15, "y": 0.0, "z": 0.35, "pitch": 0.0 } } // pose objetivo (trajectory)
{ "type": "gripper",    "data": 1.0 }                                    // 1 abrir · -1 cerrar · 0 detener

// Robot → UI
{ "type": "pose", "data": { "x": ..., "y": ..., "z": ..., "pitch": ... } } // realimentación de pose en vivo
```

Durante el modo **jog**, los botones de retención (*hold*) publican comandos de velocidad (`cmd_vel`) a **10 Hz** mientras están presionados, lo que se traduce en el puente a un `geometry_msgs/Twist` para el controlador del brazo.

### 3. Sensores (`/ws/connection/lab`)

Telemetría del entorno, útil para tareas de rescate (detección de gas, materiales, etc.):

```jsonc
// Robot → UI
{
  "type": "sensor_data",
  "data": {
    "temperatura": 24.5,   // °C
    "humedad":     60.0,   // %
    "gas":         false,  // detección booleana
    "campo_mag":   false   // detección de campo magnético
  }
}
```

La interfaz mantiene una ventana deslizante de las últimas 60 muestras para graficar el histórico.

### 4. Gestión de nodos con lifecycle (`/ws/connection/lifecycle`)

Los nodos de visión (`qr_lifecycle_node`, `hazmat_detection`) son **nodos gestionados de ROS 2** (*managed / lifecycle nodes*). Desde la interfaz se disparan las transiciones estándar del ciclo de vida sin necesidad de una terminal:

```jsonc
// UI → Robot
{
  "type": "change_state",
  "data": {
    "node": "qr_lifecycle_node",
    "transition_id": 1,          // 1: configure · 3: activate · 4: deactivate
    "transition_label": "configure"
  }
}
```

El botón **"Start QR / Hazmat"** encadena `configure → activate` (con un retardo entre ambas), y **"Stop QR / Hazmat"** ejecuta `deactivate`, aprovechando el ciclo de vida de ROS 2 para arrancar/detener el procesamiento de visión de forma segura y controlada.

---

## 📁 Estructura del proyecto

```
kauil_interface/
├── src/                          # Frontend React + TypeScript
│   ├── main.tsx                  # Entry point + configuración del router
│   ├── layouts/
│   │   └── MainLayout.tsx        # Layout con sidebar + header
│   ├── components/
│   │   ├── Sidebar.tsx           # Navegación lateral
│   │   ├── Header.tsx
│   │   └── Arm3D.tsx             # Visualización 3D del brazo (Three.js / R3F)
│   └── routes/
│       ├── homeScreen.tsx        # Visión estéreo ZED
│       ├── arm.tsx               # Control del brazo + gripper
│       ├── data.tsx              # Dashboard de sensores
│       └── cameras.tsx           # Panel multi-cámara + gestión de nodos
│
├── src-tauri/                    # Backend nativo (Rust / Tauri 2)
│   ├── src/lib.rs                # Comandos de Tauri y setup de la app
│   ├── tauri.conf.json           # Configuración de la app y bundle
│   └── capabilities/default.json # Permisos de seguridad de Tauri
│
├── package.json
└── vite.config.ts
```

---

## ⚙️ Instalación y ejecución

### Requisitos previos
- **Node.js** ≥ 18 y **npm**
- **Rust** (toolchain estable) — [rustup.rs](https://rustup.rs)
- Dependencias de sistema de Tauri para tu plataforma — ver [guía oficial](https://tauri.app/start/prerequisites/)
- Un **puente WebSocket de ROS 2** escuchando en `ws://localhost:8000` (lado del robot) para funcionalidad en vivo.

### Instalar dependencias
```bash
npm install
```

### Desarrollo
```bash
npm run tauri dev     # App de escritorio con hot reload (frontend + ventana nativa)
npm run dev           # Solo el servidor Vite (sin ventana nativa)
```

### Build de producción
```bash
npm run tauri build   # Genera el bundle nativo de la aplicación
npm run build         # Solo type-check de TypeScript + build de Vite
```

### Backend en Rust
```bash
cd src-tauri && cargo check    # Verificar el código Rust
cd src-tauri && cargo clippy   # Linting
```

---

## 🖼️ Vistas de la aplicación

| Vista | Ruta | Contenido |
| ----- | ---- | --------- |
| **Home** | `/` | Visión estéreo ZED (lentes izquierda y derecha). |
| **Arm** | `/arm` | Control del brazo: modos, jog, poses objetivo, gripper y cámara embebida. |
| **Data** | `/data` | Dashboard de sensores con gráficas en vivo y cámara. |
| **Cameras** | `/cameras` | Panel multi-cámara configurable y gestión de nodos de visión. |

---

## 👥 Autores

Este proyecto fue desarrollado por:

- **Leyberth Jaaziel Castillo Guerra** — desarrollo de la interfaz e integración con ROS 2.
- **Eduardo Chávez Martín** — desarrollo e integración.

---

<p align="center">
  <sub>Interfaz de control para el robot de rescate <b>Kauil</b> · construida con Tauri, React y ROS 2.</sub>
</p>
