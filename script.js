// ── NAV ──
function toggleMenu() {
    document.getElementById('navLinks').classList.toggle('show');
}

function visSeksjon(id, el) {
    document.querySelectorAll('.tab-content').forEach(s => s.classList.remove('active'));
    document.getElementById(id).classList.add('active');
    if (el) {
        document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
        el.classList.add('active');
    }
    document.getElementById('navLinks').classList.remove('show');
}

// ── SLIDESHOW ──
let slideIndex = 0;
let slideTimer = null;
const SLIDE_INTERVAL = 6000;

function initSlideshow() {
    const slides = document.querySelectorAll('.slide');
    const dots = document.querySelectorAll('.dot');
    if (!slides.length) return;

    function goTo(n) {
        slides.forEach(s => s.classList.remove('active'));
        dots.forEach(d => d.classList.remove('active'));
        slideIndex = (n + slides.length) % slides.length;
        slides[slideIndex].classList.add('active');
        dots[slideIndex].classList.add('active');
    }

    function next() { goTo(slideIndex + 1); }
    function resetTimer() {
        clearInterval(slideTimer);
        slideTimer = setInterval(next, SLIDE_INTERVAL);
    }

    window.goToSlide = function(n) {
        goTo(n);
        resetTimer();
    };

    goTo(0);
    slideTimer = setInterval(next, SLIDE_INTERVAL);

    // Pause on hover
    document.querySelector('.hero')?.addEventListener('mouseenter', () => clearInterval(slideTimer));
    document.querySelector('.hero')?.addEventListener('mouseleave', () => resetTimer());

    // Swipe support for mobile
    let touchStartX = 0;
    document.querySelector('.hero')?.addEventListener('touchstart', e => {
        touchStartX = e.touches[0].clientX;
    });
    document.querySelector('.hero')?.addEventListener('touchend', e => {
        const diff = touchStartX - e.changedTouches[0].clientX;
        if (Math.abs(diff) > 50) {
            goTo(diff > 0 ? slideIndex + 1 : slideIndex - 1);
            resetTimer();
        }
    });
}

// ── LAST DATA FRA GITHUB ──
const DATA_BASE = 'https://raw.githubusercontent.com/asandven/pus-portal/main/data/';

async function lastSlideData() {
    try {
        const ukeplan = await fetch(DATA_BASE + 'ukeplan.json').then(r => r.json());
        oppdaterSlides(ukeplan);
    } catch (e) {
        console.log('Bruker standard slides (ingen data lastet)');
    }
    initSlideshow();
}

function oppdaterSlides(ukeplan) {
    if (!ukeplan) return;

    const label = document.getElementById('slide-ukeplan-label');
    const title = document.getElementById('slide-ukeplan-title');
    const body  = document.getElementById('slide-ukeplan-body');

    if (label && ukeplan.uke) label.textContent = `Uke ${ukeplan.uke}`;
    if (title) title.textContent = 'Hva skjer denne uka?';

    if (body) {
        const meldinger = (ukeplan.meldinger || []);
        const prover    = (ukeplan.prover || []);
        let html = '';
        if (meldinger.length) {
            const kolonne = meldinger.length > 3 ? 'display:grid;grid-template-columns:1fr 1fr;gap:2px 24px;align-items:start;' : '';
            html += `<div style="${kolonne}">${meldinger.map(m => `<div style="padding:2px 0;">📢 ${m}</div>`).join('')}</div>`;
        }
        if (prover.length) {
            html += prover.map(p => `<div>📝 ${p}</div>`).join('');
        }
        if (!html) html = 'Ingen meldinger denne uka.';
        body.innerHTML = html;
    }

    // Oppdater kort på forsiden
    const kortTittel = document.getElementById('ukeplan-kort-tittel');
    const kortTekst  = document.getElementById('ukeplan-kort-tekst');
    if (kortTittel && ukeplan.uke) kortTittel.textContent = `Ukeplan – Uke ${ukeplan.uke}`;
    if (kortTekst && ukeplan.timeplan) {
        const fag = [...new Set(
            ukeplan.timeplan.flatMap(r =>
                ['mandag','tirsdag','onsdag','torsdag','fredag'].map(d => r[d]).filter(Boolean)
            )
        )].slice(0, 4);
        if (fag.length) kortTekst.textContent = `${fag.join(', ')} og mer.`;
    }
}

// ── PIN LOGIN ──
const PINS = {
    "f8638b979b2f4f793ddb6dbd197e0ee25a7a6ea32b0ae22f5e3c5d119d839e75": "laerer",
    "888df25ae35772424a560c7152a1de794440e0ea5cfee62828333a456a506e05": "admin",
};

async function sjekkLogin() {
    const input = document.getElementById('pinCode');
    if (!input) return;
    const pin = input.value.trim();
    if (!pin) return;
    const hash = await sha256(pin);
    if (PINS[hash] === 'admin' || PINS[hash] === 'laerer') {
        visLaererSone();
    } else {
        input.value = '';
        input.style.borderColor = '#ef4444';
        setTimeout(() => { input.style.borderColor = ''; }, 1500);
    }
}

function visLaererSone() {
    visSeksjon('laerersone');
    document.getElementById('laerersone').classList.add('active');
    if (typeof startKlassekartModus === 'function') startKlassekartModus();
}

async function sha256(str) {
    const buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(str));
    return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2,'0')).join('');
}

// ── INIT ──
document.addEventListener('DOMContentLoaded', () => {
    const første = document.querySelector('.tab-content');
    if (første) første.classList.add('active');

    document.getElementById('pinCode')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') sjekkLogin();
    });

    lastSlideData();
});
