import React, { createContext, useContext, useState, useCallback } from 'react';

const ConfirmContext = createContext(null);
export const useConfirm = () => useContext(ConfirmContext);

export const ConfirmProvider = ({ children }) => {
  const [opts, setOpts] = useState({ open: false, title: '', message: '' });
  const [resolver, setResolver] = useState(null);

  const showConfirm = useCallback((message, title = 'Please confirm') => {
    return new Promise((resolve) => {
      setOpts({ open: true, message, title });
      setResolver(() => resolve);
    });
  }, []);

  const handleClose = (val) => {
    setOpts((o) => ({ ...o, open: false }));
    if (resolver) resolver(val);
    setResolver(null);
  };

  return (
    <ConfirmContext.Provider value={{ showConfirm }}>
      {children}
      {opts.open && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 2000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(2,6,23,0.6)' }} />
          <div style={{ position: 'relative', width: 'min(640px, 92%)', borderRadius: 14, padding: 22, background: '#0b1220', color: '#e6eef8', boxShadow: '0 10px 40px rgba(2,6,23,0.8)', border: '1px solid rgba(255,255,255,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 56, height: 56, borderRadius: 12, background: 'linear-gradient(135deg,#6366f1,#a78bfa)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                ✓
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{opts.title}</div>
                <div style={{ color: '#9fb0d9', marginTop: 6 }}>{opts.message}</div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 18 }}>
              <button onClick={() => handleClose(false)} style={{ background: 'transparent', border: '1px solid rgba(255,255,255,0.06)', color: '#b6c6e0', padding: '8px 14px', borderRadius: 10 }}>Cancel</button>
              <button onClick={() => handleClose(true)} style={{ background: 'linear-gradient(135deg,#667eea,#764ba2)', border: 'none', color: '#fff', padding: '10px 16px', borderRadius: 10, fontWeight: 700 }}>OK</button>
            </div>
          </div>
        </div>
      )}
    </ConfirmContext.Provider>
  );
};

export default ConfirmContext;
