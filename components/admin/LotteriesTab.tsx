
import React, { useState, useEffect } from 'react';
import { Sticker, GlobalSettings, LotteryResult } from '../../types';
import { Award, Trophy, MessageCircle, Calendar } from 'lucide-react';
import { dbService } from '../../services/db';

interface LotteriesTabProps {
  stickers: Sticker[];
  settings: GlobalSettings | null;
  loadData: () => void;
}

interface NotificationInfo {
    name: string;
    phone: string;
    winningNumber: string;
    prizeAmount: number;
}

export const LotteriesTab: React.FC<LotteriesTabProps> = ({ stickers, settings, loadData }) => {
  const [winningNumber, setWinningNumber] = useState('');
  const [lotteryWinner, setLotteryWinner] = useState<Sticker | null>(null);
  const [lotteryHistory, setLotteryHistory] = useState<LotteryResult[]>([]);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    const history = await dbService.getLotteryHistory();
    setLotteryHistory(history);
  };

  const handleSetWinningNumber = async () => {
    setLotteryWinner(null);
    if (winningNumber.length !== 4) {
        alert("El número debe tener 4 dígitos.");
        return;
    }

    if (!window.confirm(`¿Estás seguro de establecer ${winningNumber} como número ganador?`)) {
        return;
    }

    try {
        await dbService.updateSettings({ ...settings, winningNumber } as GlobalSettings);
        
        const winner = stickers.find(s => s.numbers === winningNumber && s.status === 'active');
        
        const prizeAmount = settings?.dailyPrizeAmount || 0;

        const newResult: LotteryResult = {
            drawnAt: new Date().toISOString(),
            winningNumber: winningNumber,
            prizeAmount: prizeAmount,
        };

        if (winner) {
            setLotteryWinner(winner);
            newResult.winnerInfo = {
                name: winner.ownerData.fullName,
                phone: winner.ownerData.phone,
                ticketNumber: winner.numbers
            };
        } else {
            alert("No se encontró un ticket ganador activo para este número (se guardará el sorteo sin ganador).");
        }
        
        const savedResult = await dbService.addLotteryResult(newResult);

        if (!savedResult) {
            throw new Error("El resultado del sorteo no se pudo guardar en la base de datos.");
        }

        alert(`Número ganador ${winningNumber} establecido y guardado en el historial.`);
        await fetchHistory(); 
        await loadData();

    } catch (error) {
        console.error("--- DEBUG: ERROR AL GUARDAR SORTEO ---", error);
        alert("¡ERROR! No se pudo guardar el sorteo. Por favor, abre la consola de desarrollador para ver los detalles del problema y envíamelos.");
    }
};

const formatMoney = (val: number) => new Intl.NumberFormat('es-CO', { style: 'currency', currency: 'COP', maximumFractionDigits: 0 }).format(val);

const handleSendWhatsAppNotification = (info: NotificationInfo) => {
    if (!info.phone) return;

    const cleanPhone = info.phone.replace(/\+/g, '');
    const message = `¡Felicidades ${info.name}! 🎉\n\nHas ganado el sorteo de GanarApp con el número *${info.winningNumber}*.\n\n*Premio Ganado:* ${formatMoney(info.prizeAmount)}\n\n¡Contáctanos a este número para reclamar tu premio!`;
    
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
}

