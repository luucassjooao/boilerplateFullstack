import { GoogleSignin, isErrorWithCode, isSuccessResponse, statusCodes } from '@react-native-google-signin/google-signin';
import { useMutation } from '@tanstack/react-query';
import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { env } from '@app/config/env';
import { useAuth } from '@app/contexts/AuthContext/useAuth';
import { getErrorMessage } from '@app/lib/errorMessages';
import { AuthService } from '@app/services/AuthService';

GoogleSignin.configure({
  // The API accepts this as id_token audience; on Android the idToken is always issued for the web client.
  webClientId: env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,
  iosClientId: env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
});

/** null = the user cancelled. */
async function googleIdToken(): Promise<AuthService.OAuthPayload | null> {
  await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

  const response = await GoogleSignin.signIn();

  if (!isSuccessResponse(response) || !response.data.idToken) {
    return null;
  }

  return { idToken: response.data.idToken };
}

/** Apple gets SHA-256(nonce) and signs it into the token; the API gets the raw nonce and compares. */
async function appleIdToken(): Promise<AuthService.OAuthPayload | null> {
  const rawNonce = Crypto.randomUUID();
  const hashedNonce = await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, rawNonce);

  try {
    const credential = await AppleAuthentication.signInAsync({
      requestedScopes: [
        AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
        AppleAuthentication.AppleAuthenticationScope.EMAIL,
      ],
      nonce: hashedNonce,
    });

    if (!credential.identityToken) {
      return null;
    }

    // Name only comes on the very first authorization.
    const name = [credential.fullName?.givenName, credential.fullName?.familyName].filter(Boolean).join(' ');

    return { idToken: credential.identityToken, nonce: rawNonce, ...(name && { name }) };
  } catch (error) {
    if ((error as { code?: string }).code === 'ERR_REQUEST_CANCELED') {
      return null;
    }

    throw error;
  }
}

export function useSocialSignIn() {
  const { startSession } = useAuth();
  const [isAppleAvailable, setIsAppleAvailable] = useState(false);

  useEffect(() => {
    // Sign in with Apple is iOS only here: the button is hidden on Android.
    if (Platform.OS === 'ios') {
      void AppleAuthentication.isAvailableAsync().then(setIsAppleAvailable);
    }
  }, []);

  const mutation = useMutation({
    mutationFn: async (provider: 'google' | 'apple') => {
      const payload = provider === 'google' ? await googleIdToken() : await appleIdToken();

      return payload ? AuthService.oauthSignIn(provider, payload) : null;
    },
    onSuccess: async (session) => {
      if (session) {
        await startSession(session);
      }
    },
    onError: (error) => {
      if (isErrorWithCode(error) && error.code === statusCodes.SIGN_IN_CANCELLED) {
        return;
      }

      Alert.alert('Não foi possível entrar', getErrorMessage(error));
    },
  });

  return {
    signInWith: mutation.mutate,
    isLoading: mutation.isPending,
    isAppleAvailable,
  };
}
