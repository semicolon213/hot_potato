import React from 'react';
import { useGoogleLogin } from '@react-oauth/google';
// jwtDecode is no longer strictly needed if we fetch userinfo, but keep for now if needed elsewhere
// import { jwtDecode } from 'jwt-decode';

interface LoginProps {
  onLoginSuccess: (profile: any, accessToken: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLoginSuccess }) => {
  const login = useGoogleLogin({
    onSuccess: async tokenResponse => { // Make onSuccess async
      try {
        const userInfoResponse = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: {
            Authorization: `Bearer ${tokenResponse.access_token}`,
          },
        });
        const profile = await userInfoResponse.json();
        onLoginSuccess(profile, tokenResponse.access_token);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        // Fallback to a generic profile if user info fetch fails
        onLoginSuccess({ email: 'unknown', name: 'Unknown User' }, tokenResponse.access_token);
      }
    },
    onError: () => console.log('Login Failed'),
    scope: 'https://www.googleapis.com/auth/calendar.readonly profile email', // Keep these scopes
  });

  return (
    <button onClick={() => login()}>
      Sign in with Google
    </button>
  );
};

export default Login;
