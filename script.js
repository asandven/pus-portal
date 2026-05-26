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
const SLIDE_INTERVAL = 5000;

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

    window.goToSlide = goTo;

    goTo(0);
    slideTimer = setInterval(next, SLIDE_INTERVAL);

    document.querySelector('.hero')?.addEventListener('mouseenter', () => clearInterval(slideTimer));
    document.querySelector('.hero')?.addEventListener('mouseleave', () => {
        slideTimer = setInterval(next, SLIDE_INTERVAL);
    });
}

// ── LAST DATA FRA GITHUB ──
const DATA_BASE = 'https://raw.githubusercontent.com/asandven/pus-portal/main/data/';

async function lastSlideData() {
    try {
        const [ukeplan, proveplan] = await Promise.all([
            fetch(DATA_BASE + 'ukeplan.json').then(r => r.json()),
            fetch(DATA_BASE + 'proveplan.json').then(r => r.json()).catch(() => null)
        ]);
        oppdaterSlides(ukeplan, proveplan);
    } catch (e) {
        console.log('Bruker standard slides (ingen data lastet)');
    }
    initSlideshow();
}

function oppdaterSlides(ukeplan, proveplan) {
    // Ukeplan-slide
    if (ukeplan) {
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
                html += meldinger.slice(0, 2).map(m => `<div>📢 ${m}</div>`).join('');
            }
            if (prover.length) {
                html += prover.slice(0, 2).map(p => `<div>📝 ${p}</div>`).join('');
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
                ukeplan.timeplan.flatMap(r => ['mandag','tirsdag','onsdag','torsdag','fredag'].map(d => r[d]).filter(Boolean))
            )].slice(0, 4);
            if (fag.length) kortTekst.textContent = `${fag.join(', ')} og mer.`;
        }
    }

    // Prøveplan-slide
    if (proveplan) {
        const body = document.getElementById('slide-prover-body');
        const kortTekst = document.getElementById('proveplan-kort-tekst');
        const prover = (proveplan.prover || []);

        if (body) {
            if (prover.length) {
                body.innerHTML = prover.slice(0, 3)
                    .map(p => `<div>Uke ${p.uke} ${p.dag}: ${p.fag} – ${p.type}</div>`)
                    .join('');
            } else {
                body.textContent = 'Ingen kommende prøver registrert.';
            }
        }

        if (kortTekst && prover.length) {
            kortTekst.textContent = `Neste: ${prover[0].fag} uke ${prover[0].uke} (${prover[0].dag})`;
        }
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
