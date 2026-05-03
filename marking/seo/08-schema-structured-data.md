# JSON-LD Schema 完整代码模板库

> **铁律**：所有 Schema 必须**在初始 SSR HTML 中输出**（不能等 hydration），否则 Googlebot/AI Bots 抓不到。

---

## 1. 通用：站点根（layout.tsx 全局注入）

### 1.1 Organization

```json
{
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://zhiyu.app/#organization",
  "name": "Zhiyu",
  "alternateName": "知语",
  "url": "https://zhiyu.app",
  "logo": "https://zhiyu.app/logo-512.png",
  "description": "Zhiyu (知语) is a modern Mandarin Chinese learning platform combining HSK courses, character dictionary, and Chinese culture for global learners.",
  "foundingDate": "2026",
  "sameAs": [
    "https://www.wikidata.org/wiki/Q__________",
    "https://en.wikipedia.org/wiki/Zhiyu_(app)",
    "https://www.linkedin.com/company/zhiyu-app",
    "https://twitter.com/zhiyu_app",
    "https://www.youtube.com/@zhiyu_app",
    "https://www.tiktok.com/@zhiyu_app",
    "https://www.facebook.com/zhiyu.app",
    "https://www.reddit.com/user/zhiyu_official"
  ],
  "contactPoint": {
    "@type": "ContactPoint",
    "email": "support@zhiyu.app",
    "contactType": "customer support",
    "availableLanguage": ["English", "Vietnamese", "Thai", "Chinese"]
  }
}
```

### 1.2 WebSite + SearchAction

```json
{
  "@context": "https://schema.org",
  "@type": "WebSite",
  "@id": "https://zhiyu.app/#website",
  "url": "https://zhiyu.app",
  "name": "Zhiyu — Learn Chinese the Modern Way",
  "publisher": { "@id": "https://zhiyu.app/#organization" },
  "potentialAction": {
    "@type": "SearchAction",
    "target": {
      "@type": "EntryPoint",
      "urlTemplate": "https://zhiyu.app/en/search?q={search_term_string}"
    },
    "query-input": "required name=search_term_string"
  },
  "inLanguage": ["en", "vi", "th", "id"]
}
```

---

## 2. 词条页 / 单字页 Schema

```json
[
  {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    "@id": "https://zhiyu.app/en/hanzi/学/#definedterm",
    "name": "学 (xué)",
    "alternateName": "xué",
    "description": "学 (xué) means 'to study' or 'to learn' in Chinese. It is a core HSK 1 character used in compounds like 学习 (to learn), 学生 (student), and 学校 (school).",
    "inDefinedTermSet": {
      "@type": "DefinedTermSet",
      "name": "HSK 1 Vocabulary",
      "url": "https://zhiyu.app/en/hsk/1/vocabulary/"
    },
    "termCode": "学",
    "url": "https://zhiyu.app/en/hanzi/学/",
    "inLanguage": "zh-Hans",
    "subjectOf": {
      "@type": "LearningResource",
      "educationalLevel": "HSK 1",
      "learningResourceType": "Vocabulary entry",
      "teaches": "Chinese character: 学",
      "audience": { "@type": "EducationalAudience", "educationalRole": "Mandarin learner" },
      "isAccessibleForFree": true,
      "inLanguage": "en"
    }
  },
  {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://zhiyu.app/en/" },
      { "@type": "ListItem", "position": 2, "name": "Hanzi Dictionary", "item": "https://zhiyu.app/en/hanzi/" },
      { "@type": "ListItem", "position": 3, "name": "学 (xué)", "item": "https://zhiyu.app/en/hanzi/学/" }
    ]
  },
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": [
      { "@type": "Question", "name": "What does 学 mean in Chinese?",
        "acceptedAnswer": { "@type": "Answer", "text": "学 (xué) means 'to study' or 'to learn'..." }},
      { "@type": "Question", "name": "How do you write 学 stroke by stroke?",
        "acceptedAnswer": { "@type": "Answer", "text": "学 has 8 strokes..." }}
    ]
  }
]
```

---

