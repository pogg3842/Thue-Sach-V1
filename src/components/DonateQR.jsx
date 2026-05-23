import React, { useState } from 'react';
import { Coffee, Heart } from 'lucide-react';

const DonateQR = ({ theme }) => {
    const [showQR, setShowQR] = useState(false);
    
    const isDark = theme === 'dark';

    return (
        <div className={`mt-10 py-12 px-6 border-t ${isDark ? 'border-zinc-800' : 'border-zinc-200'} text-center`}>
            <div className="max-w-md mx-auto">
                <Heart size={32} className={`mx-auto mb-4 ${isDark ? 'text-zinc-600' : 'text-red-400'}`} />
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-zinc-900'}`}>Bạn thấy truyện hay chứ?</h3>
                <p className={`text-sm mb-6 ${isDark ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    Nhóm dịch đã thức trắng đêm để ra mắt chương này. Nếu bạn thấy hay, hãy mời nhóm một ly cà phê để có thêm động lực nhé! ☕
                </p>
                
                {!showQR ? (
                    <button 
                        onClick={() => setShowQR(true)}
                        className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-8 rounded-full inline-flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-orange-500/30"
                    >
                        <Coffee size={20} /> Mời 1 ly Cà phê
                    </button>
                ) : (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <div className="bg-white p-4 rounded-3xl inline-block shadow-2xl">
                            {/* Dummy QR Code using placehold.co or UI element */}
                            <img 
                                src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=MoMo-0123456789" 
                                alt="Donate QR" 
                                className="w-48 h-48 rounded-xl"
                            />
                            <p className="text-zinc-900 font-bold mt-3">Quét mã MoMo/ZaloPay</p>
                        </div>
                        <div className="mt-4">
                            <button 
                                onClick={() => setShowQR(false)}
                                className={`text-sm font-medium underline ${isDark ? 'text-zinc-500 hover:text-zinc-300' : 'text-zinc-400 hover:text-zinc-600'}`}
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DonateQR;
