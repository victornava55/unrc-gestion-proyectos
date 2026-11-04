/**
 * ============================================================================
 * UNRC · UTILIDADES DE FORMATO Y CÁLCULO DE ORDENAMIENTO KANBAN
 * Archivo: src/utils/formatters.js
 * ============================================================================
 */

export const PRIORITY_CONFIG = {
  CRITICA: {
    label: 'CRÍTICA',
    dotColor: '#9D2449',
    textColor: '#9D2449',
    bgColor: 'rgba(157, 36, 73, 0.08)',
    borderColor: 'rgba(157, 36, 73, 0.35)',
  },
  ALTA: {
    label: 'ALTA',
    dotColor: '#111111',
    textColor: '#111111',
    bgColor: '#F2F2F4',
    borderColor: '#D4D4D8',
  },
  MEDIA: {
    label: 'MEDIA',
    dotColor: '#6E6E73',
    textColor: '#55555A',
    bgColor: '#F8F8F9',
    borderColor: '#EAEAEA',
  },
  BAJA: {
    label: 'BAJA',
    dotColor: '#AEAEB2',
    textColor: '#8E8E93',
    bgColor: '#FFFFFF',
    borderColor: '#EAEAEA',
  },
};

export function getInitials(fullName = '') {
  if (!fullName) return 'UN';
  const clean = fullName
    .replace(/^(Dra\.|Dr\.|Mtro\.|Mtra\.|Ing\.|Lic\.)\s+/i, '')
    .trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'UN';
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

export function formatShortDate(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString.slice(0, 10);
    return date
      .toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
      })
      .toUpperCase()
      .replace('.', '');
  } catch (_e) {
    return '';
  }
}

export function formatDateTimeEditorial(isoString) {
  if (!isoString) return '';
  try {
    const date = new Date(isoString);
    if (isNaN(date.getTime())) return isoString;
    const d = date
      .toLocaleDateString('es-MX', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
      .toUpperCase()
      .replace('.', '');
    const t = date.toLocaleTimeString('es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    return `${d} · ${t}`;
  } catch (_e) {
    return isoString;
  }
}

export function isOverdue(isoString) {
  if (!isoString) return false;
  const due = new Date(isoString).getTime();
  if (isNaN(due)) return false;
  return due < Date.now();
}

export function toDateTimeLocalInput(isoString) {
  if (!isoString) return '';
  try {
    const d = new Date(isoString);
    if (isNaN(d.getTime())) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(
      d.getHours()
    )}:${pad(d.getMinutes())}`;
  } catch (_e) {
    return '';
  }
}

export function computeNewCardOrder(tasksInTargetColumn, draggedTaskId, targetIndex) {
  const filtered = tasksInTargetColumn.filter(
    (t) => t.id_tarea !== draggedTaskId
  );

  if (filtered.length === 0) {
    return 1000;
  }

  if (targetIndex <= 0) {
    const firstOrder = Number(filtered[0].orden_tarjeta || 1000);
    return Math.max(1, Math.round(firstOrder / 2));
  }

  if (targetIndex >= filtered.length) {
    const lastOrder = Number(filtered[filtered.length - 1].orden_tarjeta || 1000);
    return lastOrder + 1000;
  }

  const prevOrder = Number(filtered[targetIndex - 1].orden_tarjeta || 1000);
  const nextOrder = Number(filtered[targetIndex].orden_tarjeta || prevOrder + 1000);

  if (nextOrder === prevOrder) {
    return prevOrder + 1;
  }

  return Number(((prevOrder + nextOrder) / 2).toFixed(4));
}
