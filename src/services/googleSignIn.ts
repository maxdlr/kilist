const WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

export const googleSignInAvailable = Boolean(WEB_CLIENT_ID);

export const askGoogleIdToken = async (): Promise<string | null> => {
  const { GoogleSignin, isSuccessResponse } = await import("@react-native-google-signin/google-signin");
  GoogleSignin.configure({ webClientId: WEB_CLIENT_ID });
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) return null;
  const idToken = response.data.idToken;
  await GoogleSignin.signOut().catch(() => {});
  if (!idToken) throw new Error("Google returned no id token");
  return idToken;
};
