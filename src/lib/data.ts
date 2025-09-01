
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
  return [];
}

const sampleComments: Comment[] = [
    {
        id: 1,
        user: { username: 'susu', avatar: 'https://i.pravatar.cc/150?u=susu' },
        text: 'This is a great post!',
        likes: 5,
        replies: [
            {
                id: 2,
                user: { username: 'aungaung', avatar: 'https://i.pravatar.cc/150?u=aungaung' },
                text: 'Thank you!',
                likes: 2,
                replies: []
            }
        ]
    },
    {
        id: 3,
        user: { username: 'myomyint', avatar: 'https://i.pravatar.cc/150?u=myomyint' },
        text: 'Love this!',
        likes: 10,
        replies: []
    }
];


export function getNewsPosts(): Post[] {
    return [
        {
            id: 1,
            user: {
                id: 'aungaung',
                username: 'aungaung',
                avatar: 'https://i.pravatar.cc/150?u=aungaung',
            },
            media_url: 'https://picsum.photos/600/400?random=1',
            media_type: 'image',
            caption: 'Just a beautiful landscape picture. Enjoying the view!',
            likes: 123,
            comments: sampleComments,
            shares: 45,
            created_at: '2024-07-30T10:00:00Z',
        },
        {
            id: 2,
            user: {
                id: 'susu',
                username: 'susu',
                avatar: 'https://i.pravatar.cc/150?u=susu',
            },
            media_url: 'https://picsum.photos/600/400?random=2',
            media_type: 'image',
            caption: 'My lunch today. It was delicious! 🍔🍟',
            likes: 250,
            comments: [],
            shares: 80,
            created_at: '2024-07-30T12:30:00Z',
        }
    ];
}
