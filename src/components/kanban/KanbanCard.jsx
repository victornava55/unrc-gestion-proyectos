import React from 'react';
import {
  Calendar,
  CalendarCheck2,
  CheckSquare,
  MailCheck,
  MessageSquare,
  Paperclip,
  RefreshCw,
} from 'lucide-react';
import {
  PRIORITY_CONFIG,
  formatShortDate,
  getInitials,
  isOverdue,
} from '../../utils/formatters';

export default function KanbanCard({
  task,
  usersMap,
  onSelectTask,
  onDragStartCard,
  onDragEndCard,
  onDragOverCard,
  isDragging,
  dropPosition,
}) {
  const priority = PRIORITY_CONFIG[task.prioridad] || PRIORITY_CONFIG.MEDIA;
  const tags = Array.isArray(task.etiquetas_json) ? task.etiquetas_json : [];
  const checklist = Array.isArray(task.checklist_json) ? task.checklist_json : [];
  const attachments = Array.isArray(task.adjuntos_json) ? task.adjuntos_json : [];
  const assignedIds = Array.isArray(task.ids_asignados) ? task.ids_asignados : [];
  const sentNotifications = Array.isArray(task.notificaciones_enviadas)
    ? task.notificaciones_enviadas
    : [];

  const calendarEventId = task.id_evento_calendar || task.calendar_event_id || '';
  const isCalendarLinked = Boolean(calendarEventId);
  const hasEmailsSent = sentNotifications.length > 0;

  const completedChecks = checklist.filter((item) => item.hecho).length;
  const overdue = isOverdue(task.fecha_vencimiento);
  const shortDue = formatShortDate(task.fecha_vencimiento);
  const messageCount = Number(task.conteo_mensajes || 0);

  const handleDragStart = (e) => {
    e.stopPropagation();
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', task.id_tarea);
    if (onDragStartCard) {
      onDragStartCard(task);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const midY = rect.top + rect.height / 2;
    const position = e.clientY < midY ? 'before' : 'after';
    if (onDragOverCard) {
      onDragOverCard(task.id_tarea, position);
    }
  };

  return (
    <div
      className="kanban-card-wrapper"
      onDragOver={handleDragOver}
      style={{ position: 'relative' }}
    >
      {dropPosition === 'before' && (
        <div className="kanban-drop-indicator kanban-drop-indicator--top" />
      )}

      <article
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEndCard}
        onClick={() => onSelectTask(task.id_tarea)}
        className={[
          'kanban-card',
          task.prioridad === 'CRITICA' ? 'kanban-card--critical' : '',
          isDragging ? 'kanban-card--dragging' : '',
          task.pendingSync ? 'kanban-card--syncing' : '',
        ]
          .filter(Boolean)
          .join(' ')}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onSelectTask(task.id_tarea);
          }
        }}
      >
        <div className="kanban-card__top">
          <span
            className="kanban-card__priority"
            style={{
              color: priority.textColor,
              backgroundColor: priority.bgColor,
              borderColor: priority.borderColor,
            }}
          >
            <span
              className="kanban-card__priority-dot"
              style={{ backgroundColor: priority.dotColor }}
            />
            {priority.label}
          </span>

          <div className="kanban-card__meta-right">
            {task.pendingSync ? (
              <span className="kanban-card__sync-badge" title="Sincronizando con Google Sheets">
                <RefreshCw size={11} strokeWidth={1.75} className="spin-icon" />
                SYNC
              </span>
            ) : (
              <span className="kanban-card__id">
                {String(task.id_tarea).replace('tmp_', '').slice(0, 8)}
              </span>
            )}
          </div>
        </div>

        <h4 className="kanban-card__title">{task.titulo}</h4>

        {task.descripcion_md && (
          <p className="kanban-card__excerpt">{task.descripcion_md}</p>
        )}

        {tags.length > 0 && (
          <div className="kanban-card__tags">
            {tags.map((tag, idx) => (
              <span key={`${tag}-${idx}`} className="kanban-card__tag">
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="kanban-card__footer">
          <div className="kanban-card__indicators">
            {shortDue && (
              <span
                className={[
                  'kanban-card__stat',
                  overdue ? 'kanban-card__stat--overdue' : '',
                  isCalendarLinked ? 'kanban-card__stat--cal-linked' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                title={
                  isCalendarLinked
                    ? `Vinculado con Google Calendar (ID: ${calendarEventId})`
                    : 'Fecha de entrega'
                }
              >
                {isCalendarLinked ? (
                  <CalendarCheck2 size={12} strokeWidth={1.75} className="icon-accent-unrc" />
                ) : (
                  <Calendar size={12} strokeWidth={1.5} />
                )}
                <span>{shortDue}</span>
              </span>
            )}

            {hasEmailsSent && (
              <span
                className="kanban-card__stat kanban-card__stat--mail-sent"
                title={`Notificación enviada por correo (MailApp) a: ${sentNotifications
                  .map((n) => n.email || n.nombre_completo)
                  .join(', ')}`}
              >
                <MailCheck size={12} strokeWidth={1.65} />
                <span>{sentNotifications.length}</span>
              </span>
            )}

            {checklist.length > 0 && (
              <span
                className={`kanban-card__stat ${
                  completedChecks === checklist.length && checklist.length > 0
                    ? 'kanban-card__stat--done'
                    : ''
                }`}
                title="Progreso de subtareas"
              >
                <CheckSquare size={12} strokeWidth={1.5} />
                <span>
                  {completedChecks}/{checklist.length}
                </span>
              </span>
            )}

            {attachments.length > 0 && (
              <span className="kanban-card__stat" title="Archivos adjuntos">
                <Paperclip size={12} strokeWidth={1.5} />
                <span>{attachments.length}</span>
              </span>
            )}

            <span
              className={`kanban-card__stat ${
                messageCount > 0 ? 'kanban-card__stat--active' : ''
              }`}
              title="Comentarios en el hilo de esta tarjeta"
            >
              <MessageSquare size={12} strokeWidth={1.5} />
              <span>{messageCount}</span>
            </span>
          </div>

          <div className="kanban-card__avatars">
            {assignedIds.slice(0, 3).map((uid) => {
              const user = usersMap.get(uid);
              const name = user ? user.nombre_completo : uid;
              return (
                <span
                  key={uid}
                  className="kanban-avatar"
                  title={`Responsable: ${name}`}
                >
                  {user?.avatar_url ? (
                    <img src={user.avatar_url} alt={name} />
                  ) : (
                    getInitials(name)
                  )}
                </span>
              );
            })}
            {assignedIds.length > 3 && (
              <span className="kanban-avatar kanban-avatar--more">
                +{assignedIds.length - 3}
              </span>
            )}
          </div>
        </div>
      </article>

      {dropPosition === 'after' && (
        <div className="kanban-drop-indicator kanban-drop-indicator--bottom" />
      )}
    </div>
  );
}
