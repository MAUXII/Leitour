import type { User } from "firebase/auth";
import { uploadAvatarToCloudinary } from "@/lib/avatar-upload";
import { updateAuthProfile } from "@/lib/firebase/auth";
import {
  completeOnboarding,
  ensureUserProfile,
  needsOnboarding,
  updateUserProfile,
  type UserProfile,
} from "@/lib/firebase/users";
import { routes } from "@/lib/routes";

export type AfterAuthResult = {
  profile: UserProfile;
  nextRoute: typeof routes.onboarding | typeof routes.feed;
};

/** Garante perfil Firestore e decide o destino pós-login/signup. */
export async function afterAuth(user: User): Promise<AfterAuthResult> {
  const profile = await ensureUserProfile(user);
  return {
    profile,
    nextRoute: needsOnboarding(profile) ? routes.onboarding : routes.feed,
  };
}

type FinishOnboardingInput = {
  user: User;
  displayName: string;
  /** Nova foto local; se omitido/null, mantém a URL existente. */
  file?: File | null;
  existingPhotoURL?: string | null;
};

type FinishOnboardingAdapters = {
  uploadAvatar?: typeof uploadAvatarToCloudinary;
  updateAuth?: typeof updateAuthProfile;
  complete?: typeof completeOnboarding;
};

/**
 * Pipeline de onboarding: upload opcional → Auth → Firestore.
 * Adapters injetáveis para testes.
 */
export async function finishOnboarding(
  input: FinishOnboardingInput,
  adapters: FinishOnboardingAdapters = {},
): Promise<UserProfile> {
  const upload = adapters.uploadAvatar ?? uploadAvatarToCloudinary;
  const updateAuth = adapters.updateAuth ?? updateAuthProfile;
  const complete = adapters.complete ?? completeOnboarding;

  const trimmed = input.displayName.trim();
  if (trimmed.length < 2) {
    throw new Error("Nome curto demais.");
  }

  let photoURL =
    input.existingPhotoURL ?? input.user.photoURL ?? null;

  if (input.file) {
    photoURL = await upload(input.file, input.user.uid);
  }

  await updateAuth({ displayName: trimmed, photoURL });
  return complete(input.user.uid, { displayName: trimmed, photoURL });
}

type SaveProfileInput = {
  user: User;
  displayName: string;
  bio: string;
  file?: File | null;
  existingPhotoURL?: string | null;
};

/** Edição de perfil: foto opcional + nome + bio. */
export async function saveProfileEdit(
  input: SaveProfileInput,
): Promise<UserProfile> {
  const trimmed = input.displayName.trim();
  if (trimmed.length < 2) {
    throw new Error("Nome curto demais.");
  }

  let photoURL =
    input.existingPhotoURL ?? input.user.photoURL ?? null;

  if (input.file) {
    photoURL = await uploadAvatarToCloudinary(input.file, input.user.uid);
  }

  await updateAuthProfile({ displayName: trimmed, photoURL });
  return updateUserProfile(input.user.uid, {
    displayName: trimmed,
    bio: input.bio,
    photoURL,
  });
}
