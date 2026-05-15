# 🌍 Pasaporte Turístico — Digital Stamp Passport

Una web app progresiva (PWA) que funciona como pasaporte digital con sellos QR.  
Los usuarios se registran, abren su pasaporte animado y coleccionan sellos escaneando QR en cada lugar.

---

## ✨ Características

- 📖 Pasaporte animado que se abre como libro
- 📷 Escáner QR integrado (usa la cámara del celular)
- 🔴 12 sellos coleccionables con animación tipo estampilla
- 💾 Datos guardados localmente (sin necesidad de backend)
- 📱 Funciona como app en el celular (PWA)
- 🖨️ Página para generar e imprimir los QR de cada lugar

---

## 📁 Estructura del proyecto

```
passport-app/
├── index.html          # App principal (registro + pasaporte + escáner)
├── qr-generator.html   # Página para generar QR de cada sello (organizador)
├── manifest.json       # Configuración PWA
├── css/
│   └── style.css       # Estilos completos (tema vintage de pasaporte)
└── js/
    ├── stamps.js       # ✏️  AQUÍ editas los 12 sellos (nombre, emoji, color)
    └── app.js          # Lógica: registro, pasaporte, QR, modales
```

---

## 🚀 Cómo publicar gratis

### Opción 1: GitHub Pages (recomendado)

1. Crea un repositorio en [github.com](https://github.com)
2. Sube todos los archivos
3. Ve a **Settings → Pages → Source: main / root**
4. Tu app estará en `https://TU_USUARIO.github.io/NOMBRE_REPO/`

### Opción 2: Vercel

1. Ve a [vercel.com](https://vercel.com) y conecta tu GitHub
2. Importa el repositorio → deploy automático
3. URL gratis: `https://NOMBRE.vercel.app`

---

## ✏️ Cómo personalizar los sellos

Edita el archivo `js/stamps.js`. Cada sello tiene:

```js
{
  id: "s01",           // ← ID único (debe coincidir con el QR)
  name: "Museo Nacional",
  emoji: "🏛️",
  description: "Arte e historia de nuestra nación",
  color: "#7c4f1e",   // Color del texto/borde del sello
  bg: "#f5e6d0",      // Color de fondo del sello
}
```

---

## 🖨️ Cómo usar los QR

1. Abre `qr-generator.html` en un navegador
2. Verás los 12 QR generados automáticamente
3. Haz clic en **Imprimir** para imprimir todos
4. Coloca cada QR impreso en su lugar correspondiente

**El QR simplemente contiene el ID del sello** (ej: `s01`, `s02`, etc.)  
Puedes crear tus propios QR con cualquier generador gratuito usando ese ID.

---

## 🔧 Desarrollo local

No necesitas instalar nada. Usa la extensión **Live Server** en VS Code,  
o abre `index.html` directamente en tu navegador.

> ⚠️ Para el escáner QR necesitas HTTPS (GitHub Pages o Vercel lo proveen automáticamente).

---

## 🗺️ Roadmap futuro

- [ ] Backend con Firebase para sincronizar sellos entre dispositivos
- [ ] Tabla de líderes / ranking de exploradores
- [ ] Compartir pasaporte en redes sociales
- [ ] Sellos especiales con animaciones únicas
- [ ] Admin panel para ver estadísticas

---

Hecho con ❤️ — fácilmente personalizable para cualquier evento, ruta o festival.
