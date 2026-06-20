// ── Supabase ───────────────────────────────────────────────────
const sb = supabase.createClient(
  'https://stlewgxxxglzauaesnhl.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN0bGV3Z3h4eGdsemF1YWVzbmhsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5MjI1OTIsImV4cCI6MjA5NzQ5ODU5Mn0.enUY9BJzKBFh_NPXjMcNsVKc_9-Wtua1-AsdZD-eqAo'
);

// ── Estado global ──────────────────────────────────────────────
let currentUser = null;
let userStamps = [];
let qrScanner = null;
let isSignInMode = false;

// ── Utils ──────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const show = id => $(`screen-${id}`).classList.add('active');
const hide = id => $(`screen-${id}`).classList.remove('active');

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

$('btn-toggle-auth').addEventListener('click', e => {
  e.preventDefault();
  isSignInMode = !isSignInMode;
  $('register-only-fields').style.display = isSignInMode ? 'none' : 'block';
  $('btn-register').textContent = isSignInMode ? 'Sign In' : 'Get my Passport';
  $('btn-toggle-auth').textContent = isSignInMode ? 'Create new passport' : 'Sign in';
  $('register-sub').textContent = isSignInMode ? 'Welcome back!' : 'Register your trip · Collect memories';
});

$('btn-register').addEventListener('click', async () => {
  const email = $('input-email').value.trim();
  const password = $('input-password').value.trim();

  if (!email || !password) {
    alert('Please enter your email and password.');
    return;
  }

  $('btn-register').disabled = true;
  $('btn-register').textContent = '...';

  if (isSignInMode) {
    const { data, error } = await sb.auth.signInWithPassword({ email, password });
    if (error) {
      alert(error.message);
      $('btn-register').disabled = false;
      $('btn-register').textContent = 'Sign In';
      return;
    }
    currentUser = data.user;
    await loadAndShowPassport();
  } else {
    const name = $('input-name').value.trim();
    if (!name) {
      $('input-name').classList.add('shake');
      setTimeout(() => $('input-name').classList.remove('shake'), 500);
      $('btn-register').disabled = false;
      $('btn-register').textContent = 'Get my Passport';
      return;
    }
    const serial = 'PT-' + Math.floor(100000 + Math.random() * 900000);
    const { data, error } = await sb.auth.signUp({
      email,
      password,
      options: { data: { name, avatar: selectedAvatar, serial } }
    });
    if (error) {
      alert(error.message);
      $('btn-register').disabled = false;
      $('btn-register').textContent = 'Get my Passport';
      return;
    }
    currentUser = data.user;
    userStamps = [];
    initPassport();
    hide('register');
    show('passport');
  }
});

// ── PANTALLA: Pasaporte ────────────────────────────────────────
async function loadAndShowPassport() {
  const { data } = await sb.from('stamps').select('stamp_id').eq('user_id', currentUser.id);
  userStamps = data ? data.map(s => s.stamp_id) : [];
  initPassport();
  hide('register');
  show('passport');
}

function initPassport() {
  const meta = currentUser.user_metadata;
  $('traveler-avatar').textContent = meta.avatar || '😊';
  $('traveler-name').textContent = meta.name || '—';
  $('page-serial').textContent = meta.serial || 'PT-000000';
  buildStampGrid();
  updateProgress();
}

function buildStampGrid() {
  const grid = $('stamps-grid');
  grid.innerHTML = '';
  STAMPS_DATA.forEach((stamp, i) => {
    const earned = userStamps.includes(stamp.id);
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
      slot.innerHTML = `<span class="slot-num">${i + 1}</span>`;
    }
    grid.appendChild(slot);
  });
}

function updateProgress() {
  const count = userStamps.length;
  const pct = Math.round((count / STAMPS_DATA.length) * 100);
  $('stamp-count').textContent = `${count} / ${STAMPS_DATA.length}`;
  $('progress-fill').style.width = pct + '%';
  $('progress-pct').textContent = pct + '%';
}

// Portada fullscreen
$('cover-img-full').addEventListener('click', () => {
  if (!currentUser) {
    hide('cover');
    show('register');
  } else {
    hide('cover');
    show('passport');
  }
});

// Botón ✕: logout
$('btn-logout').addEventListener('click', async () => {
  if (confirm('Log out? Your progress is saved to your account.')) {
    await sb.auth.signOut();
    currentUser = null;
    userStamps = [];
    hide('passport');
    show('cover');
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
    console.error("Camera error:", err);
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

async function onQRSuccess(text) {
  stopScanner();
  hide('scanner');

  const stamp = STAMPS_DATA.find(s => s.id === text.trim());
  if (!stamp) {
    alert(`QR code not recognized:\n"${text}"\n\nMake sure to scan a valid passport QR code.`);
    show('passport');
    return;
  }

  if (userStamps.includes(stamp.id)) {
    showDuplicate();
    return;
  }

  const { error } = await sb.from('stamps').insert({ user_id: currentUser.id, stamp_id: stamp.id });
  if (error) {
    alert('Error saving stamp. Please try again.');
    show('passport');
    return;
  }

  userStamps.push(stamp.id);
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

// ── INICIO ─────────────────────────────────────────────────────
window.addEventListener('DOMContentLoaded', async () => {
  const { data: { session } } = await sb.auth.getSession();
  if (session) {
    currentUser = session.user;
    await loadAndShowPassport();
  } else {
    show('cover');
  }
});
