import { useState, useEffect } from 'react';

interface LoadingMessage {
  text: string;
  icon?: string;
  color?: string;
}

const defaultLoadingMessages: LoadingMessage[] = [
  { text: "Loading data...", icon: "📊", color: "text-blue-600" },
  { text: "Fetching inventory...", icon: "📦", color: "text-green-600" },
  { text: "Syncing products...", icon: "🔄", color: "text-purple-600" },
  { text: "Updating categories...", icon: "📁", color: "text-orange-600" },
  { text: "Loading customers...", icon: "👥", color: "text-indigo-600" },
  { text: "Preparing analytics...", icon: "📈", color: "text-teal-600" },
  { text: "Checking stock levels...", icon: "📋", color: "text-red-600" },
  { text: "Connecting to database...", icon: "🔗", color: "text-gray-600" },
  { text: "Optimizing performance...", icon: "⚡", color: "text-yellow-600" },
  { text: "Almost ready...", icon: "🎯", color: "text-pink-600" }
];

interface UseCyclingLoadingMessageOptions {
  messages?: LoadingMessage[];
  interval?: number;
  enabled?: boolean;
}

export const useCyclingLoadingMessage = (options: UseCyclingLoadingMessageOptions = {}) => {
  const {
    messages = defaultLoadingMessages,
    interval = 2000,
    enabled = true
  } = options;

  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentMessage, setCurrentMessage] = useState<LoadingMessage>(messages[0]);

  useEffect(() => {
    if (!enabled || messages.length <= 1) return;

    const timer = setInterval(() => {
      setCurrentIndex((prevIndex) => {
        const nextIndex = (prevIndex + 1) % messages.length;
        setCurrentMessage(messages[nextIndex]);
        return nextIndex;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [messages, interval, enabled]);

  const reset = () => {
    setCurrentIndex(0);
    setCurrentMessage(messages[0]);
  };

  return {
    currentMessage,
    currentIndex,
    totalMessages: messages.length,
    reset
  };
};
