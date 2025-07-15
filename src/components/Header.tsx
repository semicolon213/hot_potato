import React from 'react';

interface HeaderProps {
  onPageChange: (pageName: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onPageChange }) => {
  return (
    <header className="header">
      {/* Header content goes here */}
      <p>Header Component</p>
      {/* Example of using onPageChange */}
      {/* <button onClick={() => onPageChange('somePage')}>Go to Some Page</button> */}
    </header>
  );
};

export default Header;
