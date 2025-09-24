import React from 'react';
import ReactDOM from 'react-dom/client';

const TestApp = () => {
  return (
    <div>
      <h1>Test App</h1>
      <p>React is working!</p>
    </div>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(<TestApp />);
