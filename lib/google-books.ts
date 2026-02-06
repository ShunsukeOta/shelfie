export type GoogleBookSuggestion = {
  id: string;
  title: string;
  author: string;
  thumbnail?: string;
  publisher?: string;
  year?: string;
  category?: string;
  tags?: string;
  description?: string;
};

type SearchInput = {
  title?: string;
  author?: string;
  maxResults?: number;
};

const getApiKey = () => process.env.EXPO_PUBLIC_GOOGLE_BOOKS_API_KEY ?? '';

const normalizeYear = (value?: string) => {
  if (!value) return undefined;
  const match = value.match(/\d{4}/);
  return match ? match[0] : undefined;
};

export async function searchGoogleBooks({ title, author, maxResults = 3 }: SearchInput) {
  const apiKey = getApiKey();
  const cleanTitle = title?.trim() ?? '';
  const cleanAuthor = author?.trim() ?? '';

  if (!apiKey || (!cleanTitle && !cleanAuthor)) return [];

  const queryParts: string[] = [];
  if (cleanTitle) queryParts.push(`intitle:${cleanTitle}`);
  if (cleanAuthor) queryParts.push(`inauthor:${cleanAuthor}`);

  const q = encodeURIComponent(queryParts.join(' '));
  const url = `https://www.googleapis.com/books/v1/volumes?q=${q}&maxResults=${maxResults}&printType=books&key=${apiKey}`;
  const response = await fetch(url);

  if (!response.ok) return [];

  const data = (await response.json()) as {
    items?: Array<{
      id?: string;
      volumeInfo?: {
        title?: string;
        authors?: string[];
        imageLinks?: { thumbnail?: string };
        publisher?: string;
        publishedDate?: string;
        categories?: string[];
        description?: string;
      };
    }>;
  };

  return (data.items ?? []).map((item) => {
    const info = item.volumeInfo ?? {};
    const titleValue = info.title ?? '不明なタイトル';
    const authorValue = Array.isArray(info.authors)
      ? info.authors.join('・')
      : info.authors ?? '不明な著者';
    const thumb = info.imageLinks?.thumbnail?.replace('http://', 'https://');
    const categories = Array.isArray(info.categories)
      ? info.categories.filter(Boolean)
      : [];
    const category = categories[0];
    const tags = categories.length > 0 ? categories.join('・') : undefined;
    const year = normalizeYear(info.publishedDate);
    const description = info.description?.trim();

    return {
      id: item.id ?? `${titleValue}-${authorValue}`,
      title: titleValue,
      author: authorValue,
      thumbnail: thumb,
      publisher: info.publisher,
      year,
      category,
      tags,
      description,
    } as GoogleBookSuggestion;
  });
}
