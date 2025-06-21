import { useAuth } from '@/context/AuthContext';

export function DashboardPage() {
  const { user } = useAuth();

  console.log('DashboardPage rendered, user:', user);

  return (
    <div style={{ padding: '20px', backgroundColor: 'white', minHeight: '100vh' }}>
      <h1 style={{ color: 'black', fontSize: '24px', marginBottom: '20px' }}>
        Dashboard Test
      </h1>
      <p style={{ color: 'black' }}>
        Welcome, {user?.username || 'Guest'}!
      </p>
      <p style={{ color: 'black' }}>
        User role: {user?.role || 'Unknown'}
      </p>
      <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px' }}>
        <p style={{ color: 'black' }}>If you can see this, the component is rendering correctly.</p>
      </div>
    </div>
  );
}
