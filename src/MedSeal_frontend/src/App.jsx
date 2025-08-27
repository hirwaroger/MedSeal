import { IdentityKitProvider } from "@nfid/identitykit/react";
import "@nfid/identitykit/react/styles.css";
import { AuthProvider } from './hooks/useAuth';
import AppRoutes from './routes/AppRoutes';

function App() {
  // Get your backend canister ID from environment or use a fallback
  const backendCanisterId = process.env.CANISTER_ID_MEDSEAL_BACKEND || 
                           import.meta.env.VITE_CANISTER_ID_MEDSEAL_BACKEND ||
                           'oqjvn-fqaaa-aaaab-qab5q-cai'; // Fallback for development

  if (!backendCanisterId) {
    console.error('LOG: Backend Canister ID is undefined. Ensure it is set in the environment variables.');
  } else {
    console.log('LOG: App starting with Backend Canister ID:', backendCanisterId);
  }

  return (
    <IdentityKitProvider>
      <AuthProvider>
        <div className="App">
          <AppRoutes />
        </div>
      </AuthProvider>
    </IdentityKitProvider>
  );
}

export default App;