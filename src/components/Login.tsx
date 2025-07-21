import React from 'react';
import { GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

interface LoginProps {
  onLoginSuccess: (profile: any) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const handleSuccess = (credentialResponse: any) => {
    const profile = jwtDecode(credentialResponse.credential);
    onLoginSuccess(profile);
  };

  const handleError = () => {
    console.log('Login Failed');
  };

  return <GoogleLogin onSuccess={handleSuccess} onError={handleError} />;
};

export default Login;
