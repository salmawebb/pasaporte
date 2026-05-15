// app.js — Lógica principal del Pasaporte Turístico

// ── Estado global ──────────────────────────────────────────────
let user = null;           // { name, avatar, serial, stamps: [id,...] }
let qrScanner = null;
let passportOpen = false;

// ── Utils ──────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const show = id => $(`screen-${id}`).classList.add('active');
const hide = id => $(`screen-${id}`).classList.remove('active');

function saveUser() {
  localStorage.setItem('passport_user', JSON.stringify(user));
}

function loadUser() {
  const raw = localStorage.getItem('passport_user');
  return raw ? JSON.parse(raw) : null;
}

function genSerial() {
  return 'PT-' + Math.floor(100000 + Math.random() * 900000);
}

function today() {
  return new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── PANTALLA: Registro ─────────────────────────────────────────
let selectedAvatar = '🧭';

document.querySelectorAll('.av').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.av').forEach(b => b.classList.remove('selected'));
    btn.classList.add('selected');
    selectedAvatar = btn.dataset.av;
  });
});

$('btn-register').addEventListener('click', () => {
  const name = $('input-name').value.trim();
  if (!name) {
    $('input-name').classList.add('shake');
    setTimeout(() => $('input-name').classList.remove('shake'), 500);
    return;
  }
  user = { name, avatar: selectedAvatar, serial: genSerial(), stamps: [] };
  saveUser();
  initPassport();
  hide('register');
  show('passport');
});

// ── PANTALLA: Pasaporte ────────────────────────────────────────
function initPassport() {
  $('traveler-avatar').textContent = user.avatar;
  $('traveler-name').textContent = user.name;
  $('page-serial').textContent = user.serial;
  buildStampGrid();
  updateProgress();
}

function buildStampGrid() {
  const grid = $('stamps-grid');
  grid.innerHTML = '';
  STAMPS_DATA.forEach(stamp => {
    const earned = user.stamps.includes(stamp.id);
    const slot = document.createElement('div');
    slot.className = `stamp-slot ${earned ? 'earned' : 'empty'}`;
    slot.id = `slot-${stamp.id}`;
    if (earned) {
      slot.style.setProperty('--stamp-bg', stamp.bg);
      slot.style.setProperty('--stamp-color', stamp.color);
      slot.innerHTML = `
        <div class="stamp-seal">
          <div class="stamp-emoji-sm">${stamp.emoji}</div>
          <div class="stamp-name-sm">${stamp.name}</div>
        </div>`;
    } else {
      slot.innerHTML = `<span class="slot-num">${STAMPS_DATA.indexOf(stamp) + 1}</span>`;
    }
    grid.appendChild(slot);
  });
}

function updateProgress() {
  const count = user.stamps.length;
  const pct = Math.round((count / 12) * 100);
  $('stamp-count').textContent = `${count} / 12`;
  $('progress-fill').style.width = pct + '%';
  $('progress-pct').textContent = pct + '%';
}

// Abrir/cerrar pasaporte al tocar cubierta
$('passport-cover').addEventListener('click', () => {
  passportOpen = !passportOpen;
  const book = $('passport-book');
  if (passportOpen) {
    book.classList.add('open');
  } else {
    book.classList.remove('open');
  }
});

$('btn-logout').addEventListener('click', () => {
  if (confirm('¿Cerrar sesión? Tu progreso se guardará.')) {
    hide('passport');
    show('register');
  }
});

// ── ESCÁNER QR ────────────────────────────────────────────────
$('btn-scan').addEventListener('click', () => {
  hide('passport');
  show('scanner');
  startScanner();
});

$('btn-close-scanner').addEventListener('click', () => {
  stopScanner();
  hide('scanner');
  show('passport');
});

function startScanner() {
  if (qrScanner) return;
  qrScanner = new Html5Qrcode("qr-reader");
  qrScanner.start(
    { facingMode: "environment" },
    { fps: 10, qrbox: { width: 220, height: 220 } },
    onQRSuccess,
    () => {}
  ).catch(err => {
    console.error("Error de cámara:", err);
    alert("No se pudo acceder a la cámara. Verifica los permisos.");
    stopScanner();
    hide('scanner');
    show('passport');
  });
}

function stopScanner() {
  if (qrScanner) {
    qrScanner.stop().then(() => {
      qrScanner.clear();
      qrScanner = null;
    }).catch(() => { qrScanner = null; });
  }
}

function onQRSuccess(text) {
  stopScanner();
  hide('scanner');

  // Buscar el sello por ID en el QR
  const stamp = STAMPS_DATA.find(s => s.id === text.trim());
  if (!stamp) {
    alert(`Código QR no reconocido:\n"${text}"\n\nAsegúrate de escanear un QR válido del pasaporte.`);
    show('passport');
    return;
  }

  if (user.stamps.includes(stamp.id)) {
    showDuplicate();
    return;
  }

  // Agregar sello
  user.stamps.push(stamp.id);
  saveUser();
  buildStampGrid();
  updateProgress();
  showStampModal(stamp);
}

// ── MODAL: Sello obtenido ──────────────────────────────────────
function showStampModal(stamp) {
  $('modal-emoji').textContent = stamp.emoji;
  $('modal-place-name').textContent = stamp.name;
  $('modal-date').textContent = today();
  $('modal-title').textContent = '¡Sello obtenido!';
  $('modal-desc').textContent = stamp.description;
  $('modal-stamp-inner').style.setProperty('--stamp-bg', stamp.bg);
  $('modal-stamp-inner').style.setProperty('--stamp-color', stamp.color);

  const modal = $('modal-stamp');
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.add('show'), 10);
  setTimeout(() => $('stamp-anim').classList.add('stamping'), 100);
}

$('btn-modal-close').addEventListener('click', () => {
  const modal = $('modal-stamp');
  modal.classList.remove('show');
  $('stamp-anim').classList.remove('stamping');
  setTimeout(() => modal.classList.add('hidden'), 300);
  show('passport');
  // Abrir pasaporte en sellos automáticamente
  if (!passportOpen) {
    passportOpen = true;
    $('passport-book').classList.add('open');
  }
});

// ── MODAL: Duplicado ───────────────────────────────────────────
function showDuplicate() {
  const modal = $('modal-duplicate');
  modal.classList.remove('hidden');
  setTimeout(() => modal.classList.add('show'), 10);
}

$('btn-dup-close').addEventListener('click', () => {
  const modal = $('modal-duplicate');
  modal.classList.remove('show');
  setTimeout(() => modal.classList.add('hidden'), 300);
  show('passport');
});

// ── INICIO: Verificar sesión ───────────────────────────────────
window.addEventListener('DOMContentLoaded', () => {
  user = loadUser();
  if (user) {
    initPassport();
    hide('register');
    show('passport');
  } else {
    show('register');
  }
});
