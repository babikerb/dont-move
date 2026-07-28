import { useQuery } from '@tanstack/react-query';
import { fetchMyProfile, Profile } from './profile';

// Shared across the tab bar icon and every profile-related screen, so a
// change made in one place (e.g. the avatar picker) is reflected everywhere
// else instantly, and a screen that mounts after the tab bar already warmed
// the cache gets the real value immediately instead of a placeholder.
export const PROFILE_QUERY_KEY = ['profile'] as const;

export function useMyProfile() {
  return useQuery<Profile | null>({
    queryKey: PROFILE_QUERY_KEY,
    queryFn: fetchMyProfile,
  });
}
