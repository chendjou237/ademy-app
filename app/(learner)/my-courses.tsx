import React, { useEffect, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { EnrolledCourseCard } from '../../components/EnrolledCourseCard';
import { AppText, Card } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { useI18n } from '../../contexts/I18nContext';
import { useTheme } from '../../contexts/ThemeContext';
import { Enrollment, supabase } from '../../lib/supabase';

export default function MyCoursesScreen() {
  const { theme } = useTheme();
  const { t } = useI18n();
  const { user } = useAuth();

  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEnrollments();
    }
  }, [user]);

  const fetchEnrollments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('enrollments')
        .select(`
          *,
          course:courses(
            *,
            profiles!courses_trainer_id_fkey(full_name, avatar_url),
            lessons(count)
          )
        `)
        .eq('learner_id', user.id)
        .order('enrolled_at', { ascending: false });

      if (error) {
        console.error('Error fetching enrollments:', error);
      } else {
        setEnrollments(data || []);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    fetchEnrollments();
  };

  const renderEnrollment = ({ item }: { item: Enrollment }) => (
    <EnrolledCourseCard enrollment={item} onPress={() => {}} />
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        <View style={styles.header}>
          <AppText variant="h2" color="text">
            {t('nav.myCourses')}
          </AppText>
          <AppText variant="body" color="textSecondary" style={{ marginTop: theme.spacing.xs }}>
            Continuez votre apprentissage
          </AppText>
        </View>

        <FlatList
          data={enrollments}
          renderItem={renderEnrollment}
          keyExtractor={(item) => item.id}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={{ height: theme.spacing.lg }} />}
          ListEmptyComponent={() => (
            <Card style={styles.emptyCard}>
              <AppText variant="body" color="textSecondary" align="center">
                {loading ? t('common.loading') : 'Vous n\'êtes inscrit à aucun cours'}
              </AppText>
              <AppText variant="bodySmall" color="textLight" align="center" style={{ marginTop: theme.spacing.sm }}>
                Explorez nos cours pour commencer votre apprentissage
              </AppText>
            </Card>
          )}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  listContent: {
    paddingBottom: 20,
  },
  emptyCard: {
    padding: 40,
  },
});
