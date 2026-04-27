import { BookOpen, Compass, Gamepad2, Landmark, User } from 'lucide-react';

export const navItems = [
  { path: '/discover', key: 'discover', icon: Compass },
  { path: '/learn', key: 'courses', icon: BookOpen },
  { path: '/games', key: 'games', icon: Gamepad2 },
  { path: '/profile', key: 'profile', icon: User }
];

const categoryRows: Array<[string, string, string]> = [
  ['history', '中国历史', '碑拓线条、松烟墨'], ['cuisine', '中国美食', '温瓷、蒸汽曲线'], ['scenic', '名胜风光', '山水留白'],
  ['festivals', '传统节日', '节气纹理'], ['arts', '艺术非遗', '宣纸笔触'], ['music-opera', '音乐戏曲', '弦线声波'],
  ['literature', '文学经典', '书页节奏'], ['idioms', '成语典故', '印章短签'], ['philosophy', '哲学思想', '圆相竹简'],
  ['modern', '当代中国', '城市线稿'], ['fun-hanzi', '趣味汉字', '字形演变'], ['myths', '中国神话传说', '云水星图']
];

export const categoryMotifs = categoryRows.map(([slug, title, motif], index) => ({ slug, title, motif, public: index < 3 }));

export const games = ['hanzi-ninja', 'pinyin-shooter', 'tone-bubbles', 'hanzi-tetris', 'whack-hanzi', 'hanzi-match3', 'hanzi-snake', 'hanzi-rhythm', 'hanzi-runner', 'pinyin-defense', 'memory-match', 'hanzi-slingshot'];

export const tracks = ['daily', 'ec', 'factory', 'hsk'];

export function titleCase(value: string) {
  return value.split('-').map((part) => `${part.charAt(0).toUpperCase()}${part.slice(1)}`).join(' ');
}