import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Text } from '@/components/ui/text';
import { auth } from '@/lib/firebase';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { LogInIcon, UserPlusIcon } from 'lucide-react-native';
import * as React from 'react';
import { View } from 'react-native';
import * as WebBrowser from 'expo-web-browser';

WebBrowser.maybeCompleteAuthSession();

type GoogleAuthButtonProps = {
  mode?: 'login' | 'register';
};

const getClientIds = () => ({
  expoClientId: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID ?? undefined,
  iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? undefined,
  androidClientId: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? undefined,
  webClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? undefined,
});

export function GoogleAuthButton({ mode = 'login' }: GoogleAuthButtonProps) {
  const [error, setError] = React.useState('');
  const clientIds = React.useMemo(() => getClientIds(), []);
  const hasClientId = Boolean(
    clientIds.expoClientId || clientIds.iosClientId || clientIds.androidClientId || clientIds.webClientId
  );
  const useProxy = Constants.appOwnership === 'expo';

  const [request, response, promptAsync] = Google.useIdTokenAuthRequest({
    expoClientId: clientIds.expoClientId,
    iosClientId: clientIds.iosClientId,
    androidClientId: clientIds.androidClientId,
    webClientId: clientIds.webClientId,
  });

  React.useEffect(() => {
    if (!response) return;
    if (response.type === 'success') {
      const idToken = response.params?.id_token;
      if (!idToken) {
        setError('ログインに失敗しました。');
        return;
      }
      const credential = GoogleAuthProvider.credential(idToken);
      signInWithCredential(auth, credential).catch(() => {
        setError('ログインに失敗しました。');
      });
    }
    if (response.type === 'error') {
      setError('ログインに失敗しました。');
    }
  }, [response]);

  const label = mode === 'login' ? 'Googleでログイン' : 'Googleで登録';
  const IconComponent = mode === 'login' ? LogInIcon : UserPlusIcon;

  return (
    <View className="gap-2">
      <Button
        variant="secondary"
        size="lg"
        disabled={!request || !hasClientId}
        onPress={() => {
          if (!request) return;
          if (!hasClientId) {
            setError('GoogleのクライアントIDが未設定です。');
            return;
          }
          setError('');
          promptAsync({ useProxy }).catch(() => setError('ログインに失敗しました。'));
        }}>
        <Icon as={IconComponent} size={18} className="text-foreground" />
        <Text>{label}</Text>
      </Button>
      {error ? (
        <Text className="text-[12px] text-destructive">{error}</Text>
      ) : null}
    </View>
  );
}
