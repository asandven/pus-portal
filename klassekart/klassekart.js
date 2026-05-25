let aktivPultType = "";
const GRID_SIZE = 25;
const PULT_BREDDE = 125;
const PULT_HOYDE = 75;

function toggleMenu() { 
    const nav = document.getElementById('navLinks');
    if(nav) nav.classList.toggle('show'); 
}

function startKlassekartModus() {
    document.body.innerHTML = `
        <nav class="top-bar">
            <div class="nav-container">
                <div class="brand">
                    <img src="puslogo.png" alt="IKT-Pus Logo" class="brand-img">
                    <span class="brand-text">IKT-<span class="highlight">Pus</span></span>
                </div>
                <button class="menu-toggle" onclick="toggleMenu()">☰</button>
                <ul class="nav-links" id="navLinks">
                    <li><button class="nav-btn" onclick="location.reload()">🏠 Hjem</button></li>
                    <li><button class="nav-btn active">Klassekart</button></li>
                </ul>
            </div>
        </nav>
        
        <div class="klassekart-wrapper">
            <div class="sidebar">
                <h3>📐 Møbler</h3>
                <div class="pult-mal" draggable="true" ondragstart="startNyPult(event, 'enkel')">Enkeltpult</div>
                <div class="pult-mal" draggable="true" ondragstart="startNyPult(event, 'par')">Pultepar</div>
                <div class="pult-mal" draggable="true" ondragstart="startNyPult(event, 'gruppe4')">Gruppe (4)</div>
                <hr>
                <button onclick="lagreJSON()">💾 Lagre layout</button>
                <button onclick="slettAlle()" style="background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);">
                    🗑️ Tøm rom
                </button>
            </div>

            <div class="center-zone">
                <div id="klasserom" class="grid-container" ondragover="allowDrop(event)" ondrop="dropPult(event)">
                    <div class="kateter">KATETER / TAVLE</div>
                </div>
            </div>
            
            <div class="sidebar right">
                <h3>👥 Elever</h3>
                <div class="elev-input-container">
                    <input type="text" id="elevNavnInput" placeholder="Elevnavn..." onkeypress="if(event.key==='Enter') leggTilElev()" />
                    <button onclick="leggTilElev()">+</button>
                </div>
                <div class="elev-liste" id="elevListe">
                    <p style="color: #94a3b8; text-align: center; font-size: 14px;">Ingen elever lagt til ennå</p>
                </div>
            </div>
        </div>
    `;
}

function startNyPult(e, type) {
    aktivPultType = type;
    e.dataTransfer.setData("action", "create");
}

function allowDrop(e) { 
    e.preventDefault(); 
}

function dropPult(e) {
    e.preventDefault();
    const rom = document.getElementById('klasserom').getBoundingClientRect();
    
    // Beregner nøyaktig slipp-punkt - justert for å snappe til grid
    const x = Math.round((e.clientX - rom.left) / GRID_SIZE) * GRID_SIZE;
    const y = Math.round((e.clientY - rom.top) / GRID_SIZE) * GRID_SIZE;
    
    lagPult(x, y, aktivPultType);
}

function lagPult(x, y, type, navnListe = []) {
    const pultGruppe = document.createElement('div');
    pultGruppe.className = 'pult-objekt ' + type;
    pultGruppe.style.left = x + 'px';
    pultGruppe.style.top = y + 'px';
    
    // Legg til drag-håndtak
    const dragHandle = document.createElement('div');
    dragHandle.className = 'drag-handle';
    dragHandle.innerHTML = '⋮⋮';
    dragHandle.title = 'Dra for å flytte';
    pultGruppe.appendChild(dragHandle);
    
    let antallSeter = (type === 'enkel') ? 1 : (type === 'par' ? 2 : 4);
    
    for (let i = 0; i < antallSeter; i++) {
        const sete = document.createElement('div');
        sete.className = 'sete';
        const navn = navnListe[i] || '';
        sete.innerHTML = navn || 'Ledig';
        
        if (!navn) {
            sete.contentEditable = true;
            sete.addEventListener('focus', function() {
                if (this.textContent === 'Ledig') {
                    this.textContent = '';
                }
                this.style.background = 'linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%)';
                this.style.borderColor = '#3b82f6';
            });
            
            sete.addEventListener('blur', function() {
                if (this.textContent.trim() === '') {
                    this.textContent = 'Ledig';
                    this.classList.remove('opptatt');
                } else {
                    this.classList.add('opptatt');
                }
                this.style.background = '';
                this.style.borderColor = '';
            });
            
            sete.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.blur();
                }
            });
        } else {
            sete.classList.add('opptatt');
            sete.contentEditable = true;
        }
        
        pultGruppe.appendChild(sete);
    }
    
    // Dobbeltklikk for å slette
    pultGruppe.addEventListener('dblclick', function(e) {
        if (!e.target.classList.contains('sete')) {
            if (confirm('Vil du slette denne pulten?')) {
                this.remove();
            }
        }
    });
    
    // Drag-funksjonalitet med bedre feedback
    let isDragging = false;
    
    pultGruppe.addEventListener('mousedown', function(e) {
        // Tillat dragging hvis:
        // 1. Man klikker på drag-håndtaket, ELLER
        // 2. Man holder nede Shift-tasten
        const clickedOnHandle = e.target.classList.contains('drag-handle');
        const clickedOnSete = e.target.classList.contains('sete');
        
        if (clickedOnSete && !e.shiftKey) {
            // La setene være klikkbare for redigering
            return;
        }
        
        if (!clickedOnHandle && !e.shiftKey) {
            // Ikke start dragging med mindre man klikker på håndtaket eller holder Shift
            return;
        }
        
        e.preventDefault();
        e.stopPropagation();
        
        isDragging = true;
        
        const rect = pultGruppe.getBoundingClientRect();
        const rom = document.getElementById('klasserom').getBoundingClientRect();
        
        const offsetX = e.clientX - rect.left;
        const offsetY = e.clientY - rect.top;

        pultGruppe.style.zIndex = '1000';
        pultGruppe.style.cursor = 'grabbing';
        pultGruppe.style.opacity = '0.8';
        pultGruppe.classList.add('dragging');

        const onMouseMove = function(ev) {
            const newX = ev.clientX - rom.left - offsetX;
            const newY = ev.clientY - rom.top - offsetY;
            
            const snappedX = Math.round(newX / GRID_SIZE) * GRID_SIZE;
            const snappedY = Math.round(newY / GRID_SIZE) * GRID_SIZE;
            
            // Hold pulten innenfor grensene
            const maxX = rom.width - pultGruppe.offsetWidth;
            const maxY = rom.height - pultGruppe.offsetHeight;
            
            pultGruppe.style.left = Math.max(0, Math.min(snappedX, maxX)) + 'px';
            pultGruppe.style.top = Math.max(0, Math.min(snappedY, maxY)) + 'px';
        };
        
        const onMouseUp = function() {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseup', onMouseUp);
            
            pultGruppe.style.zIndex = '';
            pultGruppe.style.cursor = 'grab';
            pultGruppe.style.opacity = '1';
            pultGruppe.classList.remove('dragging');
            
            setTimeout(() => { isDragging = false; }, 50);
        };
        
        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseup', onMouseUp);
    });

    document.getElementById('klasserom').appendChild(pultGruppe);
}

