import React, { useState, useRef, useEffect } from 'react';
import { Mic, MicOff, Play, Pause, Send, X } from 'lucide-react';

interface VoiceRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel?: () => void;
  isRecording: boolean;
  onStartRecording: () => void;
  onStopRecording: () => void;
}

const VoiceRecorder: React.FC<VoiceRecorderProps> = ({
  onRecordingComplete,
  onCancel,
  isRecording,
  onStartRecording,
  onStopRecording
}) => {
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [recordingDuration, setRecordingDuration] = useState(0);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isRecording) {
      startRecording();
    } else {
      stopRecording();
    }

    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [isRecording]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        
        // Calculate duration
        const audio = new Audio(URL.createObjectURL(blob));
        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };
      };

      mediaRecorder.start();
      setRecordingDuration(0);
      
      // Start recording timer
      recordingIntervalRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('Could not access microphone. Please check permissions.');
      onStopRecording();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
    }
    
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioBlob) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      if (!audioRef.current.src) {
        audioRef.current.src = URL.createObjectURL(audioBlob);
      }
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSend = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, duration);
      setAudioBlob(null);
      setDuration(0);
      setCurrentTime(0);
      setRecordingDuration(0);
    }
  };

  const handleCancel = () => {
    setAudioBlob(null);
    setDuration(0);
    setCurrentTime(0);
    setRecordingDuration(0);
    if (onCancel) onCancel();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Recording state
  if (isRecording) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-red-50 border border-red-200 rounded-lg">
        <div className="flex items-center space-x-2">
          <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
          <span className="text-red-700 font-medium">Recording...</span>
        </div>
        <span className="text-red-600 font-mono">{formatTime(recordingDuration)}</span>
        <button
          onClick={onStopRecording}
          className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
        >
          <MicOff size={16} />
        </button>
      </div>
    );
  }

  // Preview state
  if (audioBlob) {
    return (
      <div className="flex items-center space-x-3 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <button
          onClick={handlePlayPause}
          className="p-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} />}
        </button>
        
        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <div className="flex-1 bg-blue-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: duration > 0 ? `${(currentTime / duration) * 100}%` : '0%' }}
              ></div>
            </div>
            <span className="text-blue-700 text-sm font-mono">
              {formatTime(duration)}
            </span>
          </div>
        </div>

        <button
          onClick={handleCancel}
          className="p-2 text-gray-500 hover:text-gray-700 transition-colors"
        >
          <X size={16} />
        </button>
        
        <button
          onClick={handleSend}
          className="p-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors"
        >
          <Send size={16} />
        </button>

        <audio
          ref={audioRef}
          onTimeUpdate={() => {
            if (audioRef.current) {
              setCurrentTime(audioRef.current.currentTime);
            }
          }}
          onEnded={() => {
            setIsPlaying(false);
            setCurrentTime(0);
          }}
          className="hidden"
        />
      </div>
    );
  }

  // Default mic button
  return (
    <button
      onClick={onStartRecording}
      className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
      title="Record voice message"
    >
      <Mic size={20} />
    </button>
  );
};

export default VoiceRecorder;