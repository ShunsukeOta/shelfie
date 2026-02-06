import { useAuth } from '@/components/auth-provider';
import { db } from '@/lib/firebase';
import * as React from 'react';
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from 'firebase/firestore';

export type BookStatusKey = 'unread' | 'stack' | 'reading' | 'done';

export type Book = {
  id: string;
  title: string;
  author: string;
  status: string;
  statusKey: BookStatusKey;
  updatedAt: string;
  imageUrl?: string;
  fallbackCoverSvg?: string;
  category?: string;
  publisher?: string;
  year?: string;
  volume?: string;
  tags?: string;
  memo?: string;
};

export type LogItem = {
  id: string;
  title: string;
  status?: string;
  statusKey?: BookStatusKey;
  time: string;
  message: string;
  createdAt?: number;
  likeCount?: number;
};

type CreateBookInput = Omit<Book, 'id' | 'status' | 'updatedAt'> & {
  statusKey?: BookStatusKey;
};

type LibraryContextValue = {
  books: Book[];
  logs: LogItem[];
  addBook: (input: CreateBookInput) => Promise<void>;
  updateBook: (id: string, input: Partial<Book>) => Promise<void>;
  removeBook: (id: string) => Promise<void>;
};

const LibraryContext = React.createContext<LibraryContextValue | null>(null);

const statusLabel = (key: BookStatusKey) => {
  switch (key) {
    case 'unread':
      return '未読';
    case 'stack':
      return '積読';
    case 'reading':
      return '読書中';
    case 'done':
      return '読了';
    default:
      return '未読';
  }
};

const makeCoverSvg = (title: string, author: string, color = '#222222') =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="360" height="480" viewBox="0 0 360 480">
      <rect width="360" height="480" fill="${color}"/>
      <rect x="28" y="28" width="304" height="424" fill="none" stroke="rgba(255,255,255,0.35)" stroke-width="2"/>
      <text x="40" y="90" fill="#ffffff" font-size="28" font-family="ui-sans-serif, system-ui" font-weight="700">
        ${title}
      </text>
      <text x="40" y="130" fill="rgba(255,255,255,0.8)" font-size="16" font-family="ui-sans-serif, system-ui">
        ${author}
      </text>
      <text x="40" y="430" fill="rgba(255,255,255,0.6)" font-size="12" font-family="ui-sans-serif, system-ui" letter-spacing="2">
        SHELFIE
      </text>
    </svg>`;

const toDateString = (value: unknown) => {
  if (typeof value === 'string' && value.length > 0) return value;
  // Firestore Timestamp has toDate
  if (value && typeof value === 'object' && 'toDate' in value) {
    const dateValue = (value as { toDate: () => Date }).toDate();
    return dateValue.toISOString().slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
};

const cleanData = <T extends Record<string, unknown>>(input: T) => {
  const entries = Object.entries(input).filter(([, value]) => value !== undefined);
  return Object.fromEntries(entries) as T;
};

export function useLibrary() {
  const context = React.useContext(LibraryContext);
  if (!context) {
    throw new Error('useLibrary must be used within LibraryProvider');
  }
  return context;
}

type LibraryProviderProps = {
  children: React.ReactNode;
};

export function LibraryProvider({ children }: LibraryProviderProps) {
  const { user } = useAuth();
  const [books, setBooks] = React.useState<Book[]>([]);
  const [logs, setLogs] = React.useState<LogItem[]>([]);

  React.useEffect(() => {
    if (!user) {
      setBooks([]);
      return;
    }

    const booksRef = collection(db, 'users', user.uid, 'books');
    const q = query(booksRef, orderBy('updatedAt', 'desc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const nextBooks = snapshot.docs.map((docSnap) => {
        const data = docSnap.data() as Partial<Book> & { updatedAt?: unknown };
        const statusKey = (data.statusKey ?? 'unread') as BookStatusKey;
        const title = data.title ?? '';
        const author = data.author ?? '';
        const imageUrl = data.imageUrl ?? undefined;
        return {
          id: docSnap.id,
          title,
          author,
          status: data.status ?? statusLabel(statusKey),
          statusKey,
          updatedAt: toDateString(data.updatedAt),
          imageUrl,
          fallbackCoverSvg: data.fallbackCoverSvg ?? (!imageUrl ? makeCoverSvg(title, author) : undefined),
          category: data.category ?? '',
          publisher: data.publisher ?? '',
          year: data.year ?? '',
          volume: data.volume ?? '',
          tags: data.tags ?? '',
          memo: data.memo ?? '',
        } as Book;
      });
      setBooks(nextBooks);
    });

    return () => unsubscribe();
  }, [user?.uid]);

  const addBook: LibraryContextValue['addBook'] = async (input) => {
    if (!user) return;
    const statusKey = input.statusKey ?? 'unread';
    const payload = cleanData({
      title: input.title,
      author: input.author ?? '',
      statusKey,
      status: statusLabel(statusKey),
      imageUrl: input.imageUrl ?? undefined,
      category: input.category ?? undefined,
      publisher: input.publisher ?? undefined,
      year: input.year ?? undefined,
      volume: input.volume ?? undefined,
      tags: input.tags ?? undefined,
      memo: input.memo ?? undefined,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    await addDoc(collection(db, 'users', user.uid, 'books'), payload);

    setLogs((current) => [
      {
        id: `log-${Date.now()}`,
        title: input.title,
        status: statusLabel(statusKey),
        statusKey,
        time: 'たった今',
        message: '本を追加しました。',
        createdAt: Date.now(),
        likeCount: 0,
      },
      ...current,
    ]);
  };

  const updateBook: LibraryContextValue['updateBook'] = async (id, input) => {
    if (!user) return;
    const statusKey = (input.statusKey ?? input.statusKey) as BookStatusKey | undefined;
    const resolvedStatusKey = statusKey ?? undefined;
    const resolvedStatus = resolvedStatusKey ? statusLabel(resolvedStatusKey) : undefined;

    const payload = cleanData({
      title: input.title,
      author: input.author,
      statusKey: resolvedStatusKey,
      status: resolvedStatus,
      imageUrl: input.imageUrl,
      category: input.category,
      publisher: input.publisher,
      year: input.year,
      volume: input.volume,
      tags: input.tags,
      memo: input.memo,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', user.uid, 'books', id), payload);
  };

  const removeBook: LibraryContextValue['removeBook'] = async (id) => {
    if (!user) return;
    const target = books.find((book) => book.id === id);
    await deleteDoc(doc(db, 'users', user.uid, 'books', id));
    if (target) {
      setLogs((current) => [
        {
          id: `log-${Date.now()}`,
          title: target.title,
          status: target.status,
          statusKey: target.statusKey,
          time: 'たった今',
          message: '本を削除しました。',
          createdAt: Date.now(),
          likeCount: 0,
        },
        ...current,
      ]);
    }
  };

  const value = React.useMemo(
    () => ({
      books,
      logs,
      addBook,
      updateBook,
      removeBook,
    }),
    [books, logs]
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}