function lagreJSON() {
    const rom = document.getElementById('klasserom');
    const pulter = rom.querySelectorAll('.pult-objekt');
    const data = [];
    
    pulter.forEach(pult => {
        const type = pult.classList.contains('enkel') ? 'enkel' : 
                    pult.classList.contains('par') ? 'par' : 'gruppe4';
        const seter = pult.querySelectorAll('.sete');
        const navn = Array.from(seter).map(s => {
            const tekst = s.textContent.trim();
            return tekst === 'Ledig' ? '' : tekst;
        });
        
        data.push({
            type: type,
            x: parseInt(pult.style.left),
            y: parseInt(pult.style.top),
            navn: navn
        });
    });
    
    const json = JSON.stringify(data, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'klassekart_' + new Date().toISOString().split('T')[0] + '.json';
    a.click();
    URL.revokeObjectURL(url);
    
    alert('✓ Klassekart lagret!');
}

function lastJSON(fil) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const data = JSON.parse(e.target.result);
        const rom = document.getElementById('klasserom');
        
        // Fjern eksisterende pulter (behold kateter)
        rom.querySelectorAll('.pult-objekt').forEach(p => p.remove());
        
        // Lag nye pulter fra data
        data.forEach(pult => {
            lagPult(pult.x, pult.y, pult.type, pult.navn);
        });
        
        alert('✓ Klassekart lastet inn!');
    };
    reader.readAsText(fil);
}

function slettAlle() {
    if (confirm('Er du sikker på at du vil slette alle pulter?')) {
        const rom = document.getElementById('klasserom');
        rom.querySelectorAll('.pult-objekt').forEach(p => p.remove());
    }
}

function leggTilElev() {
    const input = document.getElementById('elevNavnInput');
    const navn = input.value.trim();
    
    if (!navn) return;
    
    const liste = document.getElementById('elevListe');
    
    // Fjern "Ingen elever" melding
    const placeholder = liste.querySelector('p');
    if (placeholder) placeholder.remove();
    
    const elevItem = document.createElement('div');
    elevItem.className = 'elev-item';
    elevItem.draggable = true;
    elevItem.innerHTML = `
        <span>${navn}</span>
        <span class="slett-elev" onclick="this.parentElement.remove(); sjekkTomListe();">×</span>
    `;
    
    // Drag-funksjonalitet for elever (kommer senere)
    elevItem.ondragstart = function(e) {
        e.dataTransfer.setData('elevnavn', navn);
    };
    
    liste.appendChild(elevItem);
    input.value = '';
    input.focus();
}

function sjekkTomListe() {
    const liste = document.getElementById('elevListe');
    if (liste.children.length === 0) {
        liste.innerHTML = '<p style="color: #94a3b8; text-align: center; font-size: 14px;">Ingen elever lagt til ennå</p>';
    }
}

// Legg til last-funksjon når siden lastes
window.addEventListener('DOMContentLoaded', function() {
    if (document.getElementById('klasserom')) {
        const sidebar = document.querySelector('.sidebar');
        if (sidebar) {
            const lastKnapp = document.createElement('button');
            lastKnapp.innerHTML = '📂 Last layout';
            lastKnapp.style.background = 'linear-gradient(135deg, #059669 0%, #047857 100%)';
            lastKnapp.onclick = function() {
                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = (e) => lastJSON(e.target.files[0]);
                input.click();
            };
            sidebar.appendChild(lastKnapp);
        }
    }
});
