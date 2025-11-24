
import React, { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { HomePage } from './pages/HomePage';
import { BuyStickerPage } from './pages/BuyStickerPage';
import { WalletPage } from './pages/WalletPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { VerifyTicketPage } from './pages/VerifyTicketPage';
import { dbService } from './services/db';

const App: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('home');
  const [verifyCode, setVerifyCode] = useState<string>('');

  useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const viewParam = params.get('view');
      const codeParam = params.get('code');
      
      const status = params.get('collection_status') || params.get('status');
      const externalRef = params.get('external_reference');

      const wompiId = params.get('id'); 
      const refParam = params.get('reference');

      if (viewParam === 'verify' && codeParam) {
          setVerifyCode(codeParam);
          setCurrentView('verify');
      }
      
      if (status === 'approved' && externalRef) {
          finishPurchase(externalRef, 'MercadoPago');
      }

      if (wompiId) {
           if (refParam) {
               finishPurchase(refParam, 'Wompi');
           } else {
               alert("Pago Wompi detectado. Ve a Mis Tickets para verificar estado.");
               setCurrentView('wallet');
           }
      }

  }, []);

  const finishPurchase = (code: string, gateway: string) => {
      window.history.replaceState({}, '', '/'); 
      
      dbService.approveTicketManually(code).then(result => {
          if (result) {
              alert(`¡Pago Exitoso vía ${gateway}! Tu ticket ha sido activado.`);
              setVerifyCode(code);
              setCurrentView('verify');
          } else {
              alert("Info: Error activando ticket");
              setCurrentView('wallet');
          }
      });
  };

  const handleBuySuccess = (stickerCode: string) => {
    setVerifyCode(stickerCode);
    setCurrentView('verify');
    window.history.pushState({}, '', `/?view=verify&code=${stickerCode}`);
  }

  const renderView = () => {
    switch (currentView) {
      case 'home':
        return <HomePage onBuyClick={() => setCurrentView('buy')} />;
      case 'buy':
        return <BuyStickerPage onSuccess={handleBuySuccess} onBack={() => setCurrentView('home')} />;
      case 'wallet':
        return <WalletPage onSuccess={handleBuySuccess} />;
      case 'admin':
        return <AdminDashboard />;
      case 'verify':
        return <VerifyTicketPage code={verifyCode} onHome={() => setCurrentView('home')} />;
      default:
        return <HomePage onBuyClick={() => setCurrentView('buy')} />;
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
