# 🔐 Ultima Parole

**Ultima Parole** es un gestor de contraseñas privado, ligero y seguro, diseñado con una estética SaaS minimalista. Funciona bajo el principio de **Zero-Knowledge**, lo que significa que tus datos nunca salen de tu navegador en formato legible.

## 🚀 Características

- **Cifrado Local**: Todo se cifra y descifra en tu dispositivo.
- **Categorización por Proyectos**: Organiza tus credenciales en grupos colapsables.
- **Sugerencias Inteligentes**: Reutiliza etiquetas de proyectos existentes.
- **Generador de Contraseñas**: Crea claves fuertes con un solo clic.
- **Portabilidad**: Exporta e importa tu baúl en archivos `.updb` cifrados.
- **Docker Ready**: Despliegue inmediato con un solo comando.

## 🛡️ Seguridad y Cifrado

La seguridad de Ultima Parole se basa en estándares criptográficos de grado militar:

1.  **Derivación de Clave (PBKDF2)**: Tu "Contraseña Maestra" no se usa directamente. Se pasa por un algoritmo de derivación (PBKDF2) con un *salt* aleatorio y 10,000 iteraciones para generar una clave de 256 bits. Esto protege contra ataques de fuerza bruta.
2.  **Cifrado AES-256-CBC**: Los datos se cifran utilizando el estándar **AES-256** en modo **CBC** (Cipher Block Chaining). Cada operación de cifrado utiliza un Vector de Inicialización (IV) único.
3.  **Almacenamiento Local**: El baúl cifrado se guarda en el `localStorage` del navegador. Sin tu clave maestra, los datos son solo ruido aleatorio.

## 🛠️ Instalación y Uso

### Requisitos
- Docker y Docker Compose (opcional para producción)
- Node.js & npm (opcional para desarrollo)

### Despliegue Rápido (Producción)
Si estás en el servidor, simplemente ejecuta:
```bash
./deploy.sh
```
La aplicación estará disponible en `http://localhost:3020`.

### Desarrollo Local
```bash
npm install
npm run dev -- --host
```

---
Creado por **Antigravity** para **Konstantinwdk**.
