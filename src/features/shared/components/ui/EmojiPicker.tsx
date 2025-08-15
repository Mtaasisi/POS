import React, { useState } from 'react';
import { Smile } from 'lucide-react';

interface EmojiPickerProps {
  onEmojiSelect: (emoji: string) => void;
  trigger?: React.ReactNode;
}

const EmojiPicker: React.FC<EmojiPickerProps> = ({ onEmojiSelect, trigger }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('smileys');

  const emojiCategories = {
    smileys: {
      name: 'Smileys & People',
      emojis: [
        '😀', '😃', '😄', '😁', '😆', '😅', '🤣', '😂', '🙂', '🙃',
        '😉', '😊', '😇', '🥰', '😍', '🤩', '😘', '😗', '😚', '😙',
        '🥲', '😋', '😛', '😜', '🤪', '😝', '🤑', '🤗', '🤭', '🤫',
        '🤔', '🤐', '🤨', '😐', '😑', '😶', '😏', '😒', '🙄', '😬',
        '🤥', '😔', '😪', '🤤', '😴', '😷', '🤒', '🤕', '🤢', '🤮'
      ]
    },
    gestures: {
      name: 'Hand Gestures',
      emojis: [
        '👋', '🤚', '🖐️', '✋', '🖖', '👌', '🤌', '🤏', '✌️', '🤞',
        '🤟', '🤘', '🤙', '👈', '👉', '👆', '🖕', '👇', '☝️', '👍',
        '👎', '👊', '✊', '🤛', '🤜', '👏', '🙌', '👐', '🤲', '🤝',
        '🙏', '✍️', '💅', '🤳', '💪', '🦾', '🦿', '🦵', '🦶', '👂'
      ]
    },
    hearts: {
      name: 'Hearts & Love',
      emojis: [
        '❤️', '🧡', '💛', '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔',
        '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '💟', '☮️',
        '✝️', '☪️', '🕉️', '☸️', '✡️', '🔯', '🕎', '☯️', '☦️', '🛐'
      ]
    },
    objects: {
      name: 'Objects',
      emojis: [
        '📱', '💻', '⌚', '📷', '📹', '🎥', '📺', '📻', '🎵', '🎶',
        '🎼', '🎹', '🥁', '🎷', '🎺', '🎸', '🪕', '🎻', '🎤', '🎧',
        '📢', '📣', '📯', '🔔', '🔕', '🎪', '🎭', '🩰', '🎨', '🎬'
      ]
    },
    nature: {
      name: 'Nature',
      emojis: [
        '🌱', '🌿', '🍀', '🎍', '🎋', '🍃', '🍂', '🍁', '🌾', '🌲',
        '🌳', '🌴', '🌵', '🌶️', '🍄', '🌰', '🎃', '🌻', '🌺', '🌸',
        '🌷', '🌹', '🥀', '🌼', '🌻', '🌞', '🌝', '🌛', '🌜', '🌚'
      ]
    },
    food: {
      name: 'Food & Drink',
      emojis: [
        '🍎', '🍊', '🍋', '🍌', '🍉', '🍇', '🍓', '🫐', '🍈', '🍒',
        '🍑', '🥭', '🍍', '🥥', '🥝', '🍅', '🍆', '🥑', '🥦', '🥬',
        '🥒', '🌶️', '🫑', '🌽', '🥕', '🫒', '🧄', '🧅', '🥔', '🍠'
      ]
    }
  };

  const handleEmojiClick = (emoji: string) => {
    onEmojiSelect(emoji);
    setIsOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
        type="button"
      >
        {trigger || <Smile size={20} />}
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          
          {/* Emoji Picker */}
          <div className="absolute bottom-12 left-0 bg-white border border-gray-200 rounded-lg shadow-lg z-50 w-80 h-96">
            {/* Header */}
            <div className="flex border-b border-gray-200">
              {Object.entries(emojiCategories).map(([key, category]) => (
                <button
                  key={key}
                  onClick={() => setSelectedCategory(key)}
                  className={`flex-1 px-2 py-3 text-xs font-medium transition-colors ${
                    selectedCategory === key
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {category.name.split(' ')[0]}
                </button>
              ))}
            </div>

            {/* Emoji Grid */}
            <div className="p-4 h-80 overflow-y-auto">
              <div className="grid grid-cols-8 gap-2">
                {emojiCategories[selectedCategory as keyof typeof emojiCategories].emojis.map((emoji, index) => (
                  <button
                    key={index}
                    onClick={() => handleEmojiClick(emoji)}
                    className="w-8 h-8 flex items-center justify-center text-lg hover:bg-gray-100 rounded transition-colors"
                    title={emoji}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default EmojiPicker;