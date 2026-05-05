# 🔐 Ultima Parole

**Ultima Parole** es un gestor de contraseñas privado, ligero y seguro, diseñado con una estética SaaS minimalista. Funciona bajo el principio de **Zero-Knowledge**, lo que significa que tus datos nunca salen de tu dispositivo en formato legible, incluso cuando se guardan en el servidor.

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

## 🛡️ Seguridad: ¿Por qué es totalmente seguro?

Ultima Parole ha sido diseñado con la privacidad como prioridad absoluta. Es **totalmente seguro** por las siguientes razones:

1.  **Arquitectura Zero-Knowledge**: El servidor **nunca** conoce tu contraseña maestra ni puede ver tus credenciales. Todo el proceso de cifrado y descifrado ocurre exclusivamente en tu navegador.
2.  **Cifrado de Grado Militar (AES-256-GCM/CBC)**: Utilizamos algoritmos estándar de la industria para asegurar que tus datos sean indescifrables sin la clave correcta.
3.  **Derivación Robusta de Claves (PBKDF2)**: Tu contraseña maestra no se usa directamente; se somete a miles de iteraciones de hashing para generar una clave criptográfica fuerte, protegiéndote contra ataques de fuerza bruta.
4.  **Privacidad Total**: Al ser auto-alojado (self-hosted), tú tienes el control total de tus datos. No dependes de empresas externas ni de la nube de terceros.
5.  **Sin Puertas Traseras**: El código es transparente y funciona de forma local en tu infraestructura.

## 🚀 Características

- **Cifrado Local**: Todo se cifra y descifra en tu dispositivo utilizando AES-256.
- **Persistencia en Servidor**: Los datos se sincronizan con un backend persistente en Docker, evitando la pérdida de datos si se borra el caché del navegador.
- **URL de Acceso**: Guarda los enlaces directos a tus servicios para un acceso rápido.
- **Edición de Entradas**: Modifica fácilmente el nombre, usuario, URL o proyecto de tus contraseñas existentes.
- **Categorización por Proyectos**: Organiza tus credenciales en grupos colapsables.
- **Generador de Contraseñas**: Crea claves fuertes con un solo clic.
- **Portabilidad**: Exporta e importa tu baúl en archivos `.updb` cifrados.
- **Docker Ready**: Despliegue con un solo comando gracias a Docker Compose.

## ⚙️ Arquitectura de Sincronización

Al iniciar sesión, la aplicación busca la última versión en el servidor y la sincroniza con el `localStorage`. Cualquier cambio se guarda de forma transparente en ambos lugares, garantizando que siempre tengas acceso a tus claves incluso si cambias de navegador, siempre y cuando el servidor esté activo.
