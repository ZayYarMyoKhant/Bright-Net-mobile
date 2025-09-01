
export type Post = {
  id: number;
  user: {
    username: string;
    avatar: string;
    id: string;
  };
  media_url: string;
  media_type: 'image' | 'video';
  caption: string;
  likes: number;
  comments: Comment[];
  shares: number;
  created_at: string;
};

export type Comment = {
    id: number;
    user: {
        username: string;
        avatar: string;
    };
    text: string;
    likes: number;
    replies: Comment[];
}


export type Country = {
  code: string;
  flag: string;
};

export const countries: Country[] = [
  { code: '95', flag: '🇲🇲' },
  { code: '1', flag: '🇺🇸' },
  { code: '44', flag: '🇬🇧' },
  { code: '81', flag: '🇯🇵' },
  { code: '82', flag: '🇰🇷' },
  { code: '65', flag: '🇸🇬' },
  { code: '66', flag: '🇹🇭' },
  { code: '86', flag: '🇨🇳' },
  { code: '91', flag: '🇮🇳' },
];

export function getVideoPosts(): Post[] {
  // This is now a legacy function, data will be fetched from Supabase.
  // Returning an empty array to avoid breaking components that still use it.
  return [
    {
        id: 1,
        user: {
            id: 'aungaung',
            username: 'aungaung',
            avatar: 'https://i.pravatar.cc/150?u=aungaung',
        },
        media_url: 'https://picsum.photos/400/800?random=1',
        media_type: 'image',
        caption: 'This is a sample caption in Myanmar language.',
        likes: 123,
        comments: [],
        shares: 45,
        created_at: '2024-07-29T12:34:56.789Z',
    }
  ];
}
