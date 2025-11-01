<p align="center">
  <a href="https://nestjs.com/" target="_blank">
    <img src="https://nestjs.com/img/logo-small.svg" width="100" alt="NestJS Logo" />
  </a>
</p>

# 🔐 Auth Microservice - CoffeeNow

Microservicio encargado de gestionar la autenticación y el registro de usuarios en CoffeeNow. Utiliza JWT para manejo de sesiones y MongoDB como base de datos.

---

## 🚀 Puesta en marcha (entorno de desarrollo)

### 1. Clonar el repositorio

### 2. Instalar dependencias

```bash
npm install
```

### 3. Configurar variables de entorno

Copia el archivo `.env.template` y renómbralo a `.env`

### 4. Conectarse a la base de datos usando la URL del .env

> Esto levantará un contenedor con MongoDB.

### 5. Ejecutar comandos de Prisma

```bash
npx prisma generate
npx prisma migrate dev
```

### 6. Iniciar el servidor en modo desarrollo

```bash
npm run start:dev
```

## 📥 Endpoints

| Método | Ruta           | Descripción                        |
| ------ | -------------- | ---------------------------------- |
| POST   | /auth/register | Registra un nuevo usuario          |
| POST   | /auth/login    | Inicia sesión y retorna JWT        |
| GET    | /auth/verify   | Verifica el bearer token           |
| GET    | /auth/modules  | Nos muestra los modulos con acceso |

---

## 📂 Estructura

```
src/
 ├── auth/
 │   ├── dto/
 │   ├── strategies/
 │   ├── schemas/
 │   ├── auth.service.ts
 │   ├── auth.controller.ts
 │   └── auth.module.ts
 ├── users/
 └── main.ts
```

---

## 🧪 Tecnologías

- NestJS
- MongoDB
- JWT
- Docker

---

## 📄 Licencia

Este proyecto es desarrollado por el equipo **CoffeeNow** ☕
