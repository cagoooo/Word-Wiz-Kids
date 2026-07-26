export interface Word {
  id: string;
  english: string;
  chinese: string;
  phonetic: string;
  category: string;
  example: string;
  exampleChinese: string;
  vowels: number[];
  diphthongs: { start: number; length: number }[];
}

export const CATEGORIES = ["全部", "動物", "水果", "顏色", "數字"];

export const MOCK_WORDS: Word[] = [
  // 動物
  {
    id: "cat",
    english: "cat",
    chinese: "貓咪",
    phonetic: "/kæt/",
    category: "動物",
    example: "The cat is sleeping.",
    exampleChinese: "貓咪在睡覺。",
    vowels: [1],
    diphthongs: []
  },
  {
    id: "dog",
    english: "dog",
    chinese: "狗狗",
    phonetic: "/dɔg/",
    category: "動物",
    example: "My dog loves to play.",
    exampleChinese: "我的狗狗喜歡玩耍。",
    vowels: [1],
    diphthongs: []
  },
  {
    id: "bird",
    english: "bird",
    chinese: "小鳥",
    phonetic: "/bɜrd/",
    category: "動物",
    example: "The bird flies in the sky.",
    exampleChinese: "小鳥在天空中飛翔。",
    vowels: [1],
    diphthongs: []
  },
  {
    id: "fish",
    english: "fish",
    chinese: "魚",
    phonetic: "/fɪʃ/",
    category: "動物",
    example: "The fish swims in the water.",
    exampleChinese: "魚在水裡游。",
    vowels: [1],
    diphthongs: []
  },
  {
    id: "frog",
    english: "frog",
    chinese: "青蛙",
    phonetic: "/frɑg/",
    category: "動物",
    example: "The green frog jumps high.",
    exampleChinese: "綠色的青蛙跳得很高。",
    vowels: [2],
    diphthongs: []
  },
  {
    id: "bear",
    english: "bear",
    chinese: "熊",
    phonetic: "/bɛr/",
    category: "動物",
    example: "A big bear lives in the forest.",
    exampleChinese: "一隻大熊住在森林裡。",
    vowels: [1, 2],
    diphthongs: [{ start: 1, length: 2 }]
  },
  
  // 水果
  {
    id: "apple",
    english: "apple",
    chinese: "蘋果",
    phonetic: "/ˈæp.əl/",
    category: "水果",
    example: "I eat a red apple.",
    exampleChinese: "我吃一顆紅蘋果。",
    vowels: [0, 4],
    diphthongs: []
  },
  {
    id: "banana",
    english: "banana",
    chinese: "香蕉",
    phonetic: "/bəˈnæn.ə/",
    category: "水果",
    example: "Monkeys like to eat banana.",
    exampleChinese: "猴子喜歡吃香蕉。",
    vowels: [1, 3, 5],
    diphthongs: []
  },
  {
    id: "grape",
    english: "grape",
    chinese: "葡萄",
    phonetic: "/greɪp/",
    category: "水果",
    example: "This grape is very sweet.",
    exampleChinese: "這顆葡萄很甜。",
    vowels: [2, 4],
    diphthongs: []
  },
  {
    id: "mango",
    english: "mango",
    chinese: "芒果",
    phonetic: "/ˈmæŋ.goʊ/",
    category: "水果",
    example: "Mango is yellow and yummy.",
    exampleChinese: "芒果黃黃的很好吃。",
    vowels: [1, 4],
    diphthongs: []
  },
  {
    id: "lemon",
    english: "lemon",
    chinese: "檸檬",
    phonetic: "/ˈlɛm.ən/",
    category: "水果",
    example: "Lemon is very sour.",
    exampleChinese: "檸檬非常酸。",
    vowels: [1, 3],
    diphthongs: []
  },
  {
    id: "peach",
    english: "peach",
    chinese: "桃子",
    phonetic: "/pitʃ/",
    category: "水果",
    example: "I like peach juice.",
    exampleChinese: "我喜歡桃子果汁。",
    vowels: [1, 2],
    diphthongs: [{ start: 1, length: 2 }]
  },
  
  // 顏色
  {
    id: "red",
    english: "red",
    chinese: "紅色",
    phonetic: "/rɛd/",
    category: "顏色",
    example: "The apple is red.",
    exampleChinese: "蘋果是紅色的。",
    vowels: [1],
    diphthongs: []
  },
  {
    id: "blue",
    english: "blue",
    chinese: "藍色",
    phonetic: "/blu/",
    category: "顏色",
    example: "The sky is blue today.",
    exampleChinese: "今天的天空是藍色的。",
    vowels: [2, 3],
    diphthongs: [{ start: 2, length: 2 }]
  },
  {
    id: "green",
    english: "green",
    chinese: "綠色",
    phonetic: "/grin/",
    category: "顏色",
    example: "Grass is green.",
    exampleChinese: "草是綠色的。",
    vowels: [2, 3],
    diphthongs: [{ start: 2, length: 2 }]
  },
  {
    id: "yellow",
    english: "yellow",
    chinese: "黃色",
    phonetic: "/ˈjɛl.oʊ/",
    category: "顏色",
    example: "The sun is yellow.",
    exampleChinese: "太陽是黃色的。",
    vowels: [1, 4],
    diphthongs: [{ start: 4, length: 2 }]
  },
  {
    id: "purple",
    english: "purple",
    chinese: "紫色",
    phonetic: "/ˈpɜr.pəl/",
    category: "顏色",
    example: "She has a purple bag.",
    exampleChinese: "她有一個紫色的包包。",
    vowels: [1, 5],
    diphthongs: []
  },
  {
    id: "orange",
    english: "orange",
    chinese: "橘色",
    phonetic: "/ˈɔr.ɪndʒ/",
    category: "顏色",
    example: "I like the color orange.",
    exampleChinese: "我喜歡橘色。",
    vowels: [0, 2, 5],
    diphthongs: []
  },
  
  // 數字
  {
    id: "one",
    english: "one",
    chinese: "一",
    phonetic: "/wʌn/",
    category: "數字",
    example: "I have one nose.",
    exampleChinese: "我有一個鼻子。",
    vowels: [0, 2],
    diphthongs: []
  },
  {
    id: "two",
    english: "two",
    chinese: "二",
    phonetic: "/tu/",
    category: "數字",
    example: "I have two hands.",
    exampleChinese: "我有兩隻手。",
    vowels: [2],
    diphthongs: []
  },
  {
    id: "three",
    english: "three",
    chinese: "三",
    phonetic: "/θri/",
    category: "數字",
    example: "There are three little pigs.",
    exampleChinese: "有三隻小豬。",
    vowels: [3, 4],
    diphthongs: [{ start: 3, length: 2 }]
  },
  {
    id: "four",
    english: "four",
    chinese: "四",
    phonetic: "/fɔr/",
    category: "數字",
    example: "A car has four wheels.",
    exampleChinese: "汽車有四個輪子。",
    vowels: [1, 2],
    diphthongs: [{ start: 1, length: 2 }]
  },
  {
    id: "five",
    english: "five",
    chinese: "五",
    phonetic: "/faɪv/",
    category: "數字",
    example: "Give me five!",
    exampleChinese: "跟我擊掌！",
    vowels: [1, 3],
    diphthongs: []
  },
  {
    id: "six",
    english: "six",
    chinese: "六",
    phonetic: "/sɪks/",
    category: "數字",
    example: "An insect has six legs.",
    exampleChinese: "昆蟲有六條腿。",
    vowels: [1],
    diphthongs: []
  }
];
