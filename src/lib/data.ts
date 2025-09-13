

import {faker} from '@faker-js/faker';

export type Profile = {
  id: string;
  username: string;
  avatar_url: string;
  full_name?: string;
  win_streak_3?: boolean;
  win_streak_10?: boolean;
}

export type Comment = {
    id: string;
    user: Profile;
    content: string;
    created_at: string;
    parent_comment_id: string | null;
    // Client-side properties
    replies?: Comment[];
}

export type Post = {
  id: string | number; // Changed to support both bigint and string IDs
  user: Profile;
  media_url: string;
  media_type: 'image' | 'video';
  caption: string;
  created_at: string;
  // Joined properties
  likes: { count: number };
  comments: { count: number };
  // Client-side properties
  isLiked?: boolean;
};

export type PostWithViews = Post & {
    views: number;
};

export type TypingBattle = {
    id: string;
    player1_id: string;
    player2_id: string;
    player1_score: number;
    player2_score: number;
    current_text: string;
    player1_progress: string;
    player2_progress: string;
    winner_id: string | null;
    status: 'requesting' | 'accepted' | 'declined' | 'in-progress' | 'completed' | 'cancelled';
    updated_at: string;
};


export type Country = {
  name: string;
  code: string;
  flag: string;
};

// --- Helper Functions to Generate Mock Data ---

const generateMockProfile = (id: string, username: string, name: string): Profile => ({
    id,
    username,
    avatar_url: `https://i.pravatar.cc/150?u=${id}`,
    full_name: name,
});

const generateMockComment = (id: string, user: Profile, parentId: string | null = null): Comment => ({
    id,
    user,
    content: faker.lorem.sentence(),
    created_at: faker.date.recent().toISOString(),
    parent_comment_id: parentId,
    replies: []
});

const mockUsers = [
    generateMockProfile('aungaung', 'aungaung', 'Aung Aung'),
    generateMockProfile('susu', 'susu', 'Su Su'),
    generateMockProfile('myomyint', 'myomyint', 'Myo Myint'),
    generateMockProfile('thuzar', 'thuzar', 'Thuzar'),
    generateMockProfile('kyawkyaw', 'kyawkyaw', 'Kyaw Kyaw'),
];

// --- Exported Data Functions ---

