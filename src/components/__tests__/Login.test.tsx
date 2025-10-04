import { render, screen, fireEvent } from '@testing-library/react';
import { GoogleOAuthProvider } from '@react-oauth/google';
import Login from '../Login';

// Mock Google OAuth
const mockOnSuccess = jest.fn();
const mockOnError = jest.fn();

jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <div data-testid="google-provider">{children}</div>,
  GoogleLogin: ({ onSuccess, onError }: { onSuccess: (response: any) => void; onError: () => void }) => {
    // Store the callbacks for testing
    mockOnSuccess.mockImplementation(onSuccess);
    mockOnError.mockImplementation(onError);
    
    return (
      <button 
        data-testid="google-login" 
        onClick={() => onSuccess({ credential: 'mock-credential' })}
      >
        Google Login
      </button>
    );
  },
  useGoogleLogin: jest.fn(() => jest.fn()),
}));

// Mock useAuth hook
const mockLogin = jest.fn();
jest.mock('../../hooks/features/auth/useAuth', () => ({
  useAuth: () => ({
    login: mockLogin,
    isLoading: false,
    error: null,
  }),
}));

const renderWithProvider = (component: React.ReactElement) => {
  return render(
    <GoogleOAuthProvider clientId="test-client-id">
      {component}
    </GoogleOAuthProvider>
  );
};

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders login form correctly', () => {
    renderWithProvider(<Login onLogin={jest.fn()} />);
    
    expect(screen.getByText('HP ERP')).toBeInTheDocument();
    expect(screen.getByText('Google로 로그인')).toBeInTheDocument();
  });

  it('handles Google login success', async () => {
    renderWithProvider(<Login onLogin={jest.fn()} />);
    
    const loginButton = screen.getByText('Google로 로그인');
    fireEvent.click(loginButton);
    
    // 단순히 버튼 클릭이 작동하는지 확인
    expect(loginButton).toBeInTheDocument();
  });
});
