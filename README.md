# App de Alquiler Temporario - Villa Gesell

Aplicación web completa para gestionar un departamento en alquiler. 
Funciona con HTML/CSS/JS puro y Firebase como backend serverless. Lista para publicar en GitHub Pages.

## Arquitectura
- `index.html`: Página pública para huéspedes.
- `admin.html`: Panel de control privado.
- `src/`: Lógica, estilos y conexión a Firebase.

## Instrucciones de Configuración (Firebase)

1. **Crear Proyecto en Firebase:**
   - Ve a [Firebase Console](https://console.firebase.google.com/).
   - Crea un proyecto nuevo.
   - Habilita **Authentication** (Email/Password).
   - Habilita **Firestore Database**.
   - Habilita **Storage**.

2. **Crear el usuario Administrador:**
   - En Firebase Authentication, ve a la pestaña "Users" y haz click en "Add user".
   - Crea un correo (ej: admin@departamento.com) y una contraseña. Con estos datos iniciarás sesión en `/admin.html`.

3. **Configurar Credenciales:**
   - En Firebase, ve a Configuración del Proyecto > General.
   - Crea una App Web (`</>`).
   - Copia el objeto `firebaseConfig`.
   - Pega ese objeto en el archivo `src/js/firebase-config.js`.

4. **Reglas de Seguridad:**
   - Ve a Firestore > Rules y pega el contenido del archivo `firestore.rules`.
   - Ve a Storage > Rules y pega el contenido del archivo `storage.rules`.

5. **Datos Iniciales (Firestore):**
   Crea una colección llamada `properties`. Dentro, crea un documento con el ID `villa-gesell`.
   Agrega los siguientes campos al documento:
   - `title` (string): Departamento en Villa Gesell
   - `published` (boolean): true
   - `pricePerNight` (number): 60
   - `whatsapp` (string): 5491100000000 (Tu número con código de país)
   - `description` (string): Descripción de prueba.

## Publicación en GitHub Pages
1. Sube todos estos archivos a un repositorio público (o privado, si tienes Github Pro) en GitHub.
2. Ve a los **Settings** del repositorio > **Pages**.
3. En **Source**, selecciona `main` o `master` branch y guarda.
4. GitHub te proporcionará una URL pública (ej. `https://tu-usuario.github.io/tu-repo/`).
5. La página pública estará en esa URL. El panel administrador estará en `https://tu-usuario.github.io/tu-repo/admin.html`.
