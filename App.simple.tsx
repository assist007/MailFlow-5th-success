import React from 'react';

const SimpleApp: React.FC = () => {
  return (
    <div style={{ width: '100%', height: '100vh', backgroundColor: '#FFD700', padding: '20px' }}>
      <h1 style={{ color: 'black', fontSize: '48px', fontWeight: 'bold' }}>
        ✓ APPLICATION IS WORKING
      </h1>
      <p style={{ color: 'black', fontSize: '24px', marginTop: '20px' }}>
        If you can see this yellow page, React is rendering correctly!
      </p>
      <div style={{ marginTop: '40px', padding: '20px', backgroundColor: 'white', borderRadius: '8px' }}>
        <p style={{ color: 'black', fontSize: '18px' }}>
          Next steps: We need to fix the original App.tsx component.
        </p>
      </div>
    </div>
  );
};

export default SimpleApp;
