import React, { useState } from 'react';
import {
  Lock,
  UserPlus,
  LogIn,
  Sparkles,
  CheckCircle2,
  FolderPlus,
} from 'lucide-react';
import useAppStore from '../../store/useAppStore';

export default function AuthGateView({ inviteContext = null, onAuthenticated }) {
  const loginWithCredentials = useAppStore((s) => s.loginWithCredentials);
  const registerUser = useAppStore((s) => s.registerUser);
  const getInvitationsByEmail = useAppStore((s) => s.getInvitationsByEmail);

  const [mode, setMode] = useState(inviteContext ? 'REGISTER' : 'LOGIN');
  const [errorMsg, setErrorMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regArea, setRegArea] = useState('');
  const [blankProjectName, setBlankProjectName] = useState('');

  const detectedInvites = getInvitationsByEmail(regEmail || loginEmail);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!loginEmail.trim() || !loginPassword.trim()) {
      setErrorMsg('Por favor ingresa tu correo institucional y tu contraseña.');
      return;
    }
    setSubmitting(true);
    try {
      await loginWithCredentials({
        email: loginEmail.trim(),
        password: loginPassword.trim(),
        inviteProjectId: inviteContext?.projectId || '',
        inviteRole: inviteContext?.role || 'COLABORADOR',
      });
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      if (onAuthenticated) onAuthenticated();
    } catch (err) {
      setErrorMsg(
        err.message || 'Credenciales incorrectas. Verifica tu correo y contraseña.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleRegisterSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    if (!regName.trim() || !regEmail.trim() || !regPassword.trim()) {
      setErrorMsg(
        'Completa tu nombre, correo electrónico y define una contraseña de seguridad.'
      );
      return;
    }
    if (regPassword.trim().length < 4) {
      setErrorMsg('La contraseña debe tener al menos 4 caracteres.');
      return;
    }

    setSubmitting(true);
    try {
      await registerUser({
        nombre_completo: regName.trim(),
        email: regEmail.trim(),
        password: regPassword.trim(),
        area_adscripcion: regArea.trim() || 'Comunidad Universitaria UNRC',
        rol: inviteContext?.role || 'ADMIN',
        createPersonalWorkspace: true,
        nombre_espacio_propio:
          blankProjectName.trim() ||
          `Proyecto en Blanco · ${regName.trim()}`,
        id_proyecto_invitado: inviteContext?.projectId || '',
        invited_channels: inviteContext?.channels || [],
        switchSession: true,
      });
      if (typeof window !== 'undefined' && window.location.search) {
        window.history.replaceState({}, '', window.location.pathname);
      }
      if (onAuthenticated) onAuthenticated();
    } catch (err) {
      setErrorMsg(err.message || 'No se pudo completar el registro.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-gate-screen">
      <div className="auth-gate-card">
        <header className="auth-gate-card__header">
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '0.75rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <span className="editorial-brand__mark">UNRC</span>
              <div>
                <h1
                  style={{
                    fontSize: '0.98rem',
                    fontWeight: 700,
                    color: '#111111',
                    letterSpacing: '-0.01em',
                  }}
                >
                  SISTEMA DE PROYECTOS Y CONVERSACIÓN
                </h1>
                <span
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: '0.66rem',
                    color: '#55555A',
                  }}
                >
                  ACCESO PRIVADO POR CREDENCIALES · PROYECTOS POR EQUIPO
                </span>
              </div>
            </div>
            <span className="role-chip role-chip--guinda">
              <Lock size={11} strokeWidth={1.8} style={{ marginRight: 4 }} />
              SEGURO
            </span>
          </div>
        </header>

        {inviteContext && (
          <div className="invite-welcome-banner">
            <div className="invite-welcome-banner__icon">
              <Sparkles size={16} strokeWidth={1.75} />
            </div>
            <div className="invite-welcome-banner__content">
              <strong>Invitación Privada por Link al Proyecto</strong>
              <p>
                Proyecto:{' '}
                <strong>
                  {inviteContext.projectName || inviteContext.projectId}
                </strong>{' '}
                · Nivel:{' '}
                <span className="role-chip role-chip--guinda">
                  {inviteContext.role || 'COLABORADOR'}
                </span>
                {inviteContext.channels?.length > 0 && (
                  <span>
                    {' '}
                    · Conversaciones incluidas:{' '}
                    <code>{inviteContext.channels.join(', ')}</code>
                  </span>
                )}
              </p>
            </div>
          </div>
        )}

        <div className="auth-gate-card__tabs">
          <button
            type="button"
            onClick={() => {
              setMode('LOGIN');
              setErrorMsg('');
            }}
            className={`auth-gate-tab ${
              mode === 'LOGIN' ? 'auth-gate-tab--active' : ''
            }`}
          >
            <LogIn size={14} strokeWidth={1.75} />
            <span>Iniciar Sesión</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setMode('REGISTER');
              setErrorMsg('');
            }}
            className={`auth-gate-tab ${
              mode === 'REGISTER' ? 'auth-gate-tab--active' : ''
            }`}
          >
            <UserPlus size={14} strokeWidth={1.75} />
            <span>Crear Cuenta (Proyecto en Blanco)</span>
          </button>
        </div>

        {mode === 'LOGIN' ? (
          <form className="auth-gate-card__body" onSubmit={handleLoginSubmit}>
            <p style={{ fontSize: '0.82rem', color: '#55555A', lineHeight: 1.5 }}>
              Ingresa con tu <strong>correo electrónico y contraseña</strong> para
              acceder únicamente a tus proyectos privados y a los equipos donde
              hayas sido invitado/a.
            </p>

            {errorMsg && <div className="auth-error-alert">{errorMsg}</div>}

            <div>
              <label className="editorial-label">
                CORREO ELECTRÓNICO INSTITUCIONAL
              </label>
              <input
                type="email"
                className="editorial-input"
                placeholder="nombre.apellido@unrc.edu.mx"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                required
                autoFocus
              />
            </div>

            <div>
              <label className="editorial-label">CONTRASEÑA DE ACCESO</label>
              <input
                type="password"
                className="editorial-input"
                placeholder="Ingresa tu contraseña..."
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-editorial btn-editorial--primary"
              style={{ width: '100%', padding: '0.65rem', marginTop: '0.35rem' }}
              disabled={submitting}
            >
              <LogIn size={15} strokeWidth={1.75} />
              <span>
                {submitting
                  ? 'Verificando credenciales...'
                  : 'Entrar a Mis Proyectos'}
              </span>
            </button>

            <div
              style={{
                marginTop: '0.35rem',
                paddingTop: '0.75rem',
                borderTop: '1px solid #EAEAEA',
                fontSize: '0.75rem',
                color: '#55555A',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <span>¿Es tu primera vez en la plataforma?</span>
              <button
                type="button"
                className="btn-editorial btn-editorial--ghost"
                onClick={() => {
                  setMode('REGISTER');
                  setErrorMsg('');
                }}
              >
                Crear cuenta y proyecto en blanco
              </button>
            </div>
          </form>
        ) : (
          <form className="auth-gate-card__body" onSubmit={handleRegisterSubmit}>
            <p style={{ fontSize: '0.82rem', color: '#55555A', lineHeight: 1.5 }}>
              Al registrarte, tu primera página será un{' '}
              <strong>proyecto en blanco privado</strong> para que tu equipo cree
              sus propios proyectos, columnas y canales de conversación desde cero.
            </p>

            {errorMsg && <div className="auth-error-alert">{errorMsg}</div>}

            <div className="team-form-grid">
              <div>
                <label className="editorial-label">NOMBRE COMPLETO</label>
                <input
                  type="text"
                  className="editorial-input"
                  placeholder="Ej. Dra. Claudia Morales"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="editorial-label">CORREO ELECTRÓNICO</label>
                <input
                  type="email"
                  className="editorial-input"
                  placeholder="correo@unrc.edu.mx"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="editorial-label">
                  CREA TU CONTRASEÑA PRIVADA
                </label>
                <input
                  type="password"
                  className="editorial-input"
                  placeholder="Mínimo 4 caracteres"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                  required
                />
              </div>

              <div>
                <label className="editorial-label">ÁREA O EQUIPO UNRC</label>
                <input
                  type="text"
                  className="editorial-input"
                  placeholder="Ej. Academia / Coordinación"
                  value={regArea}
                  onChange={(e) => setRegArea(e.target.value)}
                />
              </div>
            </div>

            <div>
              <label className="editorial-label">
                <FolderPlus size={12} strokeWidth={1.6} />
                NOMBRE DE TU PRIMER PROYECTO EN BLANCO
              </label>
              <input
                type="text"
                className="editorial-input"
                placeholder={
                  regName.trim()
                    ? `Proyecto en Blanco · ${regName.trim()}`
                    : 'Ej. Proyecto de mi Equipo UNRC'
                }
                value={blankProjectName}
                onChange={(e) => setBlankProjectName(e.target.value)}
              />
            </div>

            {detectedInvites.length > 0 && (
              <div
                style={{
                  padding: '0.65rem 0.85rem',
                  backgroundColor: '#FDF4F6',
                  border: '1px solid #9D2449',
                  borderRadius: '2px',
                  fontSize: '0.76rem',
                }}
              >
                <strong style={{ color: '#9D2449' }}>
                  Invitaciones por correo detectadas para tu cuenta:
                </strong>
                {detectedInvites.map((inv) => (
                  <div key={inv.id_proyecto} style={{ marginTop: '0.25rem' }}>
                    • <strong>{inv.nombre_proyecto}</strong> ({inv.rol})
                  </div>
                ))}
              </div>
            )}

            <button
              type="submit"
              className="btn-editorial btn-editorial--primary"
              style={{ width: '100%', padding: '0.65rem', marginTop: '0.35rem' }}
              disabled={submitting}
            >
              <CheckCircle2 size={15} strokeWidth={1.75} />
              <span>
                {submitting
                  ? 'Configurando tu proyecto en blanco...'
                  : 'Registrar mis Credenciales e Iniciar Proyecto en Blanco'}
              </span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
