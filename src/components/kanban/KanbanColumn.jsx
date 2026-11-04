import React, { useState } from 'react';
import { Plus, X, AlertCircle, Calendar as CalendarIcon } from 'lucide-react';
import KanbanCard from './KanbanCard';

export default function KanbanColumn({
  column,
  tasks,
  usersMap,
  currentUserId,
  onSelectTask,
  onCreateTask,
  dragState,
  onDragStartCard,
  onDragEndCard,
  onDragOverColumn,
  onDragOverCard,
  onDropInColumn,
}) {
  const [isAddingCard, setIsAddingCard] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newPriority, setNewPriority] = useState('MEDIA');
  const [newDueDate, setNewDueDate] = useState('');
  const [newTagInput, setNewTagInput] = useState('');

  const wipLimit = Number(column.limite_wip || 0);
  const isWipExceeded = wipLimit > 0 && tasks.length > wipLimit;
  const isWipAtLimit = wipLimit > 0 && tasks.length === wipLimit;
  const isDropTarget = dragState.overColumnId === column.id_columna;

  const handleQuickCreateSubmit = (e) => {
    e.preventDefault();
    const cleanTitle = newTitle.trim();
    if (!cleanTitle) return;

    const tags = newTagInput
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    const dueIso = newDueDate ? new Date(`${newDueDate}T18:00:00`).toISOString() : '';

    onCreateTask({
      id_proyecto: column.id_proyecto,
      id_columna: column.id_columna,
      titulo: cleanTitle,
      prioridad: newPriority,
      fecha_vencimiento: dueIso,
      etiquetas_json: tags,
      ids_asignados: currentUserId ? [currentUserId] : ['usr_01'],
      syncCalendar: Boolean(dueIso),
    });

    setNewTitle('');
    setNewPriority('MEDIA');
    setNewDueDate('');
    setNewTagInput('');
    setIsAddingCard(false);
  };

  return (
    <section
      className={[
        'kanban-column',
        isDropTarget ? 'kanban-column--drop-active' : '',
        isWipExceeded ? 'kanban-column--wip-exceeded' : '',
      ]
        .filter(Boolean)
        .join(' ')}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOverColumn(column.id_columna);
      }}
      onDrop={(e) => {
        e.preventDefault();
        onDropInColumn(column.id_columna);
      }}
    >
      <header className="kanban-column__header">
        <div className="kanban-column__title-group">
          <span
            className="kanban-column__color-bar"
            style={{ backgroundColor: column.color_indicador || '#111111' }}
          />
          <h3 className="kanban-column__title">{column.nombre_columna}</h3>
          {column.pendingSync && (
            <span className="kanban-column__sync-tag">SYNC</span>
          )}
        </div>

        <div className="kanban-column__header-actions">
          <span
            className={[
              'kanban-column__counter',
              isWipExceeded ? 'kanban-column__counter--exceeded' : '',
              isWipAtLimit ? 'kanban-column__counter--limit' : '',
            ]
              .filter(Boolean)
              .join(' ')}
            title={
              wipLimit > 0
                ? `Límite WIP: ${wipLimit} tareas máximas`
                : 'Total de tarjetas en esta etapa'
            }
          >
            {String(tasks.length).padStart(2, '0')}
            {wipLimit > 0 ? `/${String(wipLimit).padStart(2, '0')}` : ''}
          </span>

          <button
            type="button"
            className="icon-btn"
            onClick={() => setIsAddingCard((v) => !v)}
            title="Crear nueva tarjeta en esta columna"
          >
            <Plus size={15} strokeWidth={1.5} />
          </button>
        </div>
      </header>

      {isWipExceeded && (
        <div className="kanban-column__wip-banner">
          <AlertCircle size={12} strokeWidth={1.75} />
          <span>Límite WIP superado ({tasks.length}/{wipLimit})</span>
        </div>
      )}

      {isAddingCard && (
        <form className="kanban-quick-form" onSubmit={handleQuickCreateSubmit}>
          <input
            type="text"
            className="editorial-input"
            placeholder="Título de la tarea o entregable..."
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            autoFocus
          />

          <div className="kanban-quick-form__row">
            <select
              className="editorial-select"
              value={newPriority}
              onChange={(e) => setNewPriority(e.target.value)}
            >
              <option value="BAJA">Prioridad Baja</option>
              <option value="MEDIA">Prioridad Media</option>
              <option value="ALTA">Prioridad Alta</option>
              <option value="CRITICA">Prioridad Crítica</option>
            </select>

            <label className="kanban-quick-form__date" title="Fecha de entrega">
              <CalendarIcon size={12} strokeWidth={1.5} />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
              />
            </label>
          </div>

          <input
            type="text"
            className="editorial-input editorial-input--sm"
            placeholder="Etiquetas separadas por coma (ej. Curricular, Urgente)"
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
          />

          <div className="kanban-quick-form__actions">
            <button
              type="button"
              className="btn-editorial btn-editorial--ghost"
              onClick={() => setIsAddingCard(false)}
            >
              <X size={13} strokeWidth={1.5} />
              Cancelar
            </button>
            <button type="submit" className="btn-editorial btn-editorial--primary">
              Agregar Tarjeta
            </button>
          </div>
        </form>
      )}

      <div className="kanban-column__cards">
        {tasks.length === 0 && !isAddingCard ? (
          <div className="kanban-column__empty">
            <p>Sin tarjetas en esta etapa</p>
            <span>Arrastra una tarjeta aquí o pulsa +</span>
          </div>
        ) : (
          tasks.map((task) => {
            const isCardDropTarget =
              dragState.overColumnId === column.id_columna &&
              dragState.overTaskId === task.id_tarea;
            return (
              <KanbanCard
                key={task.id_tarea}
                task={task}
                usersMap={usersMap}
                onSelectTask={onSelectTask}
                onDragStartCard={onDragStartCard}
                onDragEndCard={onDragEndCard}
                onDragOverCard={(taskId, pos) =>
                  onDragOverCard(column.id_columna, taskId, pos)
                }
                isDragging={dragState.draggedTaskId === task.id_tarea}
                dropPosition={isCardDropTarget ? dragState.dropPosition : null}
              />
            );
          })
        )}
      </div>

      {!isAddingCard && (
        <footer className="kanban-column__footer">
          <button
            type="button"
            className="kanban-column__add-trigger"
            onClick={() => setIsAddingCard(true)}
          >
            <Plus size={14} strokeWidth={1.5} />
            <span>Nueva tarjeta</span>
          </button>
        </footer>
      )}
    </section>
  );
}
