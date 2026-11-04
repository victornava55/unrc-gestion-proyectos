import React, { useState, useMemo } from 'react';
import { Plus, X, Columns, Sparkles } from 'lucide-react';
import useAppStore, { resolveEffectiveRole } from '../../store/useAppStore';
import KanbanColumn from './KanbanColumn';
import TaskDetailModal from './TaskDetailModal';
import { computeNewCardOrder } from '../../utils/formatters';

const COLUMN_COLORS = [
  { hex: '#111111', label: 'Negro Editorial' },
  { hex: '#9D2449', label: 'Guinda UNRC' },
  { hex: '#8E8E93', label: 'Gris Galería' },
];

export default function KanbanBoard() {
  const usuarios = useAppStore((s) => s.usuarios);
  const proyectosColumnas = useAppStore((s) => s.proyectosColumnas);
  const tareas = useAppStore((s) => s.tareas);
  const activeProjectId = useAppStore((s) => s.activeProjectId);
  const currentUser = useAppStore((s) => s.currentUser);
  const selectedTaskId = useAppStore((s) => s.selectedTaskId);
  const setSelectedTask = useAppStore((s) => s.setSelectedTask);
  const searchQuery = useAppStore((s) => s.searchQuery);
  const priorityFilter = useAppStore((s) => s.priorityFilter);
  const assigneeFilter = useAppStore((s) => s.assigneeFilter);

  const createTask = useAppStore((s) => s.createTask);
  const moveTask = useAppStore((s) => s.moveTask);
  const createColumn = useAppStore((s) => s.createColumn);
  const isTaskHiddenForUser = useAppStore((s) => s.isTaskHiddenForUser);
  const hiddenTasksByUser = useAppStore((s) => s.hiddenTasksByUser);

  const isAdmin =
    resolveEffectiveRole(currentUser, activeProjectId) === 'ADMIN';

  const [isAddingColumn, setIsAddingColumn] = useState(false);
  const [colName, setColName] = useState('');
  const [colWip, setColWip] = useState(0);
  const [colColor, setColColor] = useState('#111111');

  const [dragState, setDragState] = useState({
    draggedTaskId: null,
    overColumnId: null,
    overTaskId: null,
    dropPosition: null,
  });

  const usersMap = useMemo(() => {
    const map = new Map();
    usuarios.forEach((u) => map.set(u.id_usuario, u));
    return map;
  }, [usuarios]);

  const activeColumns = useMemo(() => {
    return proyectosColumnas
      .filter((col) => col.id_proyecto === activeProjectId)
      .sort((a, b) => Number(a.orden_columna) - Number(b.orden_columna));
  }, [proyectosColumnas, activeProjectId]);

  const tasksByColumnMap = useMemo(() => {
    const map = new Map();
    const q = searchQuery.trim().toLowerCase();

    activeColumns.forEach((col) => {
      map.set(col.id_columna, []);
    });

    tareas.forEach((t) => {
      if (t.id_proyecto !== activeProjectId || t.archivada) return;
      if (!map.has(t.id_columna)) return;

      if (
        !isAdmin &&
        currentUser &&
        isTaskHiddenForUser(t, currentUser.id_usuario)
      ) {
        return;
      }

      if (priorityFilter !== 'TODAS' && t.prioridad !== priorityFilter) return;
      if (
        assigneeFilter !== 'TODOS' &&
        !(Array.isArray(t.ids_asignados) && t.ids_asignados.includes(assigneeFilter))
      ) {
        return;
      }
      if (q) {
        const inTitle = (t.titulo || '').toLowerCase().includes(q);
        const inDesc = (t.descripcion_md || '').toLowerCase().includes(q);
        const inTags =
          Array.isArray(t.etiquetas_json) &&
          t.etiquetas_json.some((tag) => tag.toLowerCase().includes(q));
        if (!inTitle && !inDesc && !inTags) return;
      }

      map.get(t.id_columna).push(t);
    });

    map.forEach((list) => {
      list.sort((a, b) => Number(a.orden_tarjeta) - Number(b.orden_tarjeta));
    });

    return map;
  }, [
    tareas,
    activeColumns,
    activeProjectId,
    searchQuery,
    priorityFilter,
    assigneeFilter,
    isAdmin,
    currentUser,
    isTaskHiddenForUser,
    hiddenTasksByUser,
  ]);

  const totalVisibleProjectTasks = useMemo(() => {
    let sum = 0;
    tasksByColumnMap.forEach((list) => {
      sum += list.length;
    });
    return sum;
  }, [tasksByColumnMap]);

  const handleDragStartCard = (task) => {
    setDragState({
      draggedTaskId: task.id_tarea,
      overColumnId: task.id_columna,
      overTaskId: null,
      dropPosition: null,
    });
  };

  const handleDragEndCard = () => {
    setDragState({
      draggedTaskId: null,
      overColumnId: null,
      overTaskId: null,
      dropPosition: null,
    });
  };

  const handleDragOverColumn = (columnId) => {
    setDragState((prev) => {
      if (prev.overColumnId === columnId) return prev;
      return {
        ...prev,
        overColumnId: columnId,
        overTaskId: null,
        dropPosition: null,
      };
    });
  };

  const handleDragOverCard = (columnId, taskId, position) => {
    setDragState((prev) => {
      if (
        prev.overColumnId === columnId &&
        prev.overTaskId === taskId &&
        prev.dropPosition === position
      ) {
        return prev;
      }
      return {
        ...prev,
        overColumnId: columnId,
        overTaskId: taskId,
        dropPosition: position,
      };
    });
  };

  const handleDropInColumn = (targetColumnId) => {
    const { draggedTaskId, overTaskId, dropPosition } = dragState;
    handleDragEndCard();

    if (!draggedTaskId) return;

    const rawColumnTasks = tareas
      .filter(
        (t) =>
          t.id_proyecto === activeProjectId &&
          t.id_columna === targetColumnId &&
          !t.archivada &&
          t.id_tarea !== draggedTaskId
      )
      .sort((a, b) => Number(a.orden_tarjeta) - Number(b.orden_tarjeta));

    let targetIndex = rawColumnTasks.length;

    if (overTaskId && overTaskId !== draggedTaskId) {
      const idx = rawColumnTasks.findIndex((t) => t.id_tarea === overTaskId);
      if (idx > -1) {
        targetIndex = dropPosition === 'before' ? idx : idx + 1;
      }
    }

    const newOrder = computeNewCardOrder(
      rawColumnTasks,
      draggedTaskId,
      targetIndex
    );

    moveTask(draggedTaskId, targetColumnId, newOrder);
  };

  const handleCreateColumnSubmit = (e) => {
    e.preventDefault();
    const cleanName = colName.trim();
    if (!cleanName) return;

    createColumn({
      nombre_columna: cleanName,
      limite_wip: Number(colWip || 0),
      color_indicador: colColor,
    });

    setColName('');
    setColWip(0);
    setColColor('#111111');
    setIsAddingColumn(false);
  };

  return (
    <div className="kanban-board-container">
      {totalVisibleProjectTasks === 0 && !searchQuery && (
        <div className="blank-project-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Sparkles size={18} color="#9D2449" strokeWidth={1.75} />
            <div>
              <strong style={{ fontSize: '0.88rem', color: '#111111' }}>
                Proyecto en Blanco — Listo para tu Equipo
              </strong>
              <p style={{ fontSize: '0.78rem', color: '#55555A', marginTop: 2 }}>
                Haz clic en <strong>+ Nueva tarjeta</strong> en cualquier columna
                para crear tus primeras fichas, usa <strong>+ Nuevo</strong> en
                la barra lateral para crear más proyectos, o comparte el{' '}
                <strong>Link del Proyecto</strong> con tu equipo.
              </p>
            </div>
          </div>
        </div>
      )}
      <div className="kanban-board-scroll">
        {activeColumns.map((column) => (
          <KanbanColumn
            key={column.id_columna}
            column={column}
            tasks={tasksByColumnMap.get(column.id_columna) || []}
            usersMap={usersMap}
            currentUserId={currentUser?.id_usuario}
            onSelectTask={(taskId) => setSelectedTask(taskId)}
            onCreateTask={createTask}
            dragState={dragState}
            onDragStartCard={handleDragStartCard}
            onDragEndCard={handleDragEndCard}
            onDragOverColumn={handleDragOverColumn}
            onDragOverCard={handleDragOverCard}
            onDropInColumn={handleDropInColumn}
          />
        ))}

        <div className="kanban-new-column-lane">
          {!isAddingColumn ? (
            <button
              type="button"
              className="kanban-add-column-btn"
              onClick={() => setIsAddingColumn(true)}
            >
              <Plus size={15} strokeWidth={1.5} />
              <span>NUEVA COLUMNA</span>
            </button>
          ) : (
            <form
              className="kanban-new-column-form"
              onSubmit={handleCreateColumnSubmit}
            >
              <div className="kanban-new-column-form__header">
                <Columns size={14} strokeWidth={1.5} />
                <span>CREAR ETAPA EN SHEETS</span>
              </div>

              <label className="editorial-label">NOMBRE DE LA COLUMNA</label>
              <input
                type="text"
                className="editorial-input"
                placeholder="Ej. Dictamen Técnico..."
                value={colName}
                onChange={(e) => setColName(e.target.value)}
                autoFocus
              />

              <div className="kanban-new-column-form__row">
                <div>
                  <label className="editorial-label">LÍMITE WIP (0=SIN)</label>
                  <input
                    type="number"
                    min="0"
                    max="50"
                    className="editorial-input editorial-input--sm"
                    value={colWip}
                    onChange={(e) => setColWip(e.target.value)}
                  />
                </div>

                <div>
                  <label className="editorial-label">ACENTO CROMÁTICO</label>
                  <div className="color-swatches">
                    {COLUMN_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        title={c.label}
                        onClick={() => setColColor(c.hex)}
                        className={`color-swatch ${
                          colColor === c.hex ? 'color-swatch--active' : ''
                        }`}
                        style={{ backgroundColor: c.hex }}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="kanban-quick-form__actions">
                <button
                  type="button"
                  className="btn-editorial btn-editorial--ghost"
                  onClick={() => setIsAddingColumn(false)}
                >
                  <X size={13} strokeWidth={1.5} />
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="btn-editorial btn-editorial--primary"
                >
                  Crear Columna
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTask(null)}
        />
      )}
    </div>
  );
}
