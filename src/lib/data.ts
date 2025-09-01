

export type Post = {
  id: string; // Changed to string for UUID
  user_id: string;
  caption: string;
  media_url: string;
  media_type: 'image' | 'video';
  created_at: string;
  // Relationship to profiles table
  profiles: {
    username: string;
    avatar_url: string;
  };
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


export function getVideoPosts(): any[] { // Changed return type to any[]
  return [
    {
        id: 101,
        user: {
            id: 'aungaung',
            username: 'aungaung',
            avatar: 'https://i.pravatar.cc/150?u=aungaung',
        },
        media_url: 'https://picsum.photos/400/800?random=10',
        media_type: 'video',
        caption: 'ဒါက ဗီဒီယို caption ပါ။',
        likes: 1052,
        comments: sampleComments,
        shares: 112,
        created_at: '2024-07-31T10:00:00Z',
    },
    {
        id: 102,
        user: {
            id: 'susu',
            username: 'susu',
            avatar: 'https://i.pravatar.cc/150?u=susu',
        },
        media_url: 'https://picsum.photos/400/800?random=11',
        media_type: 'video',
        caption: 'ဒီနေ့ हवामान खूप छान आहे',
        likes: 2345,
        comments: [],
        shares: 301,
        created_at: '2024-07-31T12:30:00Z',
    }
  ];
}
