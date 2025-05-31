'use client';

import { useState } from 'react';

export default function HoroscopeComponent({ quiz }) {
  const [selectedSign, setSelectedSign] = useState('');
  const [showHoroscope, setShowHoroscope] = useState(false);

  const zodiacSigns = [
    { name: 'Baran', icon: '♈', dates: '21.03 - 19.04' },
    { name: 'Byk', icon: '♉', dates: '20.04 - 20.05' },
    { name: 'Bliznieta', icon: '♊', dates: '21.05 - 20.06' },
    { name: 'Rak', icon: '♋', dates: '21.06 - 22.07' },
    { name: 'Lew', icon: '♌', dates: '23.07 - 22.08' },
    { name: 'Panna', icon: '♍', dates: '23.08 - 22.09' },
    { name: 'Waga', icon: '♎', dates: '23.09 - 22.10' },
    { name: 'Skorpion', icon: '♏', dates: '23.10 - 21.11' },
    { name: 'Strzelec', icon: '♐', dates: '22.11 - 21.12' },
    { name: 'Koziorozec', icon: '♑', dates: '22.12 - 19.01' },
    { name: 'Wodnik', icon: '♒', dates: '20.01 - 18.02' },
    { name: 'Ryby', icon: '♓', dates: '19.02 - 20.03' }
  ];

  const getHoroscopeForSign = (signName) => {
    return quiz.questions.find(q => 
      q.text.toLowerCase().includes(signName.toLowerCase())
    );
  };

  const handleSignSelect = (signName) => {
    setSelectedSign(signName);
    setShowHoroscope(true);
  };

  if (showHoroscope && selectedSign) {
    const horoscope = getHoroscopeForSign(selectedSign);
    const selectedSignData = zodiacSigns.find(sign => sign.name === selectedSign);

    return (
      <div className="max-w-2xl mx-auto p-6">
        <div className="bg-gradient-to-r from-purple-400 to-pink-400 rounded-lg shadow-lg p-8 text-white">
          <div className="text-center mb-6">
            <div className="text-6xl mb-2">{selectedSignData.icon}</div>
            <h2 className="text-3xl font-bold">{selectedSign}</h2>
            <p className="text-lg opacity-90">{selectedSignData.dates}</p>
          </div>
          
          <div className="bg-white/20 rounded-lg p-6 mb-6">
            <h3 className="text-xl font-semibold mb-3">Twój horoskop na dziś:</h3>
            <p className="text-lg leading-relaxed">
              {horoscope.text.replace(`${selectedSign}: `, '')}
            </p>
          </div>

          <button
            onClick={() => {setShowHoroscope(false); setSelectedSign('');}}
            className="w-full bg-white text-purple-600 py-3 rounded-lg font-semibold hover:bg-gray-100"
          >
            Wybierz inny znak
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent mb-4">
          {quiz.title}
        </h1>
        <p className="text-xl text-gray-600">Wybierz swój znak zodiaku</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {zodiacSigns.map((sign) => (
          <button
            key={sign.name}
            onClick={() => handleSignSelect(sign.name)}
            className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transform hover:scale-105 transition-all duration-200 border-2 hover:border-purple-300"
          >
            <div className="text-4xl mb-2">{sign.icon}</div>
            <h3 className="font-bold text-lg">{sign.name}</h3>
            <p className="text-sm text-gray-500">{sign.dates}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
