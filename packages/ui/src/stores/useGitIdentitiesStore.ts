import { create } from "zustand";
import type { StoreApi, UseBoundStore } from "zustand";
import { devtools, persist, createJSONStorage } from "zustand/middleware";
import { getSafeStorage } from "./utils/safeStorage";
import {
  getGitIdentities,
  createGitIdentity,
  updateGitIdentity,
  deleteGitIdentity,
  getCurrentGitIdentity
} from "@/lib/gitApi";

export interface GitIdentityProfile {
  id: string;
  name: string;
  userName: string;
  userEmail: string;
  sshKey?: string | null;
  color?: string | null;
  icon?: string | null;
}

interface GitIdentitiesStore {

  selectedProfileId: string | null;
  profiles: GitIdentityProfile[];
  globalIdentity: GitIdentityProfile | null;
  isLoading: boolean;

  setSelectedProfile: (id: string | null) => void;
  loadProfiles: () => Promise<boolean>;
  loadGlobalIdentity: () => Promise<boolean>;
  createProfile: (profile: Omit<GitIdentityProfile, 'id'> & { id?: string }) => Promise<boolean>;
  updateProfile: (id: string, updates: Partial<GitIdentityProfile>) => Promise<boolean>;
  deleteProfile: (id: string) => Promise<boolean>;
  getProfileById: (id: string) => GitIdentityProfile | undefined;
}

declare global {
  interface Window {
    __zustand_git_identities_store__?: UseBoundStore<StoreApi<GitIdentitiesStore>>;
  }
}

export const useGitIdentitiesStore = create<GitIdentitiesStore>()(
  devtools(
    persist(
      (set, get) => ({

        selectedProfileId: null,
        profiles: [],
        globalIdentity: null,
        isLoading: false,

        setSelectedProfile: (id: string | null) => {
          set({ selectedProfileId: id });
        },

        loadProfiles: async () => {
          set({ isLoading: true });
          const previousProfiles = get().profiles;

          try {
            const profiles = await getGitIdentities();
            set({ profiles, isLoading: false });
            return true;
          } catch (error) {
            console.error("Failed to load git identity profiles:", error);
            set({ profiles: previousProfiles, isLoading: false });
            return false;
          }
        },

        loadGlobalIdentity: async () => {
          try {
            const data = await getCurrentGitIdentity('');

            if (data && data.userName && data.userEmail) {
              const globalProfile: GitIdentityProfile = {
                id: 'global',
                name: 'Global Identity',
                userName: data.userName,
                userEmail: data.userEmail,
                sshKey: data.sshCommand ? data.sshCommand.replace('ssh -i ', '') : null,
                color: 'info',
                icon: 'house'
              };
              set({ globalIdentity: globalProfile });
            } else {
              set({ globalIdentity: null });
            }

            return true;
          } catch (error) {
            console.error("Failed to load global git identity:", error);
            set({ globalIdentity: null });
            return false;
          }
        },

        createProfile: async (profileData) => {
          try {

            const profile = {
              ...profileData,
              id: profileData.id || `profile-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
              color: profileData.color || 'keyword',
              icon: profileData.icon || 'branch'
            };

            await createGitIdentity(profile);

            await get().loadProfiles();
            return true;
          } catch (error) {
            console.error("Failed to create git identity profile:", error);
            return false;
          }
        },

        updateProfile: async (id, updates) => {
          try {

            const existing = get().profiles.find(p => p.id === id);
            if (!existing) {
              throw new Error("Profile not found");
            }

            const updated = { ...existing, ...updates };
            await updateGitIdentity(id, updated);

            await get().loadProfiles();
            return true;
          } catch (error) {
            console.error("Failed to update git identity profile:", error);
            return false;
          }
        },

        deleteProfile: async (id) => {
          try {
            await deleteGitIdentity(id);

            if (get().selectedProfileId === id) {
              set({ selectedProfileId: null });
            }

            await get().loadProfiles();
            return true;
          } catch (error) {
            console.error("Failed to delete git identity profile:", error);
            return false;
          }
        },

        getProfileById: (id) => {
          const { profiles, globalIdentity } = get();
          if (id === 'global') {
            return globalIdentity || undefined;
          }
          return profiles.find((p) => p.id === id);
        },
      }),
      {
        name: "git-identities-store",
        storage: createJSONStorage(() => getSafeStorage()),
        partialize: (state) => ({
          selectedProfileId: state.selectedProfileId,
        }),
      },
    ),
    {
      name: "git-identities-store",
    },
  ),
);

if (typeof window !== "undefined") {
  window.__zustand_git_identities_store__ = useGitIdentitiesStore;
}
