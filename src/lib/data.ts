
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

export type Post = {
  id: number;
  user: {
    username: string;
    avatar: string;
  };
  videoUrl: string;
  likes: number;
  comments: Comment[];
  shares: number;
  descriptionMyanmar: string;
};

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


const comments: Comment[] = [
    {
        id: 1,
        user: {
            username: "thuzar",
            avatar: "https://i.pravatar.cc/150?u=thuzar",
        },
        text: "အရမ်းလှတယ်!",
        likes: 15,
        replies: [
            {
                id: 4,
                user: {
                    username: "aungaung",
                    avatar: "https://i.pravatar.cc/150?u=aungaung",
                },
                text: "ဟုတ်တယ်နော်!",
                likes: 2,
                replies: [],
            }
        ]
    },
    {
        id: 2,
        user: {
            username: "susu",
            avatar: "https://i.pravatar.cc/150?u=susu",
        },
        text: "ဘယ်နေရာလဲဟင်?",
        likes: 8,
        replies: [],
    },
    {
        id: 3,
        user: {
            username: "kyawkyaw",
            avatar: "https://i.pravatar.cc/150?u=kyawkyaw",
        },
        text: "Wow, amazing view!",
        likes: 22,
        replies: [],
    }
]


const posts: Post[] = [
  {
    id: 1,
    user: {
      username: "aungaung",
      avatar: "https://i.pravatar.cc/150?u=aungaung",
    },
    videoUrl: "https://picsum.photos/1080/1920?random=1",
    likes: 12345,
    comments: comments,
    shares: 456,
    descriptionMyanmar: "ရန်ကုန်မြို့ရဲ့ ညရှုခင်းတွေက အရမ်းလှတယ်။",
  },
  {
    id: 2,
    user: {
      username: "susu",
      avatar: "https://i.pravatar.cc/150?u=susu",
    },
    videoUrl: "https://picsum.photos/1080/1920?random=2",
    likes: 9876,
    comments: comments.slice(0, 2),
    shares: 321,
    descriptionMyanmar: "မနက်ခင်းဈေးမှာ မုန့်ဟင်းခါးစားကြမယ်။",
  },
  {
    id: 3,
    user: {
      username: "myomyint",
      avatar: "https://i.pravatar.cc/150?u=myomyint",
    },
    videoUrl: "https://picsum.photos/1080/1920?random=3",
    likes: 25000,
    comments: [],
    shares: 800,
    descriptionMyanmar: "ရွှေတိဂုံဘုရားပေါ်ကနေ နေဝင်ဆည်းဆာကြည့်ရတာ အရမ်းကြည်နူးဖို့ကောင်းတယ်။",
  },
  {
    id: 4,
    user: {
      username: "thuzar",
      avatar: "https://i.pravatar.cc/150?u=thuzar",
    },
    videoUrl: "https://picsum.photos/1080/1920?random=4",
    likes: 8800,
    comments: [comments[0]],
    shares: 112,
    descriptionMyanmar: "ဒီနေ့တော့ အိမ်မှာပဲ ကိုယ်တိုင်ချက်စားမယ်။",
  },
  {
    id: 5,
    user: {
      username: "kyawkyaw",
      avatar: "https://i.pravatar.cc/150?u=kyawkyaw",
    },
    videoUrl: "https://picsum.photos/1080/1920?random=5",
    likes: 15678,
    comments: comments.slice(1, 3),
    shares: 401,
    descriptionMyanmar: "ပုဂံဘုရားတွေကြားမှာ စက်ဘီးလေးနဲ့ လျှောက်သွားမယ်။",
  },
];

export function getVideoPosts(): Post[] {
  return posts;
}
