# Backend image synchronization v16

Patch sanitizado aplicado al backend local para sincronizar categorias, agencias,
avatares y ofertas con archivos almacenados en el frontend.

La descarga usa multiples fuentes por asset. Si todas fallan, reutiliza el
archivo local anterior y solo genera una pieza local especifica como ultimo recurso.
Sharp procesa en memoria y el staging usa una carpeta temporal unica fuera de public.
V16 conserva la copia corregida, reutiliza los assets locales validados,
aísla backend-patches y ejecuta las pruebas React en entorno jsdom con
document, window y localStorage disponibles.

No contiene .env, contrasenas, hashes, bases de datos ni credenciales.

Las fuentes externas y hashes de los archivos descargados quedan documentados en:
public/assets/image-manifest.json.
