/**
 * E07 ZY-07-06 — HSK self-assessment question bank.
 *
 * 30 questions distributed across HSK 1-6 (5 each). Each item carries a
 * `level` tag used by the scoring algorithm.
 *
 * Algorithm (see hsk-assessment.ts):
 *   recommended_level = max level L such that the user answered ≥ 60% of
 *   questions tagged ≤ L correctly.
 */
export interface HskQuestion {
  id: string;
  level: 1 | 2 | 3 | 4 | 5 | 6;
  prompt: string;
  options: string[];
  answer: number; // 0-based index into options
  hint?: string;
}

export const HSK_QUESTIONS: readonly HskQuestion[] = [
  // ---- HSK 1 (basic greetings, numbers) ----
  { id: 'h1-1', level: 1, prompt: '"你好" 的意思是？', options: ['Goodbye', 'Hello', 'Thanks', 'Sorry'], answer: 1 },
  { id: 'h1-2', level: 1, prompt: '"谢谢" 的意思是？', options: ['Sorry', 'Hello', 'Thanks', 'Yes'], answer: 2 },
  { id: 'h1-3', level: 1, prompt: '"我" 的意思是？', options: ['You', 'I/Me', 'He', 'She'], answer: 1 },
  { id: 'h1-4', level: 1, prompt: '"三" 是几？', options: ['1', '2', '3', '4'], answer: 2 },
  { id: 'h1-5', level: 1, prompt: '"再见" 的意思是？', options: ['Hello', 'Goodbye', 'Welcome', 'Sorry'], answer: 1 },

  // ---- HSK 2 (daily verbs, time) ----
  { id: 'h2-1', level: 2, prompt: '"今天" 是什么意思？', options: ['Tomorrow', 'Today', 'Yesterday', 'Now'], answer: 1 },
  { id: 'h2-2', level: 2, prompt: '选词填空：我_去学校。', options: ['是', '在', '要', '了'], answer: 2 },
  { id: 'h2-3', level: 2, prompt: '"喜欢" 的反义词是？', options: ['爱', '讨厌', '想', '看'], answer: 1 },
  { id: 'h2-4', level: 2, prompt: '"星期" 表示？', options: ['Year', 'Month', 'Week', 'Day'], answer: 2 },
  { id: 'h2-5', level: 2, prompt: '"火车" 是？', options: ['Plane', 'Bus', 'Train', 'Boat'], answer: 2 },

  // ---- HSK 3 (modal verbs, comparisons) ----
  { id: 'h3-1', level: 3, prompt: '"应该" 的意思最接近？', options: ['can', 'should', 'must', 'will'], answer: 1 },
  { id: 'h3-2', level: 3, prompt: '"比较" 在句中常作？', options: ['名词', '动词', '副词', '量词'], answer: 2 },
  { id: 'h3-3', level: 3, prompt: '"虽然...但是..." 表示？', options: ['因果', '转折', '并列', '选择'], answer: 1 },
  { id: 'h3-4', level: 3, prompt: '"打算" 的意思是？', options: ['plan/intend', 'finish', 'forget', 'remember'], answer: 0 },
  { id: 'h3-5', level: 3, prompt: '"练习" 词性是？', options: ['名词/动词皆可', '只名词', '只动词', '形容词'], answer: 0 },

  // ---- HSK 4 (abstract nouns, advanced verbs) ----
  { id: 'h4-1', level: 4, prompt: '"经济" 的意思是？', options: ['Politics', 'Economy', 'Geography', 'Culture'], answer: 1 },
  { id: 'h4-2', level: 4, prompt: '"竟然" 表示？', options: ['expected', 'unexpected/surprise', 'often', 'never'], answer: 1 },
  { id: 'h4-3', level: 4, prompt: '"温度" 是？', options: ['Temperature', 'Humidity', 'Pressure', 'Volume'], answer: 0 },
  { id: 'h4-4', level: 4, prompt: '"无论...都..." 表示？', options: ['假设', '让步', '因果', '递进'], answer: 1 },
  { id: 'h4-5', level: 4, prompt: '"差不多" 在口语中表示？', options: ['完全相同', '大致相同', '完全不同', '不知道'], answer: 1 },

  // ---- HSK 5 (idioms, complex sentences) ----
  { id: 'h5-1', level: 5, prompt: '"既然" 通常和哪个词搭配？', options: ['因为', '就', '虽然', '即使'], answer: 1 },
  { id: 'h5-2', level: 5, prompt: '"独立" 的反义词是？', options: ['依赖', '自由', '坚强', '安静'], answer: 0 },
  { id: 'h5-3', level: 5, prompt: '"承担" 的意思最接近？', options: ['delete', 'take on (responsibility)', 'forget', 'enjoy'], answer: 1 },
  { id: 'h5-4', level: 5, prompt: '"格外" 是？', options: ['副词，特别', '名词，格子', '动词，外出', '形容词'], answer: 0 },
  { id: 'h5-5', level: 5, prompt: '"哪怕" 表示？', options: ['让步', '因果', '并列', '转折'], answer: 0 },

  // ---- HSK 6 (literary, formal Chinese) ----
  { id: 'h6-1', level: 6, prompt: '"举一反三" 的含义是？', options: ['学一点知一点', '从一个例子推及类似', '快速完成', '一举成功'], answer: 1 },
  { id: 'h6-2', level: 6, prompt: '"不言而喻" 意思是？', options: ['必须解释', '不用说就明白', '令人疑惑', '众说纷纭'], answer: 1 },
  { id: 'h6-3', level: 6, prompt: '"潜移默化" 强调？', options: ['迅速改变', '不知不觉的影响', '剧烈冲突', '主动学习'], answer: 1 },
  { id: 'h6-4', level: 6, prompt: '"势在必行" 表示？', options: ['可有可无', '必须做', '难以决定', '禁止做'], answer: 1 },
  { id: 'h6-5', level: 6, prompt: '"水到渠成" 比喻？', options: ['强行推进', '条件成熟自然成功', '事与愿违', '无中生有'], answer: 1 },
];
