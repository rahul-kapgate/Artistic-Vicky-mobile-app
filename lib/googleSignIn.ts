import { GoogleSignin } from "@react-native-google-signin/google-signin";

const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;

if (!webClientId) {
  throw new Error("EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is missing");
}

GoogleSignin.configure({
  webClientId,
  offlineAccess: false,
});