const handleSendBaileysNotification = async (info: NotificationInfo) => {
    if (!info.phone) {
        alert("No se encontró el número de teléfono.");
        return;
    }

    const cleanPhone = info.phone.replace(/\+/g, '');
    const message = `¡Felicidades ${info.name}! 🎉\n\nHas ganado el sorteo de GanarApp con el número *${info.winningNumber}*.\n\n*Premio Ganado:* ${formatMoney(info.prizeAmount)}\n\n¡Contáctanos a este número para reclamar tu premio!`;

    try {
        const response = await fetch('http://localhost:3001/send-message', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ to: cleanPhone, message }),
        });
        if (response.ok) {
            alert('Mensaje de felicitación enviado por Baileys.');
        } else {
            alert('Error al enviar el mensaje por Baileys.');
        }
    } catch (error) {
        console.error('Error sending Baileys message:', error);
        alert('Error de conexión con el servidor de Baileys.');
    }
}


  return (
    <div className="space-y-4">
        <div className="bg-navy-card p-4 rounded-xl border border-white/5">
            <h3 className="text-brand-400 font-bold uppercase text-sm flex items-center gap-2">
                <Award size={18} /> Ingresar Número Ganador
            </h3>
            <div className="flex gap-2 mt-4">
                <input 
                    type="text" 
                    maxLength={4}
                    value={winningNumber}
                    onChange={(e) => setWinningNumber(e.target.value)}
                    className="w-full bg-navy-900 border border-navy-700 rounded-lg p-3 text-white font-mono text-lg tracking-widest text-center focus:border-brand-500 outline-none"
                    placeholder="0000"
                />
                <button 
                    onClick={handleSetWinningNumber}
                    className="bg-brand-500 hover:bg-brand-400 text-navy-950 font-bold px-6 py-2 rounded-lg"
                >
                    Guardar
                </button>
            </div>
        </div>

        {lotteryWinner && (
            <div className="bg-green-500/10 border border-green-500/30 p-4 rounded-xl animate-in fade-in duration-500">
                <h3 className="text-green-400 font-bold uppercase text-sm flex items-center gap-2">
                    <Trophy size={18} /> ¡Ticket Ganador Encontrado!
                </h3>
                <div className="mt-3 bg-navy-900/50 p-3 rounded-lg">
                    <p className="text-sm text-slate-300">Número: <span className="font-bold text-white tracking-widest">{lotteryWinner.numbers}</span></p>
                    <p className="text-sm text-slate-300">Ganador: <span className="font-bold text-white">{lotteryWinner.ownerData.fullName}</span></p>
                    <p className="text-sm text-slate-300">Teléfono: <span className="font-bold text-white">{lotteryWinner.ownerData.phone}</span></p>
                </div>
                <button
                    onClick={() => {
                        if (!lotteryWinner) return;
                        handleSendWhatsAppNotification({
                            name: lotteryWinner.ownerData.fullName,
                            phone: lotteryWinner.ownerData.phone,
                            winningNumber: lotteryWinner.numbers,
                            prizeAmount: settings?.dailyPrizeAmount || 0
                        });
                    }}
                    className="mt-4 w-full bg-green-500 hover:bg-green-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                    <MessageCircle size={16} /> Notificar Ganador por WhatsApp
                </button>
                <button
                    onClick={() => {
                        if (!lotteryWinner) return;
                        handleSendBaileysNotification({
                            name: lotteryWinner.ownerData.fullName,
                            phone: lotteryWinner.ownerData.phone,
                            winningNumber: lotteryWinner.numbers,
                            prizeAmount: settings?.dailyPrizeAmount || 0
                        });
                    }}
                    className="mt-2 w-full bg-blue-500 hover:bg-blue-400 text-white font-bold py-3 rounded-lg flex items-center justify-center gap-2"
                >
                    <MessageCircle size={16} /> Enviar por Baileys (Prueba)
                </button>
            </div>
        )}

        <div className="space-y-4 pt-4 border-t border-white/10">
            <h3 className="text-slate-400 font-bold uppercase text-sm flex items-center gap-2">
                <Calendar size={18} /> Historial de Sorteos
            </h3>
            {lotteryHistory.length === 0 ? (
                <div className="text-center text-sm text-slate-500 py-10">Aún no hay sorteos registrados.</div>
            ) : (
                lotteryHistory.map(result => (
                    <div key={result.id} className="bg-navy-card p-4 rounded-xl border border-white/5">
                        <div className="flex justify-between items-center">
                            <div>
                                <p className="text-sm text-slate-300">Número Sorteado: <span className="font-bold text-brand-400 tracking-widest">{result.winningNumber}</span></p>
                                <p className="text-[10px] text-slate-500">{new Date(result.drawnAt).toLocaleString('es-CO')}</p>
                            </div>
                            <div className="text-right">
                                <p className="font-bold text-lg text-white">{formatMoney(result.prizeAmount)}</p>
                            </div>
                        </div>
                        {result.winnerInfo ? (
                            <div className="mt-3 pt-3 border-t border-white/10 bg-green-500/5 p-3 rounded-lg">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <p className="text-xs text-green-300 font-bold">Ganador:</p>
                                        <p className="text-sm text-white">{result.winnerInfo.name}</p>
                                        <p className="text-sm text-slate-400 font-mono">{result.winnerInfo.phone}</p>
                                    </div>
                                    <div className="flex flex-col">
                                    <button
                                        onClick={() => {
                                            if (!result.winnerInfo) return;
                                            handleSendWhatsAppNotification({
                                                name: result.winnerInfo.name,
                                                phone: result.winnerInfo.phone,
                                                winningNumber: result.winningNumber,
                                                prizeAmount: result.prizeAmount
                                            });
                                        }}
                                        className="bg-green-500/80 hover:bg-green-500 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 shrink-0"
                                    >
                                        <MessageCircle size={14} /> Notificar
                                    </button>
                                    <button
                                        onClick={() => {
                                            if (!result.winnerInfo) return;
                                            handleSendBaileysNotification({
                                                name: result.winnerInfo.name,
                                                phone: result.winnerInfo.phone,
                                                winningNumber: result.winningNumber,
                                                prizeAmount: result.prizeAmount
                                            });
                                        }}
                                        className="bg-blue-500/80 hover:bg-blue-500 text-white text-xs font-bold py-2 px-3 rounded-lg flex items-center gap-1.5 shrink-0 mt-2"
                                    >
                                        <MessageCircle size={14} /> Baileys
                                    </button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="mt-2 text-center text-xs text-slate-500 font-bold py-1">SIN GANADOR</div>
                        )}
                    </div>
                ))
            )}
        </div>
    </div>
  );
};
