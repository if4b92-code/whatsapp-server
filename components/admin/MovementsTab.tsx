
import React, { useState, useEffect } from 'react';
import { supabase } from '../../services/client';
import { MessageCircle } from 'lucide-react';

interface Movement {
  id: number;
  created_at: string;
  table_name: string;
  action: string;
  data: any;
  user_id: string;
}

export const MovementsTab: React.FC = () => {
  const [movements, setMovements] = useState<Movement[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMovements();
  }, []);

  const fetchMovements = async () => {
    if (!supabase) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('movements')
      .select('*')
      .order('created_at', { descending: true });

    if (error) {
      console.error('Error fetching movements:', error);
    } else {
      const sortedData = (data as Movement[]).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setMovements(sortedData);
    }
    setLoading(false);
  };

  const getMovementDescription = (movement: Movement): string => {
    switch (movement.action) {
        case 'INSERT':
            if (movement.table_name === 'stickers') {
                return `Nuevo ticket #${movement.data.new.numbers} creado.`;
            }
            return `Nuevo registro en ${movement.table_name}`;
        case 'UPDATE':
            if (movement.table_name === 'stickers' && movement.data.old.status === 'pending' && movement.data.new.status === 'active') {
                return `Ticket #${movement.data.new.numbers} pagado.`;
            }
            if (movement.table_name === 'wallets') {
                const balanceChange = movement.data.new.balance - movement.data.old.balance;
                return `Recarga de saldo: ${balanceChange > 0 ? '+' : ''}${balanceChange}`;
            }
            return `Registro actualizado en ${movement.table_name}`;
        case 'DELETE':
            return `Registro eliminado de ${movement.table_name}`;
        case 'VERIFICATION_CODE':
            return `Código de acceso generado para ${movement.data.phone}`;
        case 'WALLET_PURCHASE':
            return `Compra con wallet para ${movement.data.phone}`;
        default:
            return movement.action;
    }
  };

  const getPhoneNumberFromMovement = async (movement: Movement): Promise<string | null> => {
    if (movement.data && movement.data.phone) {
        return movement.data.phone;
    }
    if (movement.data && movement.data.new && movement.data.new.userId) {
        return movement.data.new.userId;
    }
    if (movement.user_id) {
        const { data, error } = await supabase.rpc('get_phone_from_user_id', { p_user_id: movement.user_id });
        if (error) {
            console.error('Error getting phone number:', error);
            return null;
        }
        return data;
    }
    return null;
  };

  const sendWhatsAppMessage = async (movement: Movement) => {
    const userPhoneNumber = await getPhoneNumberFromMovement(movement);
    if (!userPhoneNumber) {
        alert("No se pudo encontrar el número de teléfono para este movimiento.");
        return;
    }

    let message = 'Hola, se ha registrado un nuevo movimiento en tu cuenta:';

    if (movement.action === 'VERIFICATION_CODE') {
        message = `Hola, tu código de acceso para Mis Tickets es: ${movement.data.code}`;
    } else if (movement.action === 'WALLET_PURCHASE') {
        message = `Hola, se ha confirmado tu compra con wallet. ¡Gracias por participar!`;
    } else {
        message = `Hola, se ha registrado un nuevo movimiento en tu cuenta:\n        - ${getMovementDescription(movement)}\n        - Fecha: ${new Date(movement.created_at).toLocaleString()}`;
    }

    const whatsappUrl = `https://wa.me/${userPhoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');

    if (!supabase) return;
    const { error } = await supabase
        .from('movements')
        .delete()
        .eq('id', movement.id);

    if (error) {
        console.error('Error deleting movement:', error);
        alert('Error al eliminar el movimiento.');
    } else {
        setMovements(prevMovements => prevMovements.filter(m => m.id !== movement.id));
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' })}, ${date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
  }

  if (loading) {
    return <div className="text-white">Cargando movimientos...</div>;
  }

  return (
    <div className="space-y-4">
      <h3 className="text-xl font-bold text-white">Registro de Movimientos</h3>
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
          <thead className="text-xs text-gray-300 uppercase bg-navy-800">
            <tr>
              <th scope="col" className="px-4 py-3">Descripción</th>
              <th scope="col" className="px-4 py-3">Fecha</th>
              <th scope="col" className="px-4 py-3 text-center">Acción</th>
            </tr>
          </thead>
          <tbody>
            {movements.map((movement) => (
              <tr key={movement.id} className="border-b border-navy-800 bg-navy-900">
                <td className="px-4 py-4">
                    <p className="font-medium text-white">{getMovementDescription(movement)}</p>
                    <p className="text-xs text-gray-500">{movement.user_id}</p>
                </td>
                <td className="px-4 py-4 text-xs">{formatDate(movement.created_at)}</td>
                <td className="px-4 py-4 text-center">
                    <button
                        onClick={() => sendWhatsAppMessage(movement)}
                        className="px-3 py-2 text-xs font-bold text-white bg-green-500 rounded-lg hover:bg-green-600 flex items-center gap-1.5 mx-auto"
                    >
                        <MessageCircle size={14} />
                        Notificar
                    </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
