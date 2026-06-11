// app.js — Lógica principal del Pasaporte Turístico

// ── Estado global ──────────────────────────────────────────────
let user = null;
let qrScanner = null;

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
  return new Date().toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
}

// ── PANTALLA: Registro ─────────────────────────────────────────
let selectedAvatar = '😊';

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
          <img class="stamp-img-sm" src="${stamp.image}" alt="${stamp.name}" />
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
  const pct = Math.round((count / STAMPS_DATA.length) * 100);
  $('stamp-count').textContent = `${count} / ${STAMPS_DATA.length}`;
  $('progress-fill').style.width = pct + '%';
  $('progress-pct').textContent = pct + '%';
}

// Tocar portada fullscreen
$('cover-img-full').addEventListener('click', () => {
  if (!user) {
    hide('cover');
    show('register');
  } else {
    hide('cover');
    show('passport');
  }
});

// Botón ✕: volver a portada
$('btn-logout').addEventListener('click', () => {
  if (confirm('Log out? Your progress will be saved.')) {
    user = null;
    hide('passport');
    show('register');
  } else {
    hide('passport');
    show('cover');
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
    alert("Could not access the camera. Please check your permissions.");
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
    alert(`QR code not recognized:\n"${text}"\n\nMake sure to scan a valid passport QR code.`);
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
  $('modal-emoji').innerHTML = `<img class="stamp-img-lg" src="${stamp.image}" alt="${stamp.name}" />`;
  $('modal-place-name').textContent = stamp.name;
  $('modal-date').textContent = today();
  $('modal-title').textContent = 'Stamp collected!';
  $('modal-desc').textContent = `You visited ${stamp.name}.`;
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
  }
  show('cover');
});
