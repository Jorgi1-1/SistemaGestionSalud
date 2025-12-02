# 🏥 Sistema de Gestión de Salud Universitaria (U-Health)

Plataforma integral para la gestión de servicios de salud en el campus universitario. Permite a estudiantes agendar citas médicas, y a los doctores gestionar su agenda y expedientes clínicos, todo bajo un estricto control de privacidad y auditoría.

---

## 🔬 Características y Logros Técnicos

El sistema fue desarrollado bajo una arquitectura MERN y cumple con los siguientes requisitos de alto nivel:

1.  **Seguridad & Roles (RBAC/JWT):** Control de acceso por rol (Admin, Doctor, Estudiante) a todos los endpoints de la API.
2.  **Agendamiento Concurrente:** Validaciones atómicas para prevenir el *double-booking* y control de la regla de "Máx 1 cita activa por día" por estudiante.
3.  **Expediente Inmutable:** Registro de notas clínicas (*Encounters*) con diagnóstico obligatorio y garantía de inmutabilidad una vez guardado.
4.  **Resiliencia de Notificaciones:** Sistema de *Workers* asíncronos que gestiona la cola de correos (T-24h/T-2h) con lógica de **Backoff Exponencial** y manejo de **Dead Letter Queue (DLQ)**.
5.  **Trazabilidad:** Middleware de Auditoría que registra Login, Logout y todas las acciones críticas.
6.  **UX/Diseño:** Frontend en React/Tailwind con identidad visual institucional (paleta UDLAP/SQEW) y componentes avanzados (Custom Calendar, Time Slot Modal con disponibilidad visual).

---

## 🛠️ Stack Tecnológico

| Componente | Tecnología |
| :--- | :--- |
| **Backend API** | Node.js, Express |
| **Persistencia** | MongoDB Atlas (Mongoose) |
| **Seguridad** | JWT, bcryptjs, RBAC |
| **Asíncrono** | Nodemailer (SMTP), Node-cron (Workers) |
| **Frontend UI** | React, Vite, Tailwind CSS |

---

## ⚙️ Configuración e Instalación

### 1. Requisitos
* Node.js v18+ (o superior)
* Git
* Cuenta en MongoDB Atlas
* Servidor SMTP (Gmail App Password, Mailtrap o Mailersend)

### 2. Inicializar Proyecto y Dependencias

```bash
# 1. Clonar el repositorio (Asumimos que ya estás en la carpeta raíz)
git clone <repo_url>
cd university-health-system

# 2. Instalar dependencias del Backend
cd server
npm install

# 3. Instalar dependencias del Frontend
cd ../client
npm install
```

### 3. Archivo de Variables de Entorno
Cree el archivo .env en la carpeta server/ con las siguientes variables:
```bash
PORT=5000
MONGO_URI=tu_mongodb_connection_string
JWT_SECRET=tu_secreto_senior_super_seguro
```
---
# Configuración SMTP (Para Notificaciones)
```bash
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=tu_correo_sender@gmail.com
SMTP_PASS=tu_password_de_aplicacion
SMTP_FROM="U Health System <no-reply@uhealth.edu>"
CLIENT_URL=http://localhost:5173
```
---

### ▶️ Scripts de Ejecución y Mantenimiento
Todos los scripts deben ejecutarse desde la carpeta server.

| Comando	| Descripción | 
| :--- | :--- |
| ```npm run dev``` |	Inicia el servidor de Express y el Worker Cron en modo desarrollo (nodemon).|
| ```npm run seed``` |	Popula la base de datos con usuarios (Admin, Doctor, Estudiante) y datos iniciales de prueba.|
| ```npm run clean``` |	Limpia la base de datos. Elimina todas las citas, logs y notas clínicas, manteniendo los usuarios y expedientes básicos. (Ideal antes de la demo).|
| ```npm run send-emails```	| Ejecuta el Worker de notificaciones manualmente para procesar la cola de envíos pendientes (\textbf{Uso para testing instantáneo}).|

---

# Credenciales de Prueba (Post-Seed)

* Admin: admin@u.edu / adminpassword

* Médico: dr.house@u.edu / password123

* Estudiante: peter.parker@u.edu / password123

---

🚀 Puesta en Marcha
Abrir Terminal 1 y ejecutar 
```bash
npm run dev 
```
en server.

Abrir Terminal 2 y ejecutar 
```bash
npm run dev
```
en client.
