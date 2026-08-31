JavaScript
const canvas = document.getElementById('pid-canvas');
const symbolsLayer = document.getElementById('symbols-layer');
const pipesLayer = document.getElementById('pipes-layer');
const pipeModeBtn = document.getElementById('pipe-mode-btn');

let currentMode = 'select'; // 'select' | 'pipe'
let activePipe = null;
let selectedElement = null;
let offset = { x: 0, y: 0 };

// Biblioteca de geometrías vectoriales ISA
const SYMBOL_TEMPLATES = {
  tank: (x, y) => `
    <g class="symbol-group" data-type="tank" transform="translate(${x}, ${y})">
      <rect x="-30" y="-45" width="60" height="90" rx="10" fill="#313244" stroke="#cdd6f4" stroke-width="2"/>
      <text x="0" y="5" fill="#cdd6f4" font-size="11" text-anchor="middle" font-family="sans-serif">TK-101</text>
    </g>`,
  pump: (x, y) => `
    <g class="symbol-group" data-type="pump" transform="translate(${x}, ${y})">
      <circle cx="0" cy="0" r="22" fill="#313244" stroke="#cdd6f4" stroke-width="2"/>
      <path d="M 0 -22 L 22 12 L -22 12 Z" fill="#45475a" stroke="#cdd6f4" stroke-width="1.5"/>
      <text x="0" y="32" fill="#cdd6f4" font-size="10" text-anchor="middle" font-family="sans-serif">P-101</text>
    </g>`,
  valve: (x, y) => `
    <g class="symbol-group" data-type="valve" transform="translate(${x}, ${y})">
      <path d="M -20 -12 L 0 0 L -20 12 Z M 20 -12 L 0 0 L 20 12 Z" fill="#313244" stroke="#cdd6f4" stroke-width="2"/>
      <line x1="0" y1="0" x2="0" y2="-15" stroke="#cdd6f4" stroke-width="2"/>
      <line x1="-8" y1="-15" x2="8" y2="-15" stroke="#cdd6f4" stroke-width="2"/>
      <text x="0" y="24" fill="#cdd6f4" font-size="10" text-anchor="middle" font-family="sans-serif">V-101</text>
    </g>`,
  instrument: (x, y) => `
    <g class="symbol-group" data-type="instrument" transform="translate(${x}, ${y})">
      <circle cx="0" cy="0" r="18" fill="#1e1e2e" stroke="#cdd6f4" stroke-width="2"/>
      <line x1="-18" y1="0" x2="18" y2="0" stroke="#cdd6f4" stroke-width="1.5"/>
      <text x="0" y="-4" fill="#89b4fa" font-size="10" font-weight="bold" text-anchor="middle" font-family="sans-serif">LT</text>
      <text x="0" y="11" fill="#cdd6f4" font-size="9" text-anchor="middle" font-family="sans-serif">101</text>
    </g>`
};

function getPointerPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

function addSymbol(type) {
  const x = canvas.clientWidth / 2;
  const y = canvas.clientHeight / 2;
  const parser = new DOMParser();
  const doc = parser.parseFromString(SYMBOL_TEMPLATES[type](x, y), 'image/svg+xml');
  const node = doc.documentElement;
  symbolsLayer.appendChild(node);
  bindSymbolEvents(node);
}

function bindSymbolEvents(elem) {
  const startDrag = (e) => {
    if (currentMode === 'pipe') return;
    e.stopPropagation();
    selectedElement = elem;
    const pos = getPointerPos(e);
    const transform = elem.getAttribute('transform');
    const match = /translate\(([^,]+),\s*([^)]+)\)/.exec(transform);
    const currX = match ? parseFloat(match[1]) : 0;
    const currY = match ? parseFloat(match[2]) : 0;
    offset = { x: pos.x - currX, y: pos.y - currY };
  };

  elem.addEventListener('mousedown', startDrag);
  elem.addEventListener('touchstart', startDrag, { passive: false });

  // Editar etiqueta con doble clic
  elem.addEventListener('dblclick', () => {
    const textNode = elem.querySelector('text');
    if (textNode) {
      const newVal = prompt('Ingresa nuevo tag / identificador:', textNode.textContent);
      if (newVal !== null) textNode.textContent = newVal.trim();
    }
  });
}

function onMove(e) {
  const pos = getPointerPos(e);
  if (selectedElement && currentMode === 'select') {
    e.preventDefault();
    const nx = pos.x - offset.x;
    const ny = pos.y - offset.y;
    selectedElement.setAttribute('transform', `translate(${nx}, ${ny})`);
  } else if (activePipe && currentMode === 'pipe') {
    activePipe.setAttribute('x2', pos.x);
    activePipe.setAttribute('y2', pos.y);
  }
}

function onEnd() {
  selectedElement = null;
}

canvas.addEventListener('mousemove', onMove);
canvas.addEventListener('touchmove', onMove, { passive: false });
window.addEventListener('mouseup', onEnd);
window.addEventListener('touchend', onEnd);

function togglePipeMode() {
  currentMode = currentMode === 'select' ? 'pipe' : 'select';
  pipeModeBtn.classList.toggle('active', currentMode === 'pipe');
  canvas.style.cursor = currentMode === 'pipe' ? 'cell' : 'crosshair';
}

// Trazar tuberías punto a punto
canvas.addEventListener('mousedown', (e) => {
  if (currentMode !== 'pipe' || e.target.closest('.symbol-group')) return;
  const pos = getPointerPos(e);
  if (!activePipe) {
    activePipe = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    activePipe.setAttribute('x1', pos.x);
    activePipe.setAttribute('y1', pos.y);
    activePipe.setAttribute('x2', pos.x);
    activePipe.setAttribute('y2', pos.y);
    activePipe.setAttribute('stroke', '#89b4fa');
    activePipe.setAttribute('stroke-width', '4');
    activePipe.setAttribute('marker-end', 'url(#arrow)');
    pipesLayer.appendChild(activePipe);
  } else {
    activePipe = null; // Fijar tubería
  }
});

function clearCanvas() {
  if (confirm('¿Deseas vaciar el diagrama actual?')) {
    symbolsLayer.innerHTML = '';
    pipesLayer.innerHTML = '';
    activePipe = null;
  }
}

// Exportar a SVG estándar
function exportSVG() {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(canvas);
  const blob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'diagrama-pid.svg';
  a.click();
  URL.revokeObjectURL(url);
}

// Exportar a imagen PNG
function exportPNG() {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(canvas);
  const img = new Image();
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = canvas.clientWidth;
    outCanvas.height = canvas.clientHeight;
    const ctx = outCanvas.getContext('2d');
    ctx.fillStyle = '#181825';
    ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);
    ctx.drawImage(img, 0, 0);
    
    const a = document.createElement('a');
    a.download = 'diagrama-pid.png';
    a.href = outCanvas.toDataURL('image/png');
    a.click();
    URL.revokeObjectURL(url);
  };
  img.src = url;
}