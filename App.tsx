
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { BuyStickerPage } from './pages/BuyStickerPage';
import { WalletPage } from './pages/WalletPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { VerifyTicketPage } from './pages/VerifyTicketPage';
import { dbService } from './services/mockDb';

const App: React.FC = () => {
  // State-based routing
  const [currentView, setCurrentView] = useState<string>('home');
  const [verifyCode, setVerifyCode] = useState<string>('');

  useEffect(() => {
      // URL Parameter Handling for QR Codes & MP Returns
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const codeParam = params.get('code');
      
      // Mercado Pago Return Params
      const status = params.get('collection_status') || params.get('status');
      const externalRef = params.get('external_reference');

      // Wompi Return
      const wompiId = params.get('id'); 
      const refParam = params.get('reference'); // PaymentService adds this to redirect URL

      if (viewParam === 'verify' && codeParam) {
          setVerifyCode(codeParam);
          setCurrentView('verify');
      }
      
      // Handle Successful Payment Return from Mercado Pago
      if (status === 'approved' && externalRef) {
          finishPurchase(externalRef, 'MercadoPago');
      }

      // Handle Wompi Return
      if (wompiId) {
           if (refParam) {
               finishPurchase(refParam, 'Wompi');
           } else {
               // Fallback if reference missing
               alert("Pago Wompi detectado. Ve a Mis Tickets para verificar estado.");
               setCurrentView('wallet');
           }
      }

  }, []);

  const finishPurchase = (code: string, gateway: string) => {
      // We need to clear the URL so it doesn't re-trigger on refresh
      window.history.replaceState({}, '', '/'); 
      
      // Execute purchase / Confirm Pending
      dbService.confirmTicketPayment(code).then(result => {
          if (result.success) {
              alert(`¡Pago Exitoso vía ${gateway}! Tu ticket ha sido activado.`);
              setCurrentView('wallet');
          } else {
              alert("Info: " + result.message);
              setCurrentView('wallet'); // Go to wallet anyway to see status
          }
      });
  };

  const handleBuyClick = () => {
    setCurrentView('buy');
  };

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onBuyClick={handleBuyClick} />;
      case 'buy':
        return <BuyStickerPage onSuccess={() => setCurrentView('wallet')} onBack={() => setCurrentView('home')} />;
      case 'wallet':
        return <WalletPage />;
      case 'admin':
        return <AdminDashboard />;
      case 'verify':
        return <VerifyTicketPage code={verifyCode} onHome={() => setCurrentView('home')} />;
      default:
        return <HomePage onBuyClick={handleBuyClick} />;
    }
  };

  if (currentView === 'verify') {
      return <VerifyTicketPage code={verifyCode} onHome={() => {
          window.history.pushState({}, '', '/');
          setCurrentView('home');
      }} />;
  }

  return (
    <Layout currentView={currentView} setView={setCurrentView}>
      {renderView()}
    </Layout>
  );
};

export default App;