export const countries: Country[] = [
    { name: "United States", code: "1", flag: "🇺🇸" },
    { name: "India", code: "91", flag: "🇮🇳" },
    { name: "Brazil", code: "55", flag: "🇧🇷" },
    { name: "Indonesia", code: "62", flag: "🇮🇩" },
    { name: "Pakistan", code: "92", flag: "🇵🇰" },
    { name: "Nigeria", code: "234", flag: "🇳🇬" },
    { name: "Bangladesh", code: "880", flag: "🇧🇩" },
    { name: "Russia", code: "7", flag: "🇷🇺" },
    { name: "Mexico", code: "52", flag: "🇲🇽" },
    { name: "Japan", code: "81", flag: "🇯🇵" },
    { name: "Ethiopia", code: "251", flag: "🇪🇹" },
    { name: "Philippines", code: "63", flag: "🇵🇭" },
    { name: "Egypt", code: "20", flag: "🇪🇬" },
    { name: "Vietnam", code: "84", flag: "🇻🇳" },
    { name: "DR Congo", code: "243", flag: "🇨🇩" },
    { name: "Turkey", code: "90", flag: "🇹🇷" },
    { name: "Iran", code: "98", flag: "🇮🇷" },
    { name: "Germany", code: "49", flag: "🇩🇪" },
    { name: "Thailand", code: "66", flag: "🇹🇭" },
    { name: "United Kingdom", code: "44", flag: "🇬🇧" },
    { name: "France", code: "33", flag: "🇫🇷" },
    { name: "Italy", code: "39", flag: "🇮🇹" },
    { name: "Tanzania", code: "255", flag: "🇹🇿" },
    { name: "South Africa", code: "27", flag: "🇿🇦" },
    { name: "Myanmar", code: "95", flag: "🇲🇲" },
    { name: "Kenya", code: "254", flag: "🇰🇪" },
    { name: "South Korea", code: "82", flag: "🇰🇷" },
    { name: "Colombia", code: "57", flag: "🇨🇴" },
    { name: "Spain", code: "34", flag: "🇪🇸" },
    { name: "Uganda", code: "256", flag: "🇺🇬" },
    { name: "Argentina", code: "54", flag: "🇦🇷" },
    { name: "Algeria", code: "213", flag: "🇩🇿" },
    { name: "Sudan", code: "249", flag: "🇸🇩" },
    { name: "Ukraine", code: "380", flag: "🇺🇦" },
    { name: "Iraq", code: "964", flag: "🇮🇶" },
    { name: "Afghanistan", code: "93", flag: "🇦🇫" },
    { name: "Poland", code: "48", flag: "🇵🇱" },
    { name: "Canada", code: "1", flag: "🇨🇦" },
    { name: "Morocco", code: "212", flag: "🇲🇦" },
    { name: "Saudi Arabia", code: "966", flag: "🇸🇦" },
    { name: "Uzbekistan", code: "998", flag: "🇺🇿" },
    { name: "Peru", code: "51", flag: "🇵🇪" },
    { name: "Angola", code: "244", flag: "🇦🇴" },
    { name: "Malaysia", code: "60", flag: "🇲🇾" },
    { name: "Mozambique", code: "258", flag: "🇲🇿" },
    { name: "Ghana", code: "233", flag: "🇬🇭" },
    { name: "Yemen", code: "967", flag: "🇾🇪" },
    { name: "Nepal", code: "977", flag: "🇳🇵" },
    { name: "Venezuela", code: "58", flag: "🇻🇪" },
    { name: "Madagascar", code: "261", flag: "🇲🇬" },
    { name: "Cameroon", code: "237", flag: "🇨🇲" },
    { name: "Côte d'Ivoire", code: "225", flag: "🇨🇮" },
    { name: "North Korea", code: "850", flag: "🇰🇵" },
    { name: "Australia", code: "61", flag: "🇦🇺" },
    { name: "Niger", code: "227", flag: "🇳🇪" },
    { name: "Taiwan", code: "886", flag: "🇹🇼" },
    { name: "Sri Lanka", code: "94", flag: "🇱🇰" },
    { name: "Burkina Faso", code: "226", flag: "🇧🇫" },
    { name: "Mali", code: "223", flag: "🇲🇱" },
    { name: "Romania", code: "40", flag: "🇷🇴" },
    { name: "Malawi", code: "265", flag: "🇲🇼" },
    { name: "Chile", code: "56", flag: "🇨🇱" },
    { name: "Kazakhstan", code: "7", flag: "🇰🇿" },
    { name: "Zambia", code: "260", flag: "🇿🇲" },
    { name: "Guatemala", code: "502", flag: "🇬🇹" },
    { name: "Ecuador", code: "593", flag: "🇪🇨" },
    { name: "Syria", code: "963", flag: "🇸🇾" },
    { name: "Netherlands", code: "31", flag: "🇳🇱" },
    { name: "Senegal", code: "221", flag: "🇸🇳" },
    { name: "Cambodia", code: "855", flag: "🇰🇭" },
    { name: "Chad", code: "235", flag: "🇹🇩" },
    { name: "Somalia", code: "252", flag: "🇸🇴" },
    { name: "Zimbabwe", code: "263", flag: "🇿🇼" },
    { name: "Guinea", code: "224", flag: "🇬🇳" },
    { name: "Rwanda", code: "250", flag: "🇷🇼" },
    { name: "Benin", code: "229", flag: "🇧🇯" },
    { name: "Burundi", code: "257", flag: "🇧🇮" },
    { name: "Tunisia", code: "216", flag: "🇹🇳" },
    { name: "Bolivia", code: "591", flag: "🇧🇴" },
    { name: "Haiti", code: "509", flag: "🇭🇹" },
    { name: "Belgium", code: "32", flag: "🇧🇪" },
    { name: "Jordan", code: "962", flag: "🇯🇴" },
    { name: "Dominican Republic", code: "1", flag: "🇩🇴" },
    { name: "Cuba", code: "53", flag: "🇨🇺" },
    { name: "Sweden", code: "46", flag: "🇸🇪" },
    { name: "Honduras", code: "504", flag: "🇭🇳" },
    { name: "Czech Republic", code: "420", flag: "🇨🇿" },
    { name: "Azerbaijan", code: "994", flag: "🇦🇿" },
    { name: "Greece", code: "30", flag: "🇬🇷" },
    { name: "Portugal", code: "351", flag: "🇵🇹" },
    { name: "Tajikistan", code: "992", flag: "🇹🇯" },
    { name: "Hungary", code: "36", flag: "🇭🇺" },
    { name: "United Arab Emirates", code: "971", flag: "🇦🇪" },
    { name: "Belarus", code: "375", flag: "🇧🇾" },
    { name: "Austria", code: "43", flag: "🇦🇹" },
    { name: "Israel", code: "972", flag: "🇮🇱" },
    { name: "Switzerland", code: "41", flag: "🇨🇭" },
    { name: "Togo", code: "228", flag: "🇹🇬" },
    { name: "Sierra Leone", code: "232", flag: "🇸🇱" },
    { name: "Hong Kong", code: "852", flag: "🇭🇰" },
    { name: "Singapore", code: "65", flag: "🇸🇬" },
    { name: "Denmark", code: "45", flag: "🇩🇰" },
    { name: "Finland", code: "358", flag: "🇫🇮" },
    { name: "Slovakia", code: "421", flag: "🇸🇰" },
    { name: "Norway", code: "47", flag: "🇳🇴" },
];

