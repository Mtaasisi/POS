import React, { useState } from 'react';
import { Play, Pause, Volume2, VolumeX, Maximize, ExternalLink } from 'lucide-react';

interface VideoTutorial {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  videoUrl: string;
  duration: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  language: 'swahili' | 'english';
  tags: string[];
}

interface VideoTutorialsProps {
  issue: string;
  deviceType: string;
  language: 'swahili' | 'english';
  onVideoSelect?: (video: VideoTutorial) => void;
}

const VideoTutorials: React.FC<VideoTutorialsProps> = ({
  issue,
  deviceType,
  language,
  onVideoSelect
}) => {
  const [selectedVideo, setSelectedVideo] = useState<VideoTutorial | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  // Mock video data - in real app, this would come from API
  const mockVideos: VideoTutorial[] = [
    {
      id: '1',
      title: 'How to Replace iPhone Screen',
      description: 'Step-by-step guide to replace cracked iPhone screen',
      thumbnail: '/api/placeholder/300/200',
      videoUrl: 'https://example.com/video1.mp4',
      duration: '8:45',
      difficulty: 'intermediate',
      language: 'english',
      tags: ['iphone', 'screen', 'replacement']
    },
    {
      id: '2',
      title: 'Jinsi ya Kurekebisha Battery ya Simu',
      description: 'Maelezo kamili ya kubadilisha betri ya simu',
      thumbnail: '/api/placeholder/300/200',
      videoUrl: 'https://example.com/video2.mp4',
      duration: '12:30',
      difficulty: 'beginner',
      language: 'swahili',
      tags: ['battery', 'replacement', 'swahili']
    },
    {
      id: '3',
      title: 'Advanced Motherboard Repair',
      description: 'Professional motherboard troubleshooting and repair',
      thumbnail: '/api/placeholder/300/200',
      videoUrl: 'https://example.com/video3.mp4',
      duration: '25:15',
      difficulty: 'advanced',
      language: 'english',
      tags: ['motherboard', 'advanced', 'repair']
    }
  ];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-700';
      case 'advanced':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getDifficultyText = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return language === 'swahili' ? 'Mwanzo' : 'Beginner';
      case 'intermediate':
        return language === 'swahili' ? 'Wastani' : 'Intermediate';
      case 'advanced':
        return language === 'swahili' ? 'Tajiri' : 'Advanced';
      default:
        return difficulty;
    }
  };

  const handleVideoSelect = (video: VideoTutorial) => {
    setSelectedVideo(video);
    setIsPlaying(false);
    onVideoSelect?.(video);
  };

  const filteredVideos = mockVideos.filter(video => 
    video.language === language && 
    (video.tags.some(tag => issue.toLowerCase().includes(tag)) ||
     video.title.toLowerCase().includes(deviceType.toLowerCase()))
  );

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">
          {language === 'swahili' ? 'Video za Mafunzo' : 'Video Tutorials'}
        </h3>
        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1">
          <ExternalLink size={16} />
          {language === 'swahili' ? 'Tazama Zote' : 'View All'}
        </button>
      </div>

      {/* Selected Video Player */}
      {selectedVideo && (
        <div className="mb-6">
          <div className="relative bg-black rounded-lg overflow-hidden">
            <div className="aspect-video bg-gray-900 flex items-center justify-center">
              <div className="text-center text-white">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Play size={24} className="ml-1" />
                </div>
                <p className="text-sm opacity-75">Video Player</p>
              </div>
            </div>
            
            {/* Video Controls */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <div className="flex items-center gap-4">
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-white hover:text-gray-300"
                >
                  {isPlaying ? <Pause size={20} /> : <Play size={20} />}
                </button>
                <button
                  onClick={() => setIsMuted(!isMuted)}
                  className="text-white hover:text-gray-300"
                >
                  {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
                <div className="flex-1 bg-white/20 rounded-full h-1">
                  <div className="bg-white h-1 rounded-full w-1/3"></div>
                </div>
                <button className="text-white hover:text-gray-300">
                  <Maximize size={20} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="mt-3">
            <h4 className="font-semibold text-gray-900">{selectedVideo.title}</h4>
            <p className="text-sm text-gray-600 mt-1">{selectedVideo.description}</p>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-500">{selectedVideo.duration}</span>
              <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(selectedVideo.difficulty)}`}>
                {getDifficultyText(selectedVideo.difficulty)}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Video List */}
      <div className="space-y-3">
        {filteredVideos.length > 0 ? (
          filteredVideos.map((video) => (
            <div
              key={video.id}
              className={`flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                selectedVideo?.id === video.id 
                  ? 'bg-blue-50 border border-blue-200' 
                  : 'hover:bg-gray-50 border border-transparent'
              }`}
              onClick={() => handleVideoSelect(video)}
            >
              <div className="relative w-20 h-12 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play size={16} className="text-gray-600" />
                </div>
              </div>
              
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-sm text-gray-900 truncate">{video.title}</h4>
                <p className="text-xs text-gray-600 mt-1 line-clamp-2">{video.description}</p>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-xs text-gray-500">{video.duration}</span>
                  <span className={`text-xs px-2 py-1 rounded-full ${getDifficultyColor(video.difficulty)}`}>
                    {getDifficultyText(video.difficulty)}
                  </span>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p className="text-sm">
              {language === 'swahili' 
                ? 'Hakuna video za mafunzo zinazopatikana kwa tatizo hili' 
                : 'No video tutorials available for this issue'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default VideoTutorials;
