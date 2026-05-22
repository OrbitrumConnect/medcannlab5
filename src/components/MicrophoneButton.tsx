import React, { useState } from 'react';

interface MicrophoneButtonProps {
  onStart: () => void;
  onStop: () => void;
  isRecording: boolean;
}

const MicrophoneButton: React.FC<MicrophoneButtonProps> = ({ onStart, onStop, isRecording }) => {
  return (
    <button
      className={`ml-2 px-4 py-2 rounded-lg font-semibold transition-colors flex items-center ${isRecording ? 'bg-red-600 text-brand-text animate-pulse' : 'bg-brand-surface-subtle text-blue-400 hover:bg-blue-600'}`}
      onClick={isRecording ? onStop : onStart}
      aria-label={isRecording ? 'Parar gravação' : 'Iniciar gravação'}
    >
      {isRecording ? (
        <span role="img" aria-label="Gravando">🎤🔴</span>
      ) : (
        <span role="img" aria-label="Microfone">🎤</span>
      )}
    </button>
  );
};

export default MicrophoneButton;
