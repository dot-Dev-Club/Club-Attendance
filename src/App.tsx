import { AuthProvider, useAuth } from './contexts/AuthContext';
import { DataProvider } from './contexts/DataContext';
import { ToastProvider } from './components/ui/Toast';
import { Login } from './pages/Login';
import { Layout } from './components/Layout';

function AppContent() {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return <Layout />;
}

function App() {
  return (
    <AuthProvider>
      <DataProvider>
        <ToastProvider>
          <AppContent />
        </ToastProvider>
      </DataProvider>
    </AuthProvider>
  );
}

export default App;
