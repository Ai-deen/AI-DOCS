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
        <div className="absolute inset-0 backface-hidden bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm p-6 flex flex-col justify-center">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-2">Question</p>
          <p className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed">{question}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-auto">Click to reveal answer</p>
        </div>

        {/* Back - Answer */}
        <div className="absolute inset-0 backface-hidden rotate-y-180 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl shadow-sm p-6 flex flex-col justify-center">
          <p className="text-xs font-semibold text-purple-600 dark:text-purple-400 uppercase mb-2">Answer</p>
          <p className="text-gray-800 dark:text-gray-100 text-sm leading-relaxed">{answer}</p>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-auto">Click to see question</p>
        </div>
      </div>
    </div>
  );
}
