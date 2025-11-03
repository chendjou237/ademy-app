import React from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useTheme } from '../contexts/ThemeContext';
import { AppText } from './ui';

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

  const getEmbedUrl = () => {
    let sourceVideoId = null;
    let libraryId = '527238'; // Default library ID

    if (videoUrl && videoUrl.startsWith('bunny://')) {
      // Parse bunny:// URL format: bunny://LIBRARY_ID/VIDEO_ID
      const parts = videoUrl.replace('bunny://', '').split('/');
      libraryId = parts[0];
      sourceVideoId = parts[1];
    } else if (videoId) {
      sourceVideoId = videoId;
    }

    if (sourceVideoId) {
      const embedUrl = `https://iframe.mediadelivery.net/embed/${libraryId}/${sourceVideoId}?autoplay=false&preload=true`;
      console.log('Using Bunny.net embed URL:', embedUrl);
      return embedUrl;
    }

    return null;
  };

  const embedUrl = getEmbedUrl();

  if (!embedUrl) {
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
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsFullscreenVideo={true}
        allowsInlineMediaPlayback={true}
        mediaPlaybackRequiresUserAction={false}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        startInLoadingState={true}
        onLoad={() => {
          console.log('Video WebView loaded successfully');
          // Don't auto-complete - let user manually mark as complete
        }}
        onError={(error) => {
          console.error('WebView error:', error);
        }}
        onHttpError={(error) => {
          console.error('WebView HTTP error:', error);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    aspectRatio: 16 / 9,
    backgroundColor: '#000',
    borderRadius: 8,
    overflow: 'hidden',
  },
  webview: {
    flex: 1,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
});