export function getNewsPosts(): Post[] {
    return [
        {
            id: 1,
            user: mockUsers[0],
            media_url: 'https://images.pexels.com/photos/167699/pexels-photo-167699.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            media_type: 'image',
            caption: 'The mountains are calling and I must go. 🌲🏔️ #nature #adventure',
            created_at: faker.date.recent({ days: 1 }).toISOString(),
            likes: { count: faker.number.int({ min: 100, max: 1000 }) },
            comments: { count: faker.number.int({ min: 5, max: 50 }) },
            isLiked: false,
        },
        {
            id: 2,
            user: mockUsers[1],
            media_url: 'https://images.pexels.com/photos/3408744/pexels-photo-3408744.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            media_type: 'image',
            caption: 'Chasing the northern lights. A night I will never forget. ✨ #aurora #travel',
            created_at: faker.date.recent({ days: 2 }).toISOString(),
            likes: { count: faker.number.int({ min: 100, max: 1000 }) },
            comments: { count: faker.number.int({ min: 5, max: 50 }) },
            isLiked: true,
        },
        {
            id: 3,
            user: mockUsers[2],
            media_url: 'https://images.pexels.com/photos/3225517/pexels-photo-3225517.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2',
            media_type: 'image',
            caption: 'Lost in the beauty of the tropics. 🌴 #beachlife #vacation',
            created_at: faker.date.recent({ days: 3 }).toISOString(),
            likes: { count: faker.number.int({ min: 100, max: 1000 }) },
            comments: { count: faker.number.int({ min: 5, max: 50 }) },
            isLiked: false,
        },
    ];
}


export function getVideoPosts(): Post[] {
  return [
    {
        id: 'vid1',
        user: mockUsers[3],
        media_url: 'https://videos.pexels.com/video-files/853877/853877-hd.mp4',
        media_type: 'video',
        caption: 'Morning brew perfection. ☕️ #coffee #latteart',
        created_at: faker.date.recent({ days: 1 }).toISOString(),
        likes: { count: faker.number.int({ min: 100, max: 1000 }) },
        comments: { count: faker.number.int({ min: 5, max: 50 }) },
        isLiked: false,
    },
    {
        id: 'vid2',
        user: mockUsers[4],
        media_url: 'https://videos.pexels.com/video-files/4434246/4434246-hd.mp4',
        media_type: 'video',
        caption: 'Exploring the city streets. 🏙️ #citylife #travel',
        created_at: faker.date.recent({ days: 2 }).toISOString(),
        likes: { count: faker.number.int({ min: 100, max: 1000 }) },
        comments: { count: faker.number.int({ min: 5, max: 50 }) },
        isLiked: true,
    },
  ];
}
