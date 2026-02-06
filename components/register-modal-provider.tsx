import { Button } from '@/components/ui/button';
import { Icon } from '@/components/ui/icon';
import { Input } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { searchGoogleBooks, type GoogleBookSuggestion } from '@/lib/google-books';
import { useLibrary } from '@/lib/library';
import { BarcodeIcon, FileEditIcon } from 'lucide-react-native';
import * as React from 'react';
import { CameraView, type BarcodeScanningResult, useCameraPermissions } from 'expo-camera';
import { Image, Modal, Pressable, TextInput, View } from 'react-native';

type RegisterContextValue = {
  openRegister: () => void;
};

const RegisterContext = React.createContext<RegisterContextValue | null>(null);

export function useRegisterModal() {
  const context = React.useContext(RegisterContext);
  if (!context) {
    throw new Error('useRegisterModal must be used within RegisterModalProvider');
  }
  return context;
}

type RegisterModalProviderProps = {
  children: React.ReactNode;
};

const cleanValue = (value: string) => value.trim();

export function RegisterModalProvider({ children }: RegisterModalProviderProps) {
  const { addBook } = useLibrary();
  const [open, setOpen] = React.useState(false);
  const [title, setTitle] = React.useState('');
  const [author, setAuthor] = React.useState('');
  const [category, setCategory] = React.useState('');
  const [publisher, setPublisher] = React.useState('');
  const [year, setYear] = React.useState('');
  const [volume, setVolume] = React.useState('');
  const [tags, setTags] = React.useState('');
  const [memo, setMemo] = React.useState('');
  const [isbn, setIsbn] = React.useState('');
  const [showDetail, setShowDetail] = React.useState(false);
  const [showIsbn, setShowIsbn] = React.useState(false);
  const [cameraOpen, setCameraOpen] = React.useState(false);
  const [resumeAfterScan, setResumeAfterScan] = React.useState(false);
  const [permissions, requestPermission] = useCameraPermissions();
  const [scanLocked, setScanLocked] = React.useState(false);
  const [suggestions, setSuggestions] = React.useState<GoogleBookSuggestion[]>([]);
  const [suggestLoading, setSuggestLoading] = React.useState(false);
  const [suggestError, setSuggestError] = React.useState('');
  const [coverUrl, setCoverUrl] = React.useState<string | undefined>(undefined);
  const [suppressSuggest, setSuppressSuggest] = React.useState(false);

  React.useEffect(() => {
    const cleanTitle = cleanValue(title);
    const cleanAuthor = cleanValue(author);

    if (suppressSuggest) {
      setSuggestions([]);
      setSuggestLoading(false);
      setSuggestError('');
      return;
    }

    if (!cleanTitle && !cleanAuthor) {
      setSuggestions([]);
      setSuggestLoading(false);
      setSuggestError('');
      return;
    }

    let active = true;
    setSuggestLoading(true);
    setSuggestError('');

    const handle = setTimeout(async () => {
      try {
        const results = await searchGoogleBooks({
          title: cleanTitle,
          author: cleanAuthor,
          maxResults: 3,
        });
        if (!active) return;
        setSuggestions(results);
      } catch (error) {
        if (!active) return;
        setSuggestions([]);
        setSuggestError('検索に失敗しました。');
      } finally {
        if (!active) return;
        setSuggestLoading(false);
      }
    }, 350);

    return () => {
      active = false;
      clearTimeout(handle);
    };
  }, [title, author, suppressSuggest]);

  const close = () => {
    setOpen(false);
    setSuppressSuggest(false);
  };

  const handleAdd = () => {
    const cleanTitle = cleanValue(title);
    if (!cleanTitle) return;

    addBook({
      title: cleanTitle,
      author: cleanValue(author),
      statusKey: 'unread',
      imageUrl: coverUrl,
      category: cleanValue(category) || undefined,
      publisher: cleanValue(publisher) || undefined,
      year: cleanValue(year) || undefined,
      volume: cleanValue(volume) || undefined,
      tags: cleanValue(tags) || undefined,
      memo: cleanValue(memo) || undefined,
    });

    setTitle('');
    setAuthor('');
    setCategory('');
    setPublisher('');
    setYear('');
    setVolume('');
    setTags('');
    setMemo('');
    setIsbn('');
    setShowDetail(false);
    setShowIsbn(false);
    setResumeAfterScan(false);
    setCameraOpen(false);
    setScanLocked(false);
    setSuggestions([]);
    setSuggestError('');
    setCoverUrl(undefined);
    setSuppressSuggest(false);
    close();
  };

  const handleOpenCamera = async () => {
    if (!permissions?.granted) {
      const result = await requestPermission();
      if (!result.granted) return;
    }
    setScanLocked(false);
    setResumeAfterScan(true);
    setCameraOpen(true);
    setOpen(false);
  };

  const handleBarcodeScanned = (result: BarcodeScanningResult) => {
    if (scanLocked) return;
    const raw = result.data?.replace(/[^0-9X]/gi, '') ?? '';
    if (!raw) return;
    setScanLocked(true);
    setIsbn(raw);
    setShowIsbn(true);
    setCameraOpen(false);
    setOpen(true);
  };

  const applySuggestion = (item: GoogleBookSuggestion) => {
    setTitle(item.title);
    setAuthor(item.author);
    setCoverUrl(item.thumbnail);
    setCategory(item.category ?? '');
    setPublisher(item.publisher ?? '');
    setYear(item.year ?? '');
    setTags(item.tags ?? '');
    setMemo(item.description ?? '');
    setShowDetail(true);
    setSuppressSuggest(true);
    setSuggestions([]);
    setSuggestLoading(false);
    setSuggestError('');
  };

  return (
    <RegisterContext.Provider value={{ openRegister: () => setOpen(true) }}>
      {children}
      <Modal transparent visible={open} animationType="fade">
        <View className="flex-1 items-center justify-center bg-black/30 px-4">
          <Pressable className="absolute inset-0" onPress={close} />
          <View className="w-full max-w-md rounded-2xl bg-white p-4">
            <Text className="text-[16px] font-semibold text-[#222]">本を登録</Text>
            <View className="mt-3 gap-2">
              {coverUrl ? (
                <View className="items-center">
                  <View className="h-[120px] w-[90px] overflow-hidden rounded-[2px] border border-border bg-muted">
                    <Image source={{ uri: coverUrl }} className="h-full w-full" resizeMode="cover" />
                  </View>
                </View>
              ) : null}
              <Input
                placeholder="タイトル"
                value={title}
                onChangeText={(value) => {
                  setTitle(value);
                  setCoverUrl(undefined);
                  setSuppressSuggest(false);
                }}
              />
              <Input
                placeholder="著者"
                value={author}
                onChangeText={(value) => {
                  setAuthor(value);
                  setCoverUrl(undefined);
                  setSuppressSuggest(false);
                }}
              />
              <View className="flex-row gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  onPress={() => setShowDetail((prev) => !prev)}>
                  <Icon as={FileEditIcon} size={16} />
                  <Text>{showDetail ? '詳細入力を閉じる' : '詳細入力'}</Text>
                </Button>
                <Button variant="secondary" size="sm" onPress={handleOpenCamera}>
                  <Icon as={BarcodeIcon} size={16} />
                  <Text>ISBNスキャン</Text>
                </Button>
              </View>
              {suggestLoading && <Text className="text-[12px] text-muted-foreground">検索中...</Text>}
              {suggestError.length > 0 && (
                <Text className="text-[12px] text-destructive">{suggestError}</Text>
              )}
              {!suppressSuggest && suggestions.length > 0 && (
                <View className="rounded border border-border bg-background">
                  {suggestions.map((item) => (
                    <Pressable
                      key={item.id}
                      onPress={() => applySuggestion(item)}
                      className="flex-row items-center gap-3 border-b border-border px-3 py-2 last:border-b-0">
                      <View className="h-12 w-9 overflow-hidden rounded-[2px] border border-border bg-muted">
                        {item.thumbnail ? (
                          <Image
                            source={{ uri: item.thumbnail }}
                            className="h-full w-full"
                            resizeMode="cover"
                          />
                        ) : null}
                      </View>
                      <View className="flex-1">
                        <Text className="text-[13px] font-semibold text-foreground">
                          {item.title}
                        </Text>
                        <Text className="text-[12px] text-muted-foreground">{item.author}</Text>
                      </View>
                    </Pressable>
                  ))}
                </View>
              )}
              {showDetail && (
                <View className="gap-2">
                  <Input placeholder="カテゴリ" value={category} onChangeText={setCategory} />
                  <View className="flex-row gap-2">
                    <Input placeholder="出版社" value={publisher} onChangeText={setPublisher} />
                    <Input
                      placeholder="出版年"
                      value={year}
                      onChangeText={setYear}
                      keyboardType="number-pad"
                    />
                  </View>
                  <View className="flex-row gap-2">
                    <Input placeholder="巻数" value={volume} onChangeText={setVolume} />
                    <Input placeholder="タグ" value={tags} onChangeText={setTags} />
                  </View>
                  <TextInput
                    value={memo}
                    onChangeText={setMemo}
                    placeholder="メモ"
                    placeholderTextColor="#9a9a9a"
                    multiline
                    className="min-h-[96px] rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground"
                  />
                </View>
              )}
              {showIsbn && (
                <Input
                  placeholder="ISBN"
                  value={isbn}
                  onChangeText={setIsbn}
                  keyboardType="number-pad"
                />
              )}
            </View>
            <View className="mt-4 flex-row justify-end gap-2">
              <Button variant="ghost" onPress={close}>
                <Text>キャンセル</Text>
              </Button>
              <Button onPress={handleAdd}>
                <Text>登録</Text>
              </Button>
            </View>
          </View>
        </View>
      </Modal>

      <Modal transparent visible={cameraOpen} animationType="fade">
        <View className="flex-1 bg-black/80 px-4 py-10">
          <View className="mb-4 flex-row items-center justify-between">
            <Text className="text-[16px] font-semibold text-white">ISBNをスキャン</Text>
            <Button
              variant="ghost"
              onPress={() => {
                setCameraOpen(false);
                if (resumeAfterScan) setOpen(true);
              }}>
              <Text className="text-white">閉じる</Text>
            </Button>
          </View>
          <View className="flex-1 overflow-hidden rounded-2xl border border-white/20">
            {permissions?.granted ? (
              <>
                <CameraView
                  style={{ flex: 1 }}
                  barcodeScannerSettings={{
                    barcodeTypes: ['ean13', 'ean8', 'isbn10', 'isbn13', 'upc_a', 'upc_e'],
                  }}
                  onBarcodeScanned={handleBarcodeScanned}
                />
                <View className="absolute inset-0 items-center justify-center">
                  <View className="h-44 w-64 rounded-2xl border-2 border-white/60" />
                  <Text className="mt-3 text-[12px] text-white/80">
                    バーコードを枠内に合わせてください
                  </Text>
                </View>
              </>
            ) : (
              <View className="flex-1 items-center justify-center gap-3">
                <Text className="text-[12px] text-white/80">カメラの許可が必要です。</Text>
                <Button
                  onPress={async () => {
                    const result = await requestPermission();
                    if (!result.granted) return;
                  }}>
                  <Text>許可する</Text>
                </Button>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </RegisterContext.Provider>
  );
}