## 3. 课程页 Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "@id": "https://zhiyu.app/en/courses/business-mandarin/#course",
  "name": "Business Mandarin for Cross-Border E-commerce",
  "description": "A 12-stage Mandarin course tailored for Tiki/Shopee sellers, 1688 sourcing agents, and live-stream e-commerce operators. Learn negotiation, OEM discussions, and trade vocabulary.",
  "provider": { "@id": "https://zhiyu.app/#organization" },
  "url": "https://zhiyu.app/en/courses/business-mandarin/",
  "inLanguage": "en",
  "isAccessibleForFree": true,
  "offers": {
    "@type": "Offer",
    "category": "Free with optional Pro upgrade",
    "price": "0",
    "priceCurrency": "USD"
  },
  "hasCourseInstance": {
    "@type": "CourseInstance",
    "courseMode": "online",
    "courseWorkload": "PT600H",
    "courseSchedule": {
      "@type": "Schedule",
      "duration": "PT45M",
      "repeatFrequency": "Daily",
      "repeatCount": 365
    }
  },
  "instructor": [
    {
      "@type": "Person",
      "@id": "https://zhiyu.app/en/authors/dr-wei-liu/#person",
      "name": "Dr. Wei Liu",
      "jobTitle": "Senior Mandarin Curriculum Designer",
      "image": "https://zhiyu.app/authors/wei-liu.jpg",
      "sameAs": [
        "https://www.linkedin.com/in/wei-liu-zhiyu",
        "https://www.wikidata.org/wiki/Q__________",
        "https://scholar.google.com/citations?user=__________"
      ],
      "alumniOf": "Beijing Language and Culture University"
    }
  ],
  "educationalLevel": "Beginner to Advanced (CEFR A1 to C1)",
  "teaches": ["Negotiation in Mandarin", "OEM/ODM trade vocabulary", "1688 sourcing language", "Live-stream selling phrases"],
  "courseCode": "ZY-EC-2026",
  "numberOfCredits": 0,
  "audience": {
    "@type": "EducationalAudience",
    "educationalRole": "Cross-border e-commerce professional"
  },
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": "4.8",
    "reviewCount": "1287",
    "bestRating": "5"
  },
  "datePublished": "2026-04-15",
  "dateModified": "2026-05-01"
}
```

---

## 4. 文化长文 Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Article",
  "@id": "https://zhiyu.app/en/discover/festivals/mid-autumn/#article",
  "headline": "Mid-Autumn Festival 2026: Date, Origin & 8 Modern Traditions",
  "alternativeHeadline": "中秋节 2026 完整指南",
  "description": "...",
  "image": ["https://zhiyu.app/discover/mid-autumn/hero.webp"],
  "datePublished": "2026-04-15T00:00:00Z",
  "dateModified": "2026-05-01T00:00:00Z",
  "author": { "@id": "https://zhiyu.app/en/authors/li-mei/#person" },
  "publisher": { "@id": "https://zhiyu.app/#organization" },
  "mainEntityOfPage": "https://zhiyu.app/en/discover/festivals/mid-autumn/",
  "inLanguage": "en",
  "articleSection": "Chinese Festivals",
  "wordCount": 2400,
  "citation": [
    { "@type": "CreativeWork", "name": "Mid-Autumn Festival", "url": "https://en.wikipedia.org/wiki/Mid-Autumn_Festival" }
  ],
  "about": {
    "@type": "Event",
    "name": "Mid-Autumn Festival",
    "startDate": "2026-09-25",
    "eventStatus": "https://schema.org/EventScheduled"
  }
}
```

---

## 5. 视频页 Schema

