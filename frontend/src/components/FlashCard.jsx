import { useState } from 'react';

export default function FlashCard({ question, answer }) {
  const [flipped, setFlipped] = useState(false);

  return (
    <div
      className="cursor-pointer perspective-1000"
      onClick={() => setFlipped(!flipped)}
    >
      <div
        className={`relative w-full h-48 transition-transform duration-500 transform-style-3d ${
          flipped ? 'rotate-y-180' : ''
        }`}
      >
        {/* Front - Question */}
        <div className="absolute inset-0 backface-hidden bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex flex-col justify-center">
          <p className="text-xs font-semibold text-purple-600 uppercase mb-2">Question</p>
          <p className="text-gray-800 text-sm leading-relaxed">{question}</p>
          <p className="text-xs text-gray-400 mt-auto">Click to reveal answer</p>
        </div>

        {/* Back - Answer */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-purple-50 border border-purple-200 rounded-xl shadow-sm p-6 flex flex-col justify-center">
          <p className="text-xs font-semibold text-purple-600 uppercase mb-2">Answer</p>
          <p className="text-gray-800 text-sm leading-relaxed">{answer}</p>
          <p className="text-xs text-gray-400 mt-auto">Click to see question</p>
        </div>
      </div>
    </div>
  );
}
