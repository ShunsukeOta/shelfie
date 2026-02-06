import * as React from 'react';

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

type LibraryContextValue = {
  books: Book[];
  logs: LogItem[];
  addBook: (input: Omit<Book, 'id' | 'status' | 'updatedAt'>) => void;
  updateBook: (id: string, input: Partial<Book>) => void;
  removeBook: (id: string) => void;
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

const sampleBooks: Book[] = [
  {
    id: 'book-1',
    title: 'プロダクトマネジメントのすべて',
    author: '西口 一希',
    statusKey: 'reading',
    status: '読書中',
    updatedAt: '2026-02-01',
    imageUrl: 'https://picsum.photos/seed/shelfie1/360/480',
  },
  {
    id: 'book-2',
    title: '7つの習慣',
    author: 'スティーブン・R・コヴィー',
    statusKey: 'stack',
    status: '積読',
    updatedAt: '2026-01-21',
    imageUrl: 'https://picsum.photos/seed/shelfie2/360/480',
  },
  {
    id: 'book-3',
    title: 'FACTFULNESS',
    author: 'ハンス・ロスリング',
    statusKey: 'done',
    status: '読了',
    updatedAt: '2025-12-18',
    fallbackCoverSvg: makeCoverSvg('FACTFULNESS', 'ハンス・ロスリング'),
  },
];

const sampleLogs: LogItem[] = [
  {
    id: 'log-1',
    title: 'プロダクトマネジメントのすべて',
    status: '読書中',
    statusKey: 'reading',
    time: '2時間前',
    message: '読書を進めました。',
    createdAt: Date.now() - 2 * 60 * 60 * 1000,
    likeCount: 3,
  },
  {
    id: 'log-2',
    title: '7つの習慣',
    status: '読了',
    statusKey: 'done',
    time: '1日前',
    message: '読了しました。',
    createdAt: Date.now() - 24 * 60 * 60 * 1000,
    likeCount: 5,
  },
];

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
  const [books, setBooks] = React.useState<Book[]>(sampleBooks);
  const [logs, setLogs] = React.useState<LogItem[]>(sampleLogs);

  const addBook: LibraryContextValue['addBook'] = (input) => {
    const now = new Date();
    const statusKey = input.statusKey ?? 'unread';
    const fallbackCoverSvg =
      input.fallbackCoverSvg ||
      (!input.imageUrl ? makeCoverSvg(input.title, input.author ?? '') : undefined);
    const next: Book = {
      ...input,
      id: `book-${now.getTime()}`,
      statusKey,
      status: statusLabel(statusKey),
      updatedAt: now.toISOString().slice(0, 10),
      fallbackCoverSvg,
    };
    setBooks((current) => [next, ...current]);
    setLogs((current) => [
      {
        id: `log-${now.getTime()}`,
        title: next.title,
        status: next.status,
        statusKey: next.statusKey,
        time: 'たった今',
        message: '本を追加しました。',
        createdAt: now.getTime(),
        likeCount: 0,
      },
      ...current,
    ]);
  };

  const updateBook: LibraryContextValue['updateBook'] = (id, input) => {
    setBooks((current) =>
      current.map((book) => {
        if (book.id !== id) return book;
        const statusKey = (input.statusKey ?? book.statusKey) as BookStatusKey;
        return {
          ...book,
          ...input,
          statusKey,
          status: statusLabel(statusKey),
          updatedAt: new Date().toISOString().slice(0, 10),
        };
      })
    );
  };

  const removeBook: LibraryContextValue['removeBook'] = (id) => {
    const target = books.find((book) => book.id === id);
    setBooks((current) => current.filter((book) => book.id !== id));
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