```json
{
  "@context": "https://schema.org",
  "@type": "VideoObject",
  "name": "How to Pronounce 'Xie Xie' (谢谢) — Thank You in Chinese",
  "description": "...",
  "thumbnailUrl": ["https://zhiyu.app/video/xiexie-thumb.webp"],
  "uploadDate": "2026-04-20T00:00:00Z",
  "duration": "PT0M30S",
  "contentUrl": "https://cdn.zhiyu.app/videos/xiexie.mp4",
  "embedUrl": "https://www.youtube.com/embed/__________",
  "transcript": "Xie xie, written 谢谢 in simplified Chinese, is the most common way to say 'thank you'...",
  "hasPart": [
    { "@type": "Clip", "name": "Tone explanation", "startOffset": 5, "endOffset": 12, "url": "https://www.youtube.com/watch?v=...&t=5s" },
    { "@type": "Clip", "name": "Practice", "startOffset": 12, "endOffset": 25, "url": "..." }
  ],
  "publisher": { "@id": "https://zhiyu.app/#organization" }
}
```

---

## 6. 测验题 Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Quiz",
  "name": "HSK 4 Vocabulary Quick Quiz (20 questions)",
  "url": "https://zhiyu.app/en/hsk/4/quiz/",
  "about": {
    "@type": "DefinedTermSet",
    "name": "HSK 4 Vocabulary"
  },
  "educationalAlignment": {
    "@type": "AlignmentObject",
    "alignmentType": "assesses",
    "educationalFramework": "HSK 4.0",
    "targetName": "HSK Level 4"
  },
  "hasPart": [
    {
      "@type": "Question",
      "name": "What does 经济 mean?",
      "eduQuestionType": "Multiple choice",
      "suggestedAnswer": [
        { "@type": "Answer", "text": "Economy", "encodingFormat": "text/plain" },
        { "@type": "Answer", "text": "Geography" },
        { "@type": "Answer", "text": "Religion" }
      ],
      "acceptedAnswer": { "@type": "Answer", "text": "Economy" }
    }
  ]
}
```

---

## 7. APP 下载页 Schema

```json
{
  "@context": "https://schema.org",
  "@type": "MobileApplication",
  "name": "Zhiyu — Learn Chinese",
  "operatingSystem": "iOS, Android",
  "applicationCategory": "EducationApplication",
  "applicationSubCategory": "Language Learning",
  "downloadUrl": [
    "https://apps.apple.com/app/zhiyu/id__________",
    "https://play.google.com/store/apps/details?id=app.zhiyu"
  ],
  "screenshot": ["https://zhiyu.app/app/screen-1.webp"],
  "offers": { "@type": "Offer", "price": "0", "priceCurrency": "USD" },
  "aggregateRating": { "@type": "AggregateRating", "ratingValue": "4.7", "reviewCount": "5421" }
}
```

---

## 8. 作者页 Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Person",
  "@id": "https://zhiyu.app/en/authors/dr-wei-liu/#person",
  "name": "Dr. Wei Liu",
  "givenName": "Wei",
  "familyName": "Liu",
  "image": "https://zhiyu.app/authors/wei-liu.jpg",
  "url": "https://zhiyu.app/en/authors/dr-wei-liu/",
  "jobTitle": "Senior Mandarin Curriculum Designer at Zhiyu",
  "worksFor": { "@id": "https://zhiyu.app/#organization" },
  "alumniOf": [
    { "@type": "EducationalOrganization", "name": "Beijing Language and Culture University" }
  ],
  "knowsAbout": ["HSK", "Mandarin pedagogy", "Chinese characters", "Classical Chinese"],
  "knowsLanguage": ["zh", "en", "vi"],
  "sameAs": [
    "https://www.linkedin.com/in/wei-liu-zhiyu",
    "https://www.wikidata.org/wiki/Q__________",
    "https://scholar.google.com/citations?user=__________",
    "https://orcid.org/0000-0000-0000-0000"
  ]
}
```

---

## 9. 公共组件实现

```typescript
// components/SEO/JsonLd.tsx
export function JsonLd({ data }: { data: object | object[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}

// 用法
import { JsonLd } from '@/components/SEO/JsonLd';
<JsonLd data={[organizationSchema, articleSchema, breadcrumbSchema, faqSchema]} />
```

---

## 10. 校验

每周自动跑：
- https://validator.schema.org/
- https://search.google.com/test/rich-results
- 抓 100 随机页 → 校验全部 0 错误

错误超过 10 → 告警。
