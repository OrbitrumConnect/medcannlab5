import React, { useState } from 'react';

interface MobileChatInputProps {
  onSend: (message: string) => void;
}

const MobileChatInput: React.FC<MobileChatInputProps> = ({ onSend }) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="flex items-center w-full p-2 bg-brand-surface rounded-lg shadow-lg">
      <input
        type="text"
        className="flex-1 px-3 py-2 rounded-lg bg-brand-surface-subtle text-brand-text focus:outline-none"
        placeholder="Digite sua mensagem..."
        value={message}
        onChange={e => setMessage(e.target.value)}
        onKeyDown={e => e.key === 'Enter' ? handleSend() : undefined}
      />
      <button
        className="ml-2 px-4 py-2 bg-blue-600 text-brand-text rounded-lg font-semibold hover:bg-blue-700 transition-colors"
        onClick={handleSend}
      >Enviar</button>
    </div>
  );
};

export default MobileChatInput;
