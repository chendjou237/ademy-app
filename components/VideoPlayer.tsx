import { AVPlaybackStatus, ResizeMode, Video } from 'expo-av';
import React, { useRef, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { getVideoPlaybackUrl } from '../lib/bunny';
import { AppText, Button } from './ui';

interface VideoPlayerProps {
  videoId?: string;
  videoUrl?: string;
  title?: string;
  onComplete?: () => void;
  showControls?: boolean;
}



export const VideoPlayer: React.FC<VideoPlayerProps> = ({
  videoId,
  videoUrl,
  title,
  onComplete,
  showControls = true,
}) => {
  const { theme } = useTheme();
  const videoRef = useRef<Video>(null);
  const [status, setStatus] = useState<AVPlaybackStatus | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);

  const getVideoSource = () => {
    if (videoUrl && videoUrl.startsWith('bunny://')) {
      // Parse bunny:// URL format
      const parts = videoUrl.replace('bunny://', '').split('/');
      const videoIdFromUrl = parts[1];
      return { uri: getVideoPlaybackUrl(videoIdFromUrl) };
    } else if (videoId) {
      return { uri: getVideoPlaybackUrl(videoId) };
    } else if (videoUrl) {
      return { uri: videoUrl };
    }
    return null;
  };

  const handlePlaybackStatusUpdate = (playbackStatus: AVPlaybackStatus) => {
    setStatus(playbackStatus);

    if (playbackStatus.isLoaded && playbackStatus.durationMillis) {
      // Check if video is completed (watched 90% or more)
      const progress = playbackStatus.positionMillis / playbackStatus.durationMillis;
      if (progress >= 0.9 && !isCompleted) {
        setIsCompleted(true);
        onComplete?.();
      }
    }
  };

  const handlePlayPause = async () => {
    if (!videoRef.current || !status?.isLoaded) return;

    try {
      if (status.isPlaying) {
        await videoRef.current.pauseAsync();
      } else {
        await videoRef.current.playAsync();
      }
    } catch (error) {
      console.error('Error controlling video playback:', error);
    }
  };

  const handleRestart = async () => {
    if (!videoRef.current) return;

    try {
      await videoRef.current.setPositionAsync(0);
      await videoRef.current.playAsync();
      setIsCompleted(false);
    } catch (error) {
      console.error('Error restarting video:', error);
    }
  };

  const videoSource = getVideoSource();

  if (!videoSource) {
    return (
      <View style={[styles.container, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.placeholder}>
          <AppText variant="body" color="textSecondary" align="center">
            Aucune vidéo disponible
          </AppText>
          {title && (
            <AppText variant="bodySmall" color="textLight" align="center" style={{ marginTop: theme.spacing.xs }}>
              {title}
            </AppText>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Video
        ref={videoRef}
        source={videoSource}
        rate={1.0}
        volume={1.0}
        isMuted={false}
        resizeMode={ResizeMode.CONTAIN}
        shouldPlay={false}
        useNativeControls={showControls}
        style={styles.video}
        onPlaybackStatusUpdate={handlePlaybackStatusUpdate}
        onError={(error) => {
          console.error('Video playback error:', error);
          Alert.alert('Erreur', 'Impossible de lire la vidéo');
        }}
      />

      {!showControls && (
        <View style={styles.customControls}>
          <Button
            variant="primary"
            onPress={handlePlayPause}
            disabled={!status?.isLoaded}
          >
            {status?.isLoaded && status.isPlaying ? 'Pause' : 'Lecture'}
          </Button>

          {isCompleted && (
            <Button
              variant="outline"
              onPress={handleRestart}
              style={{ marginLeft: 8 }}
            >
              Recommencer
            </Button>
          )}
        </View>
      )}

      {status?.isLoaded && status.durationMillis && (
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${(status.positionMillis / status.durationMillis) * 100}%`,
                  backgroundColor: theme.colors.primary
                }
              ]}
            />
          </View>

          <View style={styles.timeContainer}>
            <AppText variant="caption" color="textLight">
              {formatTime(status.positionMillis)} / {formatTime(status.durationMillis)}
            </AppText>
          </View>
        </View>
      )}
    </View>
  );
};

const formatTime = (milliseconds: number | undefined): string => {
  if (!milliseconds) return '0:00';
  const totalSeconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  video: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  customControls: {
    position: 'absolute',
    bottom: 60,
    left: 16,
    right: 16,
    flexDirection: 'row',
    justifyContent: 'center',
  },
  progressContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: 2,
    marginBottom: 4,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  timeContainer: {
    alignItems: 'center',
  },
});
