import { IdentityKitProvider } from "@nfid/identitykit/react";
import "@nfid/identitykit/react/styles.css";
import { AuthProvider } from './hooks/useAuth';
import AppRoutes from './routes/AppRoutes';

function App() {
  // Get your backend canister ID from environment or use a fallback
  const backendCanisterId = process.env.CANISTER_ID_MEDSEAL_BACKEND || 
                           import.meta.env.VITE_CANISTER_ID_MEDSEAL_BACKEND ||
                           'rrkah-fqaaa-aaaaa-aaaaq-cai'; // fallback for development

  console.log('LOG: App starting with Backend Canister ID:', backendCanisterId);

  return (
    <IdentityKitProvider
      signerClientOptions={{
        targets: [backendCanisterId]
      }}
      onConnectFailure={(error) => {
        console.error('LOG: NFID connection failed:', error);
        console.log('LOG: Connection failure details:', {
          message: error.message,
          stack: error.stack,
          canisterId: backendCanisterId
        });
      }}
      onConnectSuccess={() => {
        console.log('LOG: NFID connection successful');
        console.log('LOG: Connection established with canister:', backendCanisterId);
      }}
      onDisconnect={() => {
        console.log('LOG: NFID disconnected');
        // Clear session on disconnect and redirect to login page
        import('./utils/session').then(({ sessionUtils }) => {
          sessionUtils.clearSession();
          console.log('LOG: Session cleared on disconnect');
          window.location.href = '/login';
        });
      }}
    >
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </IdentityKitProvider>
  );
}

export default App;