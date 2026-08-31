const canvas = document.getElementById('pid-canvas');
const symbolsLayer = document.getElementById('symbols-layer');
const pipesLayer = document.getElementById('pipes-layer');
const pipeModeBtn = document.getElementById('pipe-mode-btn');

const SVG_NS = "http://www.w3.org/2000/svg";
let currentMode = 'select'; // 'select' | 'pipe'
let activePipe = null;
let selectedElement = null;
let offset = { x: 0, y: 0 };

function getPointerPos(evt) {
  const rect = canvas.getBoundingClientRect();
  const clientX = evt.touches ? evt.touches[0].clientX : evt.clientX;
  const clientY = evt.touches ? evt.touches[0].clientY : evt.clientY;
  return {
    x: clientX - rect.left,
    y: clientY - rect.top
  };
}

// Creador de símbolos con compatibilidad nativa SVG
function addSymbol(type) {
  const rect = canvas.getBoundingClientRect();
  const x = rect.width ? rect.width / 2 : 200;
  const y = rect.height ? rect.height / 2 : 200;

  const group = document.createElementNS(SVG_NS, 'g');
  group.setAttribute('class', 'symbol-group');
  group.setAttribute('transform', `translate(${x}, ${y})`);

  if (type === 'tank') {
    const r = document.createElementNS(SVG_NS, 'rect');
    r.setAttribute('x', '-35');
    r.setAttribute('y', '-50');
    r.setAttribute('width', '70');
    r.setAttribute('height', '100');
    r.setAttribute('rx', '12');
    r.setAttribute('fill', '#2d3142');
    r.setAttribute('stroke', '#ffffff');
    r.setAttribute('stroke-width', '2.5');

    const txt = createText('TK-101', 0, 5, '#ffffff', '12px');
    group.appendChild(r);
    group.appendChild(txt);
  } 
  else if (type === 'pump') {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', '0');
    c.setAttribute('cy', '0');
    c.setAttribute('r', '25');
    c.setAttribute('fill', '#2d3142');
    c.setAttribute('stroke', '#ffffff');
    c.setAttribute('stroke-width', '2.5');

    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', 'M 0 -25 L 25 15 L -25 15 Z');
    p.setAttribute('fill', '#4f5478');
    p.setAttribute('stroke', '#ffffff');
    p.setAttribute('stroke-width', '2');

    const txt = createText('P-101', 0, 40, '#ffffff', '11px');
    group.appendChild(c);
    group.appendChild(p);
    group.appendChild(txt);
  } 
  else if (type === 'valve') {
    const p = document.createElementNS(SVG_NS, 'path');
    p.setAttribute('d', 'M -25 -15 L 0 0 L -25 15 Z M 25 -15 L 0 0 L 25 15 Z');
    p.setAttribute('fill', '#4f5478');
    p.setAttribute('stroke', '#ffffff');
    p.setAttribute('stroke-width', '2.5');

    const stem = document.createElementNS(SVG_NS, 'line');
    stem.setAttribute('x1', '0');
    stem.setAttribute('y1', '0');
    stem.setAttribute('x2', '0');
    stem.setAttribute('y2', '-18');
    stem.setAttribute('stroke', '#ffffff');
    stem.setAttribute('stroke-width', '2.5');

    const handle = document.createElementNS(SVG_NS, 'line');
    handle.setAttribute('x1', '-10');
    handle.setAttribute('y1', '-18');
    handle.setAttribute('x2', '10');
    handle.setAttribute('y2', '-18');
    handle.setAttribute('stroke', '#ffffff');
    handle.setAttribute('stroke-width', '2.5');

    const txt = createText('V-101', 0, 30, '#ffffff', '11px');
    group.appendChild(p);
    group.appendChild(stem);
    group.appendChild(handle);
    group.appendChild(txt);
  } 
  else if (type === 'instrument') {
    const c = document.createElementNS(SVG_NS, 'circle');
    c.setAttribute('cx', '0');
    c.setAttribute('cy', '0');
    c.setAttribute('r', '22');
    c.setAttribute('fill', '#1e1e24');
    c.setAttribute('stroke', '#64b5f6');
    c.setAttribute('stroke-width', '2.5');

    const line = document.createElementNS(SVG_NS, 'line');
    line.setAttribute('x1', '-22');
    line.setAttribute('y1', '0');
    line.setAttribute('x2', '22');
    line.setAttribute('y2', '0');
    line.setAttribute('stroke', '#64b5f6');
    line.setAttribute('stroke-width', '1.5');

    const tag = createText('LT', 0, -5, '#64b5f6', '12px', 'bold');
    const id = createText('101', 0, 14, '#ffffff', '11px');
    group.appendChild(c);
    group.appendChild(line);
    group.appendChild(tag);
    group.appendChild(id);
  }

  symbolsLayer.appendChild(group);
  bindSymbolEvents(group);
}

function createText(str, x, y, fill, size, weight = 'normal') {
  const t = document.createElementNS(SVG_NS, 'text');
  t.setAttribute('x', x);
  t.setAttribute('y', y);
  t.setAttribute('fill', fill);
  t.setAttribute('font-size', size);
  t.setAttribute('font-weight', weight);
  t.setAttribute('text-anchor', 'middle');
  t.setAttribute('font-family', 'Arial, sans-serif');
  t.textContent = str;
  return t;
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

  elem.addEventListener('dblclick', (e) => {
    e.stopPropagation();
    const texts = elem.querySelectorAll('text');
    if (texts.length > 0) {
      const current = texts[0].textContent;
      const val = prompt('Editar texto/identificador:', current);
      if (val !== null && val.trim() !== '') {
        texts[0].textContent = val.trim();
      }
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
  pipeModeBtn.textContent = currentMode === 'pipe' ? 'Modo Tubería (Activo)' : 'Trazar Tubería';
}

canvas.addEventListener('mousedown', (e) => {
  if (currentMode !== 'pipe') return;
  const pos = getPointerPos(e);
  if (!activePipe) {
    activePipe = document.createElementNS(SVG_NS, 'line');
    activePipe.setAttribute('x1', pos.x);
    activePipe.setAttribute('y1', pos.y);
    activePipe.setAttribute('x2', pos.x);
    activePipe.setAttribute('y2', pos.y);
    activePipe.setAttribute('stroke', '#64b5f6');
    activePipe.setAttribute('stroke-width', '4');
    activePipe.setAttribute('marker-end', 'url(#arrow)');
    pipesLayer.appendChild(activePipe);
  } else {
    activePipe = null;
  }
});

function clearCanvas() {
  if (confirm('¿Deseas limpiar todo el diagrama?')) {
    symbolsLayer.innerHTML = '';
    pipesLayer.innerHTML = '';
    activePipe = null;
  }
}

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

function exportPNG() {
  const serializer = new XMLSerializer();
  const source = serializer.serializeToString(canvas);
  const img = new Image();
  const svgBlob = new Blob([source], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(svgBlob);

  img.onload = () => {
    const outCanvas = document.createElement('canvas');
    outCanvas.width = canvas.clientWidth || 1000;
    outCanvas.height = canvas.clientHeight || 700;
    const ctx = outCanvas.getContext('2d');
    ctx.fillStyle = '#18181f';
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
