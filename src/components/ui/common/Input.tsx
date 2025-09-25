// 재사용 가능한 입력 컴포넌트

import React from 'react';

interface InputProps {
  type?: 'text' | 'email' | 'password' | 'number' | 'tel' | 'url' | 'search';
  placeholder?: string;
  value?: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLInputElement>) => void;
  onFocus?: (e: React.FocusEvent<HTMLInputElement>) => void;
  disabled?: boolean;
  required?: boolean;
  autoComplete?: string;
  className?: string;
  dataOid?: string;
  id?: string;
  name?: string;
  min?: number;
  max?: number;
  step?: number;
}

const Input: React.FC<InputProps> = ({
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  onFocus,
  disabled = false,
  required = false,
  autoComplete,
  className = '',
  dataOid,
  id,
  name,
  min,
  max,
  step
}) => {
  const inputClasses = [
    'input',
    className
  ].filter(Boolean).join(' ');

  return (
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      onBlur={onBlur}
      onFocus={onFocus}
      disabled={disabled}
      required={required}
      autoComplete={autoComplete}
      className={inputClasses}
      data-oid={dataOid}
      id={id}
      name={name}
      min={min}
      max={max}
      step={step}
    />
  );
};

export default Input;
