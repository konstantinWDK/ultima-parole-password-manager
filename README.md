# 🔐 Ultima Parole

**Ultima Parole** es un gestor de contraseñas privado, ligero y seguro, diseñado con una estética SaaS minimalista. Funciona bajo el principio de **Zero-Knowledge**, lo que significa que tus datos nunca salen de tu dispositivo en formato legible, incluso cuando se guardan en el servidor.

## 🚀 Características

- **Cifrado Local**: Todo se cifra y descifra en tu dispositivo utilizando AES-256.
- **Persistencia en Servidor**: Los datos se sincronizan con un backend persistente en Docker, evitando la pérdida de datos si se borra el caché del navegador.
- **URL de Acceso**: Guarda los enlaces directos a tus servicios para un acceso rápido.
- **Edición de Entradas**: Modifica fácilmente el nombre, usuario, URL o proyecto de tus contraseñas existentes.
- **Categorización por Proyectos**: Organiza tus credenciales en grupos colapsables.
- **Generador de Contraseñas**: Crea claves fuertes con un solo clic.
- **Portabilidad**: Exporta e importa tu baúl en archivos `.updb` cifrados.
- **Docker Ready**: Despliegue con un solo comando gracias a Docker Compose.

## 🛡️ Seguridad y Arquitectura

La seguridad de Ultima Parole se basa en estándares criptográficos de grado militar:

1.  **Derivación de Clave (PBKDF2)**: Tu "Contraseña Maestra" se procesa mediante PBKDF2 con 10,000 iteraciones para generar la clave de cifrado.
2.  **Cifrado AES-256-CBC**: Los datos se cifran localmente. El servidor solo recibe y almacena bloques cifrados ilegibles.
3.  **Arquitectura de Sincronización**: Al iniciar sesión, la aplicación busca la última versión en el servidor y la sincroniza con el `localStorage`. Cualquier cambio se guarda de forma transparente en ambos lugares.

## 🛠️ Instalación y Uso

### Despliegue con Docker (Producción)

Asegúrate de tener Docker y Docker Compose instalados. Luego, ejecuta:

```bash
sudo docker compose up -d --build
```

La aplicación web estará disponible en el puerto `3020`. El backend de persistencia corre internamente en el puerto `3021` y guarda la información en `./server/data`.

### Desarrollo Local

1.  **Frontend**:
    ```bash
    npm install
    npm run dev
    ```
2.  **Backend**:
    ```bash
    cd server
    npm install
    node index.js
    ```

---
Creado por **Antigravity** para **Konstantinwdk**.
