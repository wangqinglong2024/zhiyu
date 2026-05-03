import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(scriptDir, '../../../../..');
const requireFromSystem = createRequire(path.join(repoRoot, 'system/package.json'));
const { pinyin } = requireFromSystem('pinyin-pro');
const generatedAt = '2026-05-03T00:00:00+08:00';
const riskControls = [
  'sea_market_safe',
  'no_politics',
  'no_ethnic_conflict',
  'no_religious_dispute',
  'no_territorial_dispute',
  'no_adult_sexual_content',
];

const languageKeys = ['zh', 'en', 'vi', 'th', 'id'];

export function generateCategory(categoryKey) {
  const categoryConfig = categories[categoryKey];
  if (!categoryConfig) throw new Error(`Unknown category: ${categoryKey}`);

  const outputDir = path.join(repoRoot, 'content/01-china/data/articles', categoryConfig.categoryDir, 'phase1');
  mkdirSync(outputDir, { recursive: true });

  const manifestFiles = [];
  let totalSentences = 0;
  for (const [topicIndex, articleConfig] of categoryConfig.articles.entries()) {
    const sentences = generateNarrativeSentences(categoryConfig, articleConfig);
    const document = buildArticleDocument(categoryConfig, articleConfig, sentences);
    const fileName = `${String(topicIndex + 1).padStart(2, '0')}-${articleConfig.slug.replace(/^\d+-/, '')}.article.json`;
    const text = stringifyArticle(document);
    writeFileSync(path.join(outputDir, fileName), text);
    manifestFiles.push({ path: fileName, kind: 'article', rows: 1, sentences: sentences.length, sha256: sha256(text) });
    totalSentences += sentences.length;
  }

  const manifest = {
    schema: 'china.article_manifest.v2',
    domain: 'china',
    category_code: categoryConfig.categoryCode,
    category_dir: categoryConfig.categoryDir,
    phase: 'phase1',
    generated_at: generatedAt,
    update_mode: 'append_only_infinite',
    article_count: categoryConfig.articles.length,
    sentence_target_per_article: 120,
    total_sentences: totalSentences,
    risk_controls: riskControls,
    files: manifestFiles,
    generator: {
      name: `generate-${categoryConfig.generatorName}-phase1.mjs`,
      version: '3.0.0',
      note: 'Story-first generator: each article keeps a 120-sentence Chinese source story plus direct multilingual sentence adaptation.',
    },
  };
  writeFileSync(path.join(outputDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  console.log(JSON.stringify({ outputDir, articles: categoryConfig.articles.length, totalSentences }, null, 2));
}

function generateNarrativeSentences(categoryConfig, articleConfig) {
  const rows = [];
  const pushRow = (sentenceRow) => {
    const contentZh = sentenceRow.content_zh;
    rows.push({
      seq_in_article: rows.length + 1,
      ...sentenceRow,
      content_zh: contentZh,
      pinyin: toPinyin(contentZh),
    });
  };

  pushRow(articleConfig.bluf);
  for (const sentenceRow of introRows(categoryConfig, articleConfig)) pushRow(sentenceRow);

  resolveFacts(articleConfig.facts).forEach((factRow, factIndex) => {
    for (const sentenceRow of factBlockRows(categoryConfig, articleConfig, factRow, factIndex)) pushRow(sentenceRow);
  });

  for (const sentenceRow of closingRows(categoryConfig, articleConfig)) pushRow(sentenceRow);

  if (rows.length !== 120) {
    throw new Error(`${articleConfig.slug} generated ${rows.length} sentences instead of 120`);
  }
  return rows;
}

function resolveFacts(facts) {
  return typeof facts === 'function' ? facts() : facts;
}

function introRows(categoryConfig, articleConfig) {
  return [
    storyRow(langs(`${articleConfig.title_i18n.zh}这件事，可以从${articleConfig.scene.zh}开始。`, `The matter of ${articleConfig.title_i18n.en} can begin with ${articleConfig.scene.en}.`, `Câu chuyện ${articleConfig.title_i18n.vi} có thể bắt đầu từ ${articleConfig.scene.vi}.`, `เรื่อง ${articleConfig.title_i18n.th} เริ่มได้จาก ${articleConfig.scene.th}`, `Kisah ${articleConfig.title_i18n.id} dapat dimulai dari ${articleConfig.scene.id}.`)),
    storyRow(langs(`${articleConfig.place.zh}连接着人物、道路和制度。`, `${articleConfig.place.en} connects people, roads, and institutions.`, `${articleConfig.place.vi} nối con người, con đường và制度.`, `${articleConfig.place.th} เชื่อมผู้คน ถนน และระบบ`, `${articleConfig.place.id} menghubungkan tokoh, jalan, dan lembaga.`)),
    storyRow(langs(`${articleConfig.focus.zh}不是孤立名词，而是在一连串选择里形成的。`, `${articleConfig.focus.en} is not an isolated term; it formed through a chain of choices.`, `${articleConfig.focus.vi} không phải thuật ngữ rời rạc, mà hình thành qua chuỗi lựa chọn.`, `${articleConfig.focus.th} ไม่ใช่คำโดดเดี่ยว แต่เกิดจากการเลือกต่อเนื่อง`, `${articleConfig.focus.id} bukan istilah terpisah, melainkan terbentuk lewat rangkaian pilihan.`)),
    storyRow(langs(`先看到出发点，后面的年代和人物才不会散开。`, `When the starting point is visible, later years and people do not scatter.`, `Khi thấy điểm xuất phát, niên đại và nhân vật phía sau không còn rời rạc.`, `เมื่อเห็นจุดเริ่ม ปีและบุคคลต่อมาจะไม่กระจัดกระจาย`, `Saat titik awal terlihat, tahun dan tokoh berikutnya tidak tercerai.`)),
    storyRow(langs(`当时的人未必知道结局，却要在眼前的局面里行动。`, `People at the time did not know the ending, but they had to act within the situation before them.`, `Người đương thời chưa chắc biết kết cục, nhưng phải hành động trong cục diện trước mắt.`, `คนในเวลานั้นอาจไม่รู้ตอนจบ แต่ต้องลงมือในสถานการณ์ตรงหน้า`, `Orang saat itu belum tentu tahu akhir cerita, tetapi harus bertindak dalam keadaan yang mereka hadapi.`)),
    storyRow(langs(`有的选择落在朝廷，有的选择落在边路，也有的落在普通生活。`, `Some choices fell on the court, some on frontier routes, and some on ordinary life.`, `Có lựa chọn nằm ở triều đình, có lựa chọn ở đường biên, cũng có lựa chọn trong đời thường.`, `บางการเลือกเกิดในราชสำนัก บางอย่างบนทางชายแดน และบางอย่างในชีวิตประจำวัน`, `Sebagian pilihan terjadi di istana, sebagian di jalan perbatasan, dan sebagian dalam kehidupan biasa.`)),
    storyRow(langs(`这些选择汇在一起，才让${articleConfig.focus.zh}逐渐成形。`, `Those choices came together and gradually shaped ${articleConfig.focus.en}.`, `Những lựa chọn ấy hợp lại và dần tạo nên ${articleConfig.focus.vi}.`, `การเลือกเหล่านั้นรวมกันและค่อย ๆ ทำให้ ${articleConfig.focus.th} เป็นรูปเป็นร่าง`, `Pilihan-pilihan itu berkumpul dan perlahan membentuk ${articleConfig.focus.id}.`)),
    storyRow(langs(`故事往前走时，时间会一段一段展开。`, `As the story moves forward, time opens section by section.`, `Khi câu chuyện tiến lên, thời gian mở ra từng đoạn.`, `เมื่อเรื่องเดินหน้า เวลาเปิดออกเป็นช่วง ๆ`, `Saat kisah bergerak maju, waktu terbuka bagian demi bagian.`)),
    storyRow(langs(`地点也会改变意义，从背景变成行动的条件。`, `Places also change meaning, moving from background into conditions for action.`, `Địa điểm cũng đổi ý nghĩa, từ phông nền thành điều kiện hành động.`, `สถานที่ก็เปลี่ยนความหมาย จากฉากหลังเป็นเงื่อนไขของการกระทำ`, `Tempat juga berubah makna, dari latar menjadi syarat tindakan.`)),
    storyRow(langs(`人物的名字不是用来堆砌的，而是为了说明谁在改变局面。`, `Names are not stacked for display; they show who changed the situation.`, `Tên nhân vật không dùng để xếp chồng, mà để nói ai đã làm cục diện đổi thay.`, `ชื่อบุคคลไม่ได้วางไว้เพื่อให้มาก แต่เพื่อบอกว่าใครเปลี่ยนสถานการณ์`, `Nama tokoh bukan untuk ditumpuk, melainkan untuk menunjukkan siapa yang mengubah keadaan.`)),
    storyRow(langs(`制度、器物和路线看似安静，却常常决定事情能不能继续。`, `Systems, objects, and routes may seem quiet, but they often decide whether events can continue.`, `制度, đồ vật và tuyến đường có vẻ lặng lẽ, nhưng thường quyết định sự việc có tiếp tục được không.`, `ระบบ สิ่งของ และเส้นทางดูนิ่ง แต่บ่อยครั้งกำหนดว่าเรื่องจะเดินต่อได้หรือไม่`, `Lembaga, benda, dan rute tampak tenang, tetapi sering menentukan apakah peristiwa dapat berlanjut.`)),
    storyRow(langs(`于是道路、人物和制度一起向前，开头的场面也有了方向。`, `Thus roads, people, and institutions moved forward together, and the opening scene gained direction.`, `Vì thế con đường, con người và制度 cùng tiến lên, cảnh mở đầu cũng có phương hướng.`, `ดังนั้นถนน ผู้คน และระบบจึงเดินหน้าไปพร้อมกัน และฉากแรกก็มีทิศทาง`, `Maka jalan, tokoh, dan lembaga bergerak bersama, dan adegan awal memperoleh arah.`)),
    storyRow(langs(`接下来，每一步都会接住上一步留下的变化。`, `Next, each step receives the change left by the previous one.`, `Tiếp theo, mỗi bước sẽ nối lấy thay đổi mà bước trước để lại.`, `ต่อไป แต่ละก้าวจะรับการเปลี่ยนแปลงจากก้าวก่อน`, `Berikutnya, setiap langkah menangkap perubahan dari langkah sebelumnya.`)),
    storyRow(langs(`读到最后，开头的场面会重新变得清楚。`, `By the end, the opening scene will become clear again.`, `Đọc đến cuối, cảnh mở đầu sẽ rõ lại.`, `เมื่ออ่านถึงท้าย ฉากแรกจะกลับมาชัดเจน`, `Saat sampai akhir, adegan pembuka akan kembali jelas.`)),
  ];
}

function factBlockRows(categoryConfig, articleConfig, factRow, factIndex) {
  const block = factNarrativeBlocks[factIndex] ?? factNarrativeBlocks[factNarrativeBlocks.length - 1];
  return [
    storyRow(factRow),
    ...block.map((makeRow) => storyRow(makeRow({ categoryConfig, articleConfig, factRow }))),
  ];
}

const factNarrativeBlocks = [
  [
    ({ articleConfig }) => langs(`最早的场面先安静下来，${articleConfig.place.zh}有了继续发展的起点。`, `The earliest scene settled first, and ${articleConfig.place.en} gained a starting point for further change.`, `Cảnh sớm nhất lắng xuống trước, và ${articleConfig.place.vi} có điểm khởi đầu để tiếp tục phát triển.`, `ฉากแรกเริ่มนิ่งลง และ ${articleConfig.place.th} มีจุดตั้งต้นสำหรับการเปลี่ยนต่อ`, `Adegan awal menjadi tenang, dan ${articleConfig.place.id} memperoleh titik awal untuk berkembang.`),
    () => langs('人们把旧经验带进新局面，许多做法还在寻找形状。', 'People carried older experience into a new situation, while many practices were still taking shape.', 'Người ta mang kinh nghiệm cũ vào cục diện mới, nhiều cách làm vẫn đang thành hình.', 'ผู้คนพาประสบการณ์เดิมเข้าสู่สถานการณ์ใหม่ และหลายวิธียังหาทรงรูปอยู่', 'Orang membawa pengalaman lama ke keadaan baru, sementara banyak praktik masih mencari bentuk.'),
    () => langs('有人守着原来的秩序，有人已经看见变化的可能。', 'Some held to the older order, while others already saw the possibility of change.', 'Có người giữ trật tự cũ, có người đã thấy khả năng thay đổi.', 'บางคนรักษาระเบียบเดิม บางคนเริ่มเห็นความเป็นไปได้ของการเปลี่ยนแปลง', 'Sebagian mempertahankan tatanan lama, sementara yang lain melihat kemungkinan perubahan.'),
    ({ articleConfig }) => langs(`${articleConfig.focus.zh}就在这种拉扯中露出轮廓。`, `${articleConfig.focus.en} began to show its outline inside this pull between old and new.`, `${articleConfig.focus.vi} bắt đầu hiện đường nét trong sự giằng co ấy.`, `${articleConfig.focus.th} เริ่มเห็นเค้าโครงในแรงดึงระหว่างเก่าและใหม่`, `${articleConfig.focus.id} mulai tampak dalam tarikan antara lama dan baru.`),
    () => langs('道路还没有完全畅通，消息也常常走得很慢。', 'Roads were not fully open yet, and news often traveled slowly.', 'Đường sá chưa hoàn toàn thông suốt, tin tức cũng thường đi rất chậm.', 'ถนนยังไม่โล่งเต็มที่ ข่าวสารก็มักเดินทางช้า', 'Jalan belum sepenuhnya lancar, dan kabar sering bergerak lambat.'),
    () => langs('正因为慢，每一次传递都显得很重。', 'Precisely because movement was slow, every transmission carried weight.', 'Chính vì chậm, mỗi lần truyền đi đều có sức nặng.', 'เพราะมันช้า ทุกการส่งต่อจึงมีน้ำหนัก', 'Justru karena lambat, setiap penyampaian terasa berbobot.'),
    () => langs('城门、驿道、河流和边地，都成了变化经过的地方。', 'City gates, post roads, rivers, and frontiers all became places through which change passed.', 'Cổng thành, đường trạm, sông ngòi và biên địa đều thành nơi biến đổi đi qua.', 'ประตูเมือง ถนนส่งสาร แม่น้ำ และชายแดนล้วนเป็นที่ที่ความเปลี่ยนแปลงผ่านไป', 'Gerbang kota, jalan pos, sungai, dan perbatasan menjadi tempat perubahan lewat.'),
    () => langs('普通人也许只听到一句传闻，却要调整一天的生活。', 'Ordinary people might hear only one rumor, yet still adjust a day of life.', 'Người bình thường có thể chỉ nghe một lời đồn, nhưng vẫn phải điều chỉnh một ngày sống.', 'คนธรรมดาอาจได้ยินแค่ข่าวลือเดียว แต่ก็ต้องปรับชีวิตทั้งวัน', 'Orang biasa mungkin hanya mendengar satu kabar, tetapi harus menyesuaikan hari mereka.'),
    () => langs('官员和使者则要把零散消息写成可执行的安排。', 'Officials and envoys had to turn scattered news into workable arrangements.', 'Quan lại và sứ giả phải biến tin rời rạc thành sắp xếp có thể thực hiện.', 'ขุนนางและทูตต้องเปลี่ยนข่าวกระจัดกระจายให้เป็นแผนที่ทำได้', 'Pejabat dan utusan harus mengubah kabar terpisah menjadi pengaturan yang dapat dijalankan.'),
    ({ articleConfig }) => langs(`于是${articleConfig.scene.zh}不再遥远，它开始贴近人的选择。`, `Thus ${articleConfig.scene.en} was no longer distant; it came close to human choices.`, `Vì thế ${articleConfig.scene.vi} không còn xa xôi, mà tiến sát lựa chọn con người.`, `ดังนั้น ${articleConfig.scene.th} จึงไม่ไกลอีกต่อไป แต่มาใกล้การเลือกของคน`, `Maka ${articleConfig.scene.id} tidak lagi jauh; ia mendekati pilihan manusia.`),
    () => langs('这时，变化还小，却已经把后面的方向打开。', 'At this moment the change was still small, but it had opened the direction ahead.', 'Lúc này thay đổi còn nhỏ, nhưng đã mở hướng phía sau.', 'ตอนนี้การเปลี่ยนแปลงยังเล็ก แต่ได้เปิดทิศทางข้างหน้าแล้ว', 'Saat ini perubahan masih kecil, tetapi telah membuka arah berikutnya.'),
    () => langs('早期的判断会影响后来的制度，也会影响人们怎样记住这段事。', 'Early judgments would affect later institutions and how people remembered this episode.', 'Nhận định ban đầu sẽ ảnh hưởng制度 về sau, cũng ảnh hưởng cách người ta nhớ đoạn này.', 'การตัดสินแรก ๆ จะส่งผลต่อระบบภายหลังและวิธีที่ผู้คนจดจำช่วงนี้', 'Penilaian awal memengaruhi lembaga kemudian dan cara orang mengingat bagian ini.'),
    () => langs('故事没有立刻抵达高潮，却已经离开原来的静止状态。', 'The story did not reach its height at once, but it had already left its earlier stillness.', 'Câu chuyện chưa tới cao trào ngay, nhưng đã rời trạng thái tĩnh ban đầu.', 'เรื่องยังไม่ถึงจุดสูงสุดทันที แต่ได้ออกจากความนิ่งเดิมแล้ว', 'Kisah belum langsung mencapai puncak, tetapi sudah meninggalkan keadaan diamnya.'),
    () => langs('新的疑问在前方出现，下一段变化也随之到来。', 'New questions appeared ahead, and the next change arrived with them.', 'Câu hỏi mới hiện ra phía trước, và thay đổi tiếp theo cũng đến theo.', 'คำถามใหม่ปรากฏข้างหน้า และความเปลี่ยนแปลงถัดไปก็ตามมา', 'Pertanyaan baru muncul di depan, dan perubahan berikutnya datang bersamanya.'),
  ],
  [
    ({ articleConfig }) => langs(`局势向前推进时，${articleConfig.place.zh}里的力量开始重新排列。`, `As the situation moved forward, forces in ${articleConfig.place.en} began to rearrange.`, `Khi cục diện tiến lên, các lực lượng ở ${articleConfig.place.vi} bắt đầu sắp xếp lại.`, `เมื่อสถานการณ์เดินหน้า พลังใน ${articleConfig.place.th} เริ่มจัดเรียงใหม่`, `Saat keadaan maju, kekuatan di ${articleConfig.place.id} mulai tersusun ulang.`),
    () => langs('原来分开的道路被迫互相靠近，原来熟悉的规矩也要接受考验。', 'Roads once separate were forced closer, and familiar rules faced tests.', 'Những con đường từng tách rời buộc phải gần nhau, quy tắc quen thuộc cũng bị thử thách.', 'ถนนที่เคยแยกจากกันถูกบังคับให้เข้าใกล้ และกฎที่คุ้นเคยต้องถูกทดสอบ', 'Jalan yang dulu terpisah dipaksa mendekat, dan aturan yang akrab diuji.'),
    () => langs('掌握信息的人先看见危险，也先看见机会。', 'Those who held information saw danger first, and also saw opportunity first.', 'Người nắm thông tin thấy nguy hiểm trước, cũng thấy cơ hội trước.', 'คนที่ถือข้อมูลเห็นอันตรายก่อน และเห็นโอกาสก่อนเช่นกัน', 'Orang yang memegang informasi melihat bahaya lebih dulu dan peluang lebih dulu.'),
    () => langs('他们必须决定是守住旧办法，还是试着打开新路。', 'They had to decide whether to hold old methods or try to open a new road.', 'Họ phải quyết định giữ cách cũ hay thử mở đường mới.', 'พวกเขาต้องตัดสินใจว่าจะรักษาวิธีเดิมหรือเปิดทางใหม่', 'Mereka harus memutuskan mempertahankan cara lama atau membuka jalan baru.'),
    ({ articleConfig }) => langs(`${articleConfig.focus.zh}因此不只是结果，也是一串选择留下的痕迹。`, `${articleConfig.focus.en} was therefore not only an outcome, but traces left by a series of choices.`, `${articleConfig.focus.vi} vì thế không chỉ là kết quả, mà là dấu vết của chuỗi lựa chọn.`, `${articleConfig.focus.th} จึงไม่ใช่แค่ผลลัพธ์ แต่เป็นร่องรอยจากการเลือกต่อเนื่อง`, `${articleConfig.focus.id} karena itu bukan hanya hasil, melainkan jejak rangkaian pilihan.`),
    () => langs('有些选择很快见效，有些选择要等很久才显出来。', 'Some choices showed effects quickly, while others appeared only after a long wait.', 'Có lựa chọn có hiệu quả nhanh, có lựa chọn phải đợi lâu mới hiện ra.', 'บางการเลือกเห็นผลเร็ว บางอย่างต้องรอนานจึงปรากฏ', 'Sebagian pilihan cepat terlihat hasilnya, sebagian baru tampak setelah lama.'),
    () => langs('短暂的胜负之外，还有更慢的秩序正在形成。', 'Beyond short-term success or failure, a slower order was forming.', 'Ngoài thắng bại ngắn hạn, một trật tự chậm hơn đang hình thành.', 'นอกเหนือจากแพ้ชนะระยะสั้น ยังมีระเบียบที่ช้ากว่ากำลังก่อตัว', 'Di luar menang-kalah sesaat, tatanan yang lebih lambat sedang terbentuk.'),
    () => langs('这份秩序会进入文书、道路、税赋或日常习惯。', 'That order would enter documents, roads, taxes, or daily habits.', 'Trật tự ấy sẽ đi vào văn thư, đường sá, thuế khóa hoặc thói quen hằng ngày.', 'ระเบียบนั้นจะเข้าสู่เอกสาร ถนน ภาษี หรือความเคยชินประจำวัน', 'Tatanan itu masuk ke dokumen, jalan, pajak, atau kebiasaan sehari-hari.'),
    () => langs('于是宏大的变化落到一盏灯、一匹马或一封信上。', 'Thus a large change landed on a lamp, a horse, or a letter.', 'Vì thế biến đổi lớn rơi xuống một ngọn đèn, một con ngựa hoặc một lá thư.', 'ดังนั้นความเปลี่ยนแปลงใหญ่จึงตกลงบนตะเกียง ม้า หรือจดหมายหนึ่งฉบับ', 'Maka perubahan besar jatuh pada sebuah lampu, seekor kuda, atau sepucuk surat.'),
    () => langs('人们从这些小处感到时代已经转身。', 'People felt through these small things that the age had turned.', 'Người ta cảm thấy từ những điều nhỏ ấy rằng thời đại đã xoay mình.', 'ผู้คนรับรู้จากสิ่งเล็กเหล่านี้ว่ายุคสมัยได้หันตัวแล้ว', 'Orang merasakan dari hal-hal kecil bahwa zaman telah berbalik.'),
    () => langs('新的名字开始被记住，旧的名字也被放进新的位置。', 'New names began to be remembered, and old names were placed in new positions.', 'Tên mới bắt đầu được nhớ, tên cũ cũng được đặt vào vị trí mới.', 'ชื่อใหม่เริ่มถูกจดจำ และชื่อเก่าก็ถูกวางในตำแหน่งใหม่', 'Nama baru mulai diingat, dan nama lama ditempatkan pada posisi baru.'),
    () => langs('这样的转动不会只影响一天，而会延伸到很多年后。', 'Such turning would not affect only one day; it would extend many years ahead.', 'Sự xoay chuyển ấy không chỉ ảnh hưởng một ngày, mà kéo dài nhiều năm sau.', 'การหมุนเช่นนี้ไม่กระทบแค่วันเดียว แต่ยืดไปอีกหลายปี', 'Perputaran seperti ini tidak hanya memengaruhi satu hari, tetapi menjulur bertahun-tahun.'),
    () => langs('后面的人回看时，会把这一段当成重要的转弯。', 'Later people looking back would treat this part as an important turn.', 'Người đời sau nhìn lại sẽ xem đoạn này như khúc rẽ quan trọng.', 'คนรุ่นหลังเมื่อมองกลับมาจะเห็นช่วงนี้เป็นทางเลี้ยวสำคัญ', 'Orang kemudian yang menoleh ke belakang melihat bagian ini sebagai belokan penting.'),
    () => langs('路已经不再直走，下一场变化正在靠近。', 'The road no longer moved straight, and the next change was drawing near.', 'Con đường không còn đi thẳng, thay đổi tiếp theo đang đến gần.', 'ถนนไม่ได้ตรงต่อไปแล้ว ความเปลี่ยนแปลงถัดไปกำลังเข้ามาใกล้', 'Jalan tidak lagi lurus, dan perubahan berikutnya mendekat.'),
  ],
  [
    ({ articleConfig }) => langs(`到了这一段，${articleConfig.scene.zh}里的空间变得更开阔。`, `By this part, the space inside ${articleConfig.scene.en} became wider.`, `Đến đoạn này, không gian trong ${articleConfig.scene.vi} trở nên rộng hơn.`, `มาถึงช่วงนี้ พื้นที่ใน ${articleConfig.scene.th} กว้างขึ้น`, `Pada bagian ini, ruang dalam ${articleConfig.scene.id} menjadi lebih luas.`),
    () => langs('原先只属于少数人的决定，开始影响更多地方。', 'Decisions once limited to a few people began to affect more places.', 'Quyết định vốn thuộc về số ít bắt đầu ảnh hưởng nhiều nơi hơn.', 'การตัดสินใจที่เคยอยู่กับคนไม่กี่คนเริ่มกระทบพื้นที่มากขึ้น', 'Keputusan yang dulu milik sedikit orang mulai memengaruhi lebih banyak tempat.'),
    () => langs('车马、船只、驿站或城门，都把变化送得更远。', 'Carts, boats, post stations, or city gates carried change farther.', 'Xe ngựa, thuyền, trạm dịch hoặc cổng thành đều đưa biến đổi đi xa hơn.', 'รถม้า เรือ สถานีไปรษณีย์ หรือประตูเมืองล้วนส่งความเปลี่ยนแปลงไปไกลขึ้น', 'Kereta, kapal, pos, atau gerbang kota membawa perubahan lebih jauh.'),
    () => langs('人们听到新消息时，会把它和自己的处境放在一起想。', 'When people heard new news, they weighed it against their own situation.', 'Khi nghe tin mới, người ta đặt nó cạnh hoàn cảnh của mình để suy nghĩ.', 'เมื่อผู้คนได้ยินข่าวใหม่ พวกเขาจะเทียบกับสภาพของตนเอง', 'Saat orang mendengar kabar baru, mereka menimbangnya dengan keadaan sendiri.'),
    () => langs('有的家庭要迁徙，有的工匠要改工具，有的官员要重写文书。', 'Some families had to move, some artisans had to change tools, and some officials had to rewrite documents.', 'Có gia đình phải dời đi, có thợ phải đổi công cụ, có quan lại phải viết lại văn thư.', 'บางครอบครัวต้องย้าย ช่างบางคนต้องเปลี่ยนเครื่องมือ และขุนนางบางคนต้องเขียนเอกสารใหม่', 'Sebagian keluarga harus pindah, sebagian perajin mengganti alat, dan sebagian pejabat menulis ulang dokumen.'),
    () => langs('大事就是这样落进小日子里。', 'Large events entered small daily life in this way.', 'Đại sự đi vào đời sống nhỏ bé như vậy.', 'เรื่องใหญ่เข้าสู่ชีวิตประจำวันเล็ก ๆ แบบนี้', 'Peristiwa besar masuk ke hidup kecil sehari-hari seperti ini.'),
    ({ articleConfig }) => langs(`${articleConfig.focus.zh}的意义，也从记忆变成了可触摸的安排。`, `The meaning of ${articleConfig.focus.en} also changed from memory into arrangements people could touch.`, `Ý nghĩa của ${articleConfig.focus.vi} cũng từ ký ức thành sắp xếp có thể chạm tới.`, `ความหมายของ ${articleConfig.focus.th} จึงเปลี่ยนจากความจำเป็นการจัดการที่จับต้องได้`, `Makna ${articleConfig.focus.id} juga berubah dari ingatan menjadi pengaturan yang dapat disentuh.`),
    () => langs('这种安排不一定整齐，却会在反复使用中变得稳定。', 'Such arrangements were not always neat, but repeated use made them stable.', 'Sắp xếp ấy không nhất thiết gọn gàng, nhưng dùng đi dùng lại khiến nó ổn định.', 'การจัดการเช่นนี้ไม่จำเป็นต้องเรียบร้อย แต่การใช้ซ้ำทำให้มั่นคง', 'Pengaturan seperti ini tidak selalu rapi, tetapi pemakaian berulang membuatnya stabil.'),
    () => langs('稳定以后，后人再看它，就像看见一块路标。', 'Once stable, later generations could see it like a road sign.', 'Khi ổn định, đời sau nhìn nó như thấy một biển chỉ đường.', 'เมื่อมั่นคงแล้ว คนรุ่นหลังมองมันเหมือนป้ายบอกทาง', 'Setelah stabil, generasi kemudian melihatnya seperti rambu jalan.'),
    () => langs('路标不替人走路，却能提醒方向。', 'A road sign does not walk for people, but it reminds them of direction.', 'Biển chỉ đường không đi thay người, nhưng nhắc hướng đi.', 'ป้ายบอกทางไม่ได้เดินแทนคน แต่เตือนทิศทาง', 'Rambu tidak berjalan menggantikan orang, tetapi mengingatkan arah.'),
    () => langs('这一段历史也是如此，它提醒人们变化曾经怎样穿过生活。', 'This part of history is similar; it reminds people how change once passed through life.', 'Đoạn lịch sử này cũng vậy, nó nhắc người ta biến đổi từng đi qua đời sống thế nào.', 'ประวัติศาสตร์ช่วงนี้ก็เช่นกัน มันเตือนว่าความเปลี่ยนแปลงเคยผ่านชีวิตอย่างไร', 'Bagian sejarah ini juga begitu; ia mengingatkan bagaimana perubahan pernah melewati hidup.'),
    () => langs('看到这里，前后的距离被拉近了。', 'At this point, the distance between before and after grew shorter.', 'Đến đây, khoảng cách trước sau được kéo gần.', 'ถึงตรงนี้ ระยะระหว่างก่อนและหลังถูกดึงเข้ามาใกล้', 'Di titik ini, jarak antara sebelum dan sesudah menjadi dekat.'),
    () => langs('前面留下的痕迹没有消失，而是在新局面里换了样子。', 'Traces left earlier did not disappear; they changed form in the new situation.', 'Dấu vết trước đó không biến mất, mà đổi hình trong cục diện mới.', 'ร่องรอยก่อนหน้าไม่ได้หายไป แต่เปลี่ยนรูปในสถานการณ์ใหม่', 'Jejak sebelumnya tidak hilang, melainkan berubah bentuk dalam keadaan baru.'),
    () => langs('下一个转折因此不是突然出现，而是从这些痕迹里长出来。', 'The next turn therefore did not appear suddenly; it grew out of these traces.', 'Bước ngoặt tiếp theo vì thế không xuất hiện đột ngột, mà mọc lên từ những dấu vết ấy.', 'จุดเปลี่ยนถัดไปจึงไม่ได้เกิดฉับพลัน แต่เติบโตจากร่องรอยเหล่านี้', 'Belokan berikutnya tidak muncul tiba-tiba, tetapi tumbuh dari jejak-jejak ini.'),
  ],
  [
    ({ articleConfig }) => langs(`故事走到中段，${articleConfig.place.zh}开始显出新的边界。`, `In the middle of the story, ${articleConfig.place.en} began to show new boundaries.`, `Đến giữa câu chuyện, ${articleConfig.place.vi} bắt đầu hiện ranh giới mới.`, `เมื่อเรื่องมาถึงช่วงกลาง ${articleConfig.place.th} เริ่มเห็นขอบเขตใหม่`, `Di tengah kisah, ${articleConfig.place.id} mulai menunjukkan batas baru.`),
    () => langs('边界有时是地理上的，有时是制度上的。', 'Boundaries were sometimes geographic and sometimes institutional.', 'Ranh giới có khi thuộc địa lý, có khi thuộc制度.', 'ขอบเขตบางครั้งเป็นภูมิศาสตร์ บางครั้งเป็นระบบ', 'Batas kadang bersifat geografis, kadang kelembagaan.'),
    () => langs('人们跨过边界时，带走货物、文书、语言和记忆。', 'When people crossed boundaries, they carried goods, documents, language, and memory.', 'Khi vượt qua ranh giới, người ta mang theo hàng hóa, văn thư, ngôn ngữ và ký ức.', 'เมื่อผู้คนข้ามขอบเขต พวกเขานำสินค้า เอกสาร ภาษา และความทรงจำไปด้วย', 'Saat orang melintasi batas, mereka membawa barang, dokumen, bahasa, dan ingatan.'),
    () => langs('这些东西看似零散，却会在新的地方重新组合。', 'These things seemed scattered, but they recombined in new places.', 'Những thứ ấy có vẻ rời rạc, nhưng sẽ ghép lại ở nơi mới.', 'สิ่งเหล่านี้ดูแยกกัน แต่จะรวมตัวใหม่ในที่ใหม่', 'Hal-hal itu tampak terpisah, tetapi tersusun ulang di tempat baru.'),
    () => langs('组合以后，旧故事就有了新声音。', 'After recombination, the old story gained a new voice.', 'Sau khi ghép lại, câu chuyện cũ có giọng mới.', 'เมื่อรวมกันแล้ว เรื่องเก่าก็มีเสียงใหม่', 'Setelah tersusun ulang, kisah lama memperoleh suara baru.'),
    ({ articleConfig }) => langs(`${articleConfig.focus.zh}也在这种新声音里继续延伸。`, `${articleConfig.focus.en} also continued to extend through this new voice.`, `${articleConfig.focus.vi} cũng tiếp tục kéo dài trong giọng mới ấy.`, `${articleConfig.focus.th} จึงยืดต่อไปในเสียงใหม่นี้`, `${articleConfig.focus.id} juga terus memanjang dalam suara baru ini.`),
    () => langs('有些改变被写进官方记录，有些改变只留在习惯里。', 'Some changes entered official records, while others remained only in habits.', 'Có thay đổi đi vào ghi chép chính thức, có thay đổi chỉ ở lại trong thói quen.', 'บางการเปลี่ยนแปลงเข้าสู่บันทึกทางการ บางอย่างอยู่ในความเคยชินเท่านั้น', 'Sebagian perubahan masuk catatan resmi, sebagian hanya tinggal dalam kebiasaan.'),
    () => langs('记录能告诉年代，习惯能告诉生活怎样继续。', 'Records tell the year; habits tell how life continued.', 'Ghi chép cho biết niên đại, thói quen cho biết đời sống tiếp tục thế nào.', 'บันทึกบอกปีสมัย ความเคยชินบอกว่าชีวิตดำเนินต่ออย่างไร', 'Catatan memberi tahun, kebiasaan memberi tahu bagaimana hidup berlanjut.'),
    () => langs('两者放在一起，历史才不只剩下结论。', 'When the two are placed together, history is not left as only a conclusion.', 'Đặt hai thứ cạnh nhau, lịch sử không chỉ còn kết luận.', 'เมื่อนำทั้งสองมาวางด้วยกัน ประวัติศาสตร์จึงไม่เหลือแค่ข้อสรุป', 'Jika keduanya diletakkan bersama, sejarah tidak hanya tersisa sebagai kesimpulan.'),
    () => langs('它会有声音，有路程，也有等待和误会。', 'It has voices, journeys, waiting, and misunderstandings.', 'Nó có âm thanh, hành trình, chờ đợi và hiểu lầm.', 'มันมีเสียง มีระยะทาง มีการรอคอย และความเข้าใจผิด', 'Ia memiliki suara, perjalanan, penantian, dan salah paham.'),
    () => langs('等待让人谨慎，误会又推动新的解释出现。', 'Waiting made people cautious, while misunderstandings pushed new explanations to appear.', 'Chờ đợi khiến người ta thận trọng, hiểu lầm lại thúc đẩy giải thích mới xuất hiện.', 'การรอคอยทำให้คนระวัง ส่วนความเข้าใจผิดผลักให้คำอธิบายใหม่เกิดขึ้น', 'Penantian membuat orang berhati-hati, dan salah paham mendorong penjelasan baru muncul.'),
    () => langs('这个过程中，许多看不见的安排开始发挥作用。', 'In this process, many unseen arrangements began to work.', 'Trong quá trình ấy, nhiều sắp xếp vô hình bắt đầu phát huy tác dụng.', 'ในกระบวนการนี้ การจัดการที่มองไม่เห็นหลายอย่างเริ่มทำงาน', 'Dalam proses ini, banyak pengaturan tak terlihat mulai bekerja.'),
    () => langs('它们慢慢改变道路上的人，也改变后来的记忆。', 'They slowly changed people on the road and also changed later memory.', 'Chúng dần thay đổi người trên đường, cũng thay đổi ký ức về sau.', 'พวกมันค่อย ๆ เปลี่ยนคนบนทาง และเปลี่ยนความทรงจำภายหลัง', 'Semua itu perlahan mengubah orang di jalan dan ingatan kemudian.'),
    () => langs('新的边界已经画出，新的行动也会跟着出现。', 'New boundaries had been drawn, and new actions would follow.', 'Ranh giới mới đã được vẽ ra, hành động mới cũng sẽ xuất hiện theo.', 'ขอบเขตใหม่ถูกวาดแล้ว การกระทำใหม่ก็จะตามมา', 'Batas baru telah tergambar, dan tindakan baru akan mengikuti.'),
  ],
  [
    ({ articleConfig }) => langs(`接近后半段时，${articleConfig.scene.zh}里的压力变得更明显。`, `Near the latter half, pressure inside ${articleConfig.scene.en} became clearer.`, `Đến gần nửa sau, áp lực trong ${articleConfig.scene.vi} rõ hơn.`, `เมื่อใกล้ครึ่งหลัง แรงกดดันใน ${articleConfig.scene.th} ชัดขึ้น`, `Mendekati bagian akhir, tekanan dalam ${articleConfig.scene.id} menjadi lebih jelas.`),
    () => langs('压力不会只停在上层，也会传到商路、田地、码头或书房。', 'Pressure did not remain only above; it reached trade routes, fields, docks, or study rooms.', 'Áp lực không chỉ ở tầng trên, mà truyền tới đường buôn, ruộng đất, bến cảng hoặc thư phòng.', 'แรงกดดันไม่ได้อยู่แค่เบื้องบน แต่ไปถึงทางค้า ทุ่งนา ท่าเรือ หรือห้องหนังสือ', 'Tekanan tidak hanya berada di atas; ia mencapai jalur dagang, ladang, dermaga, atau ruang belajar.'),
    () => langs('有些人顺势而行，有些人试图把速度放慢。', 'Some followed the current, while others tried to slow the speed.', 'Có người thuận thế đi theo, có người cố làm tốc độ chậm lại.', 'บางคนไหลตามกระแส บางคนพยายามทำให้ความเร็วช้าลง', 'Sebagian mengikuti arus, sementara yang lain mencoba memperlambatnya.'),
    () => langs('速度一变，选择的代价也跟着改变。', 'When speed changed, the cost of choice changed with it.', 'Tốc độ đổi, cái giá của lựa chọn cũng đổi theo.', 'เมื่อความเร็วเปลี่ยน ราคาของการเลือกก็เปลี่ยนตาม', 'Saat kecepatan berubah, biaya pilihan ikut berubah.'),
    ({ articleConfig }) => langs(`${articleConfig.focus.zh}在这里显出另一面：它既有结果，也有代价。`, `${articleConfig.focus.en} showed another side here: it had outcomes and costs.`, `${articleConfig.focus.vi} ở đây hiện mặt khác: nó có kết quả, cũng có cái giá.`, `${articleConfig.focus.th} แสดงอีกด้านตรงนี้ คือมีทั้งผลลัพธ์และราคา`, `${articleConfig.focus.id} menunjukkan sisi lain di sini: ada hasil dan ada biaya.`),
    () => langs('代价可能是一段路变远，也可能是一种身份被重新定义。', 'The cost could be a road becoming farther, or an identity being redefined.', 'Cái giá có thể là con đường xa hơn, cũng có thể là thân phận được định nghĩa lại.', 'ราคาอาจเป็นถนนที่ไกลขึ้น หรือสถานะที่ถูกนิยามใหม่', 'Biaya bisa berupa jalan yang makin jauh atau identitas yang didefinisikan ulang.'),
    () => langs('人们在代价面前学会权衡，也学会等待。', 'Facing costs, people learned to weigh options and to wait.', 'Trước cái giá ấy, người ta học cách cân nhắc và chờ đợi.', 'ต่อหน้าราคานั้น ผู้คนเรียนรู้การชั่งน้ำหนักและการรอ', 'Di hadapan biaya itu, orang belajar menimbang dan menunggu.'),
    () => langs('等待中会出现新的办法，也会暴露旧办法的不足。', 'During waiting, new methods appeared and older methods showed their limits.', 'Trong chờ đợi xuất hiện cách mới, cũng lộ ra thiếu sót của cách cũ.', 'ระหว่างรอ มีวิธีใหม่เกิดขึ้น และข้อจำกัดของวิธีเก่าก็เผยออกมา', 'Dalam penantian muncul cara baru, dan kekurangan cara lama terlihat.'),
    () => langs('这些不足让下一次改变更难回避。', 'Those limits made the next change harder to avoid.', 'Những thiếu sót ấy khiến lần thay đổi tiếp theo khó tránh hơn.', 'ข้อจำกัดเหล่านี้ทำให้การเปลี่ยนครั้งถัดไปหลีกเลี่ยงยากขึ้น', 'Kekurangan itu membuat perubahan berikutnya makin sulit dihindari.'),
    () => langs('原先看似稳固的安排，开始出现裂缝。', 'Arrangements once considered solid began to show cracks.', 'Sắp xếp từng tưởng vững chắc bắt đầu có vết nứt.', 'การจัดการที่เคยดูมั่นคงเริ่มมีรอยร้าว', 'Pengaturan yang tampak kokoh mulai retak.'),
    () => langs('裂缝里透出的不是混乱本身，而是继续调整的需要。', 'What showed through the cracks was not chaos itself, but the need to keep adjusting.', 'Điều lộ ra qua vết nứt không phải hỗn loạn, mà là nhu cầu tiếp tục điều chỉnh.', 'สิ่งที่ลอดออกจากรอยร้าวไม่ใช่ความวุ่นวายเอง แต่คือความจำเป็นต้องปรับต่อ', 'Yang tampak dari retakan bukan kekacauan itu sendiri, melainkan kebutuhan untuk terus menyesuaikan.'),
    () => langs('这个需要一旦出现，后面的行动就会更加急切。', 'Once that need appeared, later actions became more urgent.', 'Khi nhu cầu ấy xuất hiện, hành động phía sau trở nên cấp thiết hơn.', 'เมื่อความจำเป็นนั้นปรากฏ การกระทำต่อมาก็เร่งด่วนขึ้น', 'Begitu kebutuhan itu muncul, tindakan berikutnya menjadi lebih mendesak.'),
    () => langs('历史在这里收紧，又准备向新的方向打开。', 'History tightened here and prepared to open toward a new direction.', 'Lịch sử ở đây thắt lại rồi chuẩn bị mở sang hướng mới.', 'ประวัติศาสตร์ตรงนี้บีบแน่น แล้วเตรียมเปิดไปทิศใหม่', 'Sejarah mengencang di sini dan bersiap membuka arah baru.'),
    () => langs('下一段会带着这种压力继续向前。', 'The next part would move forward with this pressure.', 'Đoạn tiếp theo sẽ mang áp lực ấy tiếp tục đi tới.', 'ช่วงถัดไปจะพาแรงกดดันนี้เดินหน้าต่อ', 'Bagian berikutnya akan maju membawa tekanan ini.'),
  ],
  [
    ({ articleConfig }) => langs(`到了最后一段，${articleConfig.place.zh}留下的痕迹已经很多。`, `By the final part, ${articleConfig.place.en} had left many traces.`, `Đến đoạn cuối, ${articleConfig.place.vi} đã để lại nhiều dấu vết.`, `เมื่อถึงช่วงท้าย ${articleConfig.place.th} ทิ้งร่องรอยไว้มากแล้ว`, `Pada bagian akhir, ${articleConfig.place.id} telah meninggalkan banyak jejak.`),
    () => langs('这些痕迹有的写在书里，有的留在地名、器物和习惯中。', 'Some traces were written in books, while others stayed in place names, objects, and habits.', 'Có dấu vết viết trong sách, có dấu vết ở lại trong địa danh, đồ vật và thói quen.', 'ร่องรอยบางอย่างเขียนในหนังสือ บางอย่างอยู่ในชื่อสถานที่ สิ่งของ และความเคยชิน', 'Sebagian jejak tertulis di buku, sebagian tinggal dalam nama tempat, benda, dan kebiasaan.'),
    () => langs('后人不一定经历过那些日子，却能从痕迹里看见方向。', 'Later people did not necessarily live those days, but they could see direction through the traces.', 'Người đời sau không nhất thiết trải qua những ngày ấy, nhưng có thể thấy hướng đi qua dấu vết.', 'คนรุ่นหลังอาจไม่ได้ผ่านวันเหล่านั้น แต่เห็นทิศทางจากร่องรอยได้', 'Orang kemudian belum tentu mengalami hari-hari itu, tetapi dapat melihat arah dari jejaknya.'),
    () => langs('方向清楚以后，开头的疑问也慢慢安顿下来。', 'Once direction became clear, the opening question gradually settled.', 'Khi hướng đi rõ, câu hỏi ban đầu cũng dần yên vị.', 'เมื่อทิศทางชัด คำถามแรกก็เริ่มเข้าที่', 'Setelah arah jelas, pertanyaan awal perlahan menemukan tempatnya.'),
    ({ articleConfig }) => langs(`${articleConfig.focus.zh}不再只是要记住的词，而是一段可以回望的经过。`, `${articleConfig.focus.en} was no longer only a term to remember, but a process to look back on.`, `${articleConfig.focus.vi} không còn chỉ là từ cần nhớ, mà là một quá trình có thể nhìn lại.`, `${articleConfig.focus.th} ไม่ใช่แค่คำที่ต้องจำ แต่เป็นกระบวนการที่ย้อนมองได้`, `${articleConfig.focus.id} bukan lagi sekadar istilah untuk diingat, melainkan proses yang dapat ditinjau.`),
    () => langs('回望时，人们会发现答案来自许多相连的行动。', 'Looking back, people find that the answer came from many connected actions.', 'Khi nhìn lại, người ta thấy câu trả lời đến từ nhiều hành động nối nhau.', 'เมื่อย้อนมอง ผู้คนพบว่าคำตอบมาจากการกระทำที่เชื่อมกันหลายอย่าง', 'Saat menoleh, orang menemukan jawaban berasal dari banyak tindakan yang terhubung.'),
    () => langs('这些行动有成功，也有迟疑，还有不得不承受的后果。', 'Those actions included success, hesitation, and consequences that had to be borne.', 'Những hành động ấy có thành công, có do dự, cũng có hậu quả phải chịu.', 'การกระทำเหล่านี้มีทั้งความสำเร็จ ความลังเล และผลที่ต้องรับ', 'Tindakan itu mencakup keberhasilan, keraguan, dan akibat yang harus ditanggung.'),
    () => langs('正因为有后果，历史才不会像一句口号那样轻。', 'Because there were consequences, history was not as light as a slogan.', 'Chính vì có hậu quả, lịch sử không nhẹ như một khẩu hiệu.', 'เพราะมีผลตามมา ประวัติศาสตร์จึงไม่เบาเหมือนคำขวัญ', 'Karena ada akibat, sejarah tidak ringan seperti slogan.'),
    () => langs('它有人的脚步，也有制度留下的重量。', 'It contains human footsteps and the weight left by institutions.', 'Nó có bước chân con người, cũng có sức nặng制度 để lại.', 'มันมีรอยเท้าคนและน้ำหนักที่ระบบทิ้งไว้', 'Ia memuat langkah manusia dan bobot yang ditinggalkan lembaga.'),
    () => langs('这些重量把前面的片段压成一条更完整的路。', 'That weight pressed earlier fragments into a more complete road.', 'Sức nặng ấy ép các mảnh trước thành một con đường đầy đủ hơn.', 'น้ำหนักนี้กดชิ้นส่วนก่อนหน้าให้เป็นถนนที่สมบูรณ์ขึ้น', 'Bobot itu menekan potongan sebelumnya menjadi jalan yang lebih utuh.'),
    () => langs('沿着这条路回到开头，许多名字就不再陌生。', 'Returning to the beginning along this road, many names are no longer unfamiliar.', 'Đi theo con đường ấy về lại đầu, nhiều tên gọi không còn xa lạ.', 'เมื่อเดินตามถนนนี้กลับไปจุดเริ่ม ชื่อจำนวนมากก็ไม่แปลกหน้าอีก', 'Mengikuti jalan ini kembali ke awal, banyak nama tidak lagi asing.'),
    ({ articleConfig }) => langs(`那些名字和${articleConfig.scene.zh}重新连在一起。`, `Those names reconnect with ${articleConfig.scene.en}.`, `Những tên ấy nối lại với ${articleConfig.scene.vi}.`, `ชื่อเหล่านั้นเชื่อมกลับกับ ${articleConfig.scene.th}`, `Nama-nama itu tersambung kembali dengan ${articleConfig.scene.id}.`),
    () => langs('一开始像远处的画面，现在变成有前因后果的经历。', 'What first looked like a distant scene has become an experience with causes and results.', 'Điều ban đầu giống cảnh xa nay thành trải nghiệm có nguyên nhân và kết quả.', 'สิ่งที่ตอนแรกเหมือนฉากไกล ตอนนี้กลายเป็นประสบการณ์ที่มีเหตุและผล', 'Yang semula tampak seperti adegan jauh kini menjadi pengalaman dengan sebab dan akibat.'),
    () => langs('故事到这里收住，却给下一篇文化内容留下入口。', 'The story closes here, yet it leaves an entrance for the next cultural topic.', 'Câu chuyện dừng ở đây, nhưng để lại lối vào cho chủ đề văn hóa tiếp theo.', 'เรื่องหยุดตรงนี้ แต่ทิ้งทางเข้าให้เนื้อหาวัฒนธรรมถัดไป', 'Kisah berhenti di sini, tetapi meninggalkan pintu masuk untuk topik budaya berikutnya.'),
  ],
];

function closingRows(categoryConfig, articleConfig) {
  return [
    storyRow(langs(`走到这里，${articleConfig.focus.zh}已经有了清楚的来路。`, `At this point, ${articleConfig.focus.en} has a clear origin.`, `Đến đây, ${articleConfig.focus.vi} đã có nguồn gốc rõ ràng.`, `ถึงตรงนี้ ${articleConfig.focus.th} มีที่มาอย่างชัดเจนแล้ว`, `Sampai di sini, ${articleConfig.focus.id} sudah memiliki asal yang jelas.`)),
    storyRow(langs(`它从${articleConfig.scene.zh}出发，经过人物行动和制度变化。`, `It began with ${articleConfig.scene.en}, then passed through human action and institutional change.`, `Nó bắt đầu từ ${articleConfig.scene.vi}, rồi đi qua hành động con người và biến đổi制度.`, `มันเริ่มจาก ${articleConfig.scene.th} แล้วผ่านการกระทำของคนและการเปลี่ยนแปลงระบบ`, `Ia berawal dari ${articleConfig.scene.id}, lalu melewati tindakan manusia dan perubahan lembaga.`)),
    storyRow(langs(`中间的每一步都不是装饰，而是让结果能够发生。`, `Every middle step was not decoration; it made the outcome possible.`, `Mỗi bước ở giữa không phải trang trí, mà làm kết quả có thể xảy ra.`, `ทุกก้าวตรงกลางไม่ใช่เครื่องประดับ แต่ทำให้ผลลัพธ์เกิดขึ้นได้`, `Setiap langkah di tengah bukan hiasan, melainkan membuat hasil dapat terjadi.`)),
    storyRow(langs(`如果只记最后的答案，故事会变得很薄。`, `If only the final answer is remembered, the story becomes thin.`, `Nếu chỉ nhớ đáp án cuối, câu chuyện sẽ trở nên mỏng.`, `ถ้าจำแค่คำตอบท้าย เรื่องจะบางลงมาก`, `Jika hanya mengingat jawaban akhir, kisah menjadi tipis.`)),
    storyRow(langs(`把时间顺序连起来，人物的选择才有重量。`, `When the timeline is connected, the choices of people gain weight.`, `Khi nối trật tự thời gian, lựa chọn của nhân vật mới có sức nặng.`, `เมื่อเชื่อมลำดับเวลา การเลือกของผู้คนจึงมีน้ำหนัก`, `Ketika urutan waktu tersambung, pilihan tokoh memiliki bobot.`)),
    storyRow(langs(`把地点放回去，制度和交通也会变得可见。`, `When places are restored, systems and transport also become visible.`, `Khi đặt địa điểm trở lại,制度 và giao thông cũng hiện rõ.`, `เมื่อใส่สถานที่กลับไป ระบบและการคมนาคมก็เห็นได้ชัด`, `Ketika tempat dikembalikan, lembaga dan transportasi juga tampak.`)),
    storyRow(langs(`把普通人的处境放进去，历史就不再只是一串名称。`, `When ordinary people’s situations are included, history is no longer only a chain of names.`, `Khi đưa hoàn cảnh người bình thường vào, lịch sử không còn chỉ là chuỗi tên gọi.`, `เมื่อใส่สภาพของคนธรรมดา ประวัติศาสตร์ก็ไม่ใช่แค่รายชื่อ`, `Ketika keadaan orang biasa dimasukkan, sejarah bukan lagi sekadar deret nama.`)),
    storyRow(langs(`${articleConfig.entities.slice(0, 3).join('、')}这些名词，也因此有了位置。`, `Terms such as ${articleEntityEnglish(articleConfig).slice(0, 3).join(', ')} therefore gain their places.`, `Những thuật ngữ như ${articleConfig.entities.slice(0, 3).join(', ')} vì thế có vị trí.`, `คำอย่าง ${articleConfig.entities.slice(0, 3).join(', ')} จึงมีตำแหน่งของมัน`, `Istilah seperti ${articleConfig.entities.slice(0, 3).join(', ')} karena itu memiliki tempatnya.`)),
    storyRow(langs(`今天再读这段历史，重点不是评判，而是看清变化如何发生。`, `Reading this history today is not about judgment, but about seeing how change happened.`, `Đọc lại đoạn lịch sử này hôm nay, trọng điểm không phải phán xét, mà là thấy biến đổi xảy ra thế nào.`, `เมื่ออ่านประวัติศาสตร์ช่วงนี้วันนี้ จุดสำคัญไม่ใช่ตัดสิน แต่คือเห็นว่าความเปลี่ยนแปลงเกิดอย่างไร`, `Membaca sejarah ini hari ini bukan terutama untuk menilai, tetapi untuk melihat bagaimana perubahan terjadi.`)),
    storyRow(langs(`这段历史还会继续通向${categoryConfig.nextPath.zh}。`, `This history can continue toward ${categoryConfig.nextPath.en}.`, `Đoạn lịch sử này còn có thể nối tới ${categoryConfig.nextPath.vi}.`, `ประวัติศาสตร์ช่วงนี้ยังเดินต่อไปสู่ ${categoryConfig.nextPath.th}`, `Sejarah ini masih dapat berlanjut menuju ${categoryConfig.nextPath.id}.`)),
    storyRow(langs(`开头的场面再次出现时，它已经不再只是一个开头。`, `When the opening scene appears again, it is no longer only an opening.`, `Khi cảnh mở đầu xuất hiện lại, nó không còn chỉ là phần mở đầu.`, `เมื่อฉากแรกปรากฏอีกครั้ง มันไม่ใช่แค่จุดเริ่มแล้ว`, `Saat adegan pembuka muncul kembali, ia bukan lagi sekadar pembuka.`)),
    storyRow(langs(`它带着前面所有行动、选择和后果回到眼前。`, `It returns with all the earlier actions, choices, and consequences.`, `Nó trở lại cùng mọi hành động, lựa chọn và kết quả phía trước.`, `มันกลับมาพร้อมการกระทำ การเลือก และผลที่เกิดก่อนหน้า`, `Ia kembali bersama semua tindakan, pilihan, dan akibat sebelumnya.`)),
    storyRow(langs(`这时，答案不再像标签，而像一条走过的路。`, `At this moment, the answer no longer feels like a label, but like a road already traveled.`, `Lúc này, câu trả lời không còn giống nhãn dán, mà như con đường đã đi qua.`, `ตอนนี้คำตอบไม่เหมือนป้ายชื่ออีกต่อไป แต่เหมือนถนนที่เดินผ่านมาแล้ว`, `Pada saat ini, jawaban bukan lagi seperti label, melainkan seperti jalan yang telah ditempuh.`)),
    storyRow(langs(`这条路保留事实，也保留故事里的呼吸。`, `This road keeps the facts and also keeps the breath of the story.`, `Con đường ấy giữ lại sự thật, cũng giữ hơi thở trong câu chuyện.`, `ถนนเส้นนี้เก็บข้อเท็จจริงและลมหายใจของเรื่องไว้`, `Jalan ini menjaga fakta sekaligus napas dalam kisah.`)),
    storyRow(langs(`这就是${articleConfig.title_i18n.zh}的完整回答。`, `This is the complete answer to ${articleConfig.title_i18n.en}.`, `Đây là câu trả lời đầy đủ cho ${articleConfig.title_i18n.vi}.`, `นี่คือคำตอบครบถ้วนของ ${articleConfig.title_i18n.th}`, `Inilah jawaban lengkap untuk ${articleConfig.title_i18n.id}.`)),
  ];
}

function langs(zh, en, vi, th, id) {
  return { zh, en, vi, th, id };
}

function storyRow(values) {
  return row({ pinyin: '', ...values });
}

function toPinyin(value) {
  return pinyin(value, { toneType: 'symbol' }).replace(/\s+[，。？！：；、“”《》（）]\s*/g, ' ').trim();
}

const introTemplates = {
  storyStart: {
    zh: ({ articleConfig }) => `${articleConfig.title_i18n.zh}这个问题，可以从${articleConfig.scene.zh}讲起。`,
    pinyin: ({ articleConfig }) => `${articleConfig.title_pinyin} zhè ge wèn tí kě yǐ cóng ${articleConfig.scene.pinyin} jiǎng qǐ`,
    en: ({ articleConfig }) => `The question “${articleConfig.title_i18n.en}” can begin with ${articleConfig.scene.en}.`,
    vi: ({ articleConfig }) => `Câu hỏi “${articleConfig.title_i18n.vi}” có thể bắt đầu từ ${articleConfig.scene.vi}.`,
    th: ({ articleConfig }) => `คำถาม “${articleConfig.title_i18n.th}” เริ่มเล่าได้จาก ${articleConfig.scene.th}`,
    id: ({ articleConfig }) => `Pertanyaan “${articleConfig.title_i18n.id}” dapat dimulai dari ${articleConfig.scene.id}.`,
  },
  placeStage: {
    zh: ({ articleConfig }) => `${articleConfig.place.zh}不是静止背景，而是故事推进的舞台。`,
    pinyin: ({ articleConfig }) => `${articleConfig.place.pinyin} bú shì jìng zhǐ bèi jǐng ér shì gù shi tuī jìn de wǔ tái`,
    en: ({ articleConfig }) => `${articleConfig.place.en} is not a still background but the stage that moves the story forward.`,
    vi: ({ articleConfig }) => `${articleConfig.place.vi} không phải phông nền tĩnh, mà là sân khấu đẩy câu chuyện đi tới.`,
    th: ({ articleConfig }) => `${articleConfig.place.th} ไม่ใช่ฉากนิ่ง แต่เป็นเวทีที่ผลักเรื่องราวไปข้างหน้า`,
    id: ({ articleConfig }) => `${articleConfig.place.id} bukan latar diam, melainkan panggung yang menggerakkan cerita.`,
  },
  memoryLine: shortTemplate('主线先露出来，细节再跟上，故事就会稳稳向前。', 'zhǔ xiàn xiān lù chū lái xì jié zài gēn shàng gù shi jiù huì wěn wěn xiàng qián', 'The main line appears first, the details follow, and the story moves steadily forward.', 'Mạch chính hiện ra trước, chi tiết theo sau, câu chuyện sẽ tiến lên vững vàng.', 'แกนหลักปรากฏก่อน รายละเอียดตามมา เรื่องจึงเดินหน้าอย่างมั่นคง', 'Alur utama muncul dahulu, detail menyusul, dan cerita bergerak mantap ke depan.'),
  notNameOnly: {
    zh: ({ articleConfig }) => `${articleConfig.focus.zh}不只是一个名词，它背后有时间、地点和人的选择。`,
    pinyin: ({ articleConfig }) => `${articleConfig.focus.pinyin} bù zhǐ shì yī gè míng cí tā bèi hòu yǒu shí jiān dì diǎn hé rén de xuǎn zé`,
    en: ({ articleConfig }) => `${articleConfig.focus.en} is not just a term; behind it are time, place, and human choices.`,
    vi: ({ articleConfig }) => `${articleConfig.focus.vi} không chỉ là một thuật ngữ; phía sau là thời gian, địa điểm và lựa chọn của con người.`,
    th: ({ articleConfig }) => `${articleConfig.focus.th} ไม่ใช่แค่คำหนึ่งคำ แต่มีเวลา สถานที่ และการเลือกของผู้คนอยู่ข้างหลัง`,
    id: ({ articleConfig }) => `${articleConfig.focus.id} bukan sekadar istilah; di baliknya ada waktu, tempat, dan pilihan manusia.`,
  },
  threeQuestions: shortTemplate('故事围绕三个问题展开：为什么开始，怎样发展，留下什么。', 'gù shi wéi rào sān gè wèn tí zhǎn kāi wèi shén me kāi shǐ zěn yàng fā zhǎn liú xià shén me', 'The story unfolds around three questions: why it began, how it developed, and what remained.', 'Câu chuyện mở ra quanh ba câu hỏi: vì sao bắt đầu, phát triển thế nào và để lại gì.', 'เรื่องราวคลี่ออกตามสามคำถามว่าเริ่มเพราะอะไร พัฒนาอย่างไร และเหลืออะไรไว้', 'Cerita terbuka di sekitar tiga pertanyaan: mengapa bermula, bagaimana berkembang, dan apa yang tersisa.'),
  firstLens: {
    zh: ({ categoryConfig }) => `${categoryConfig.lens.zh}会让故事有画面，而不是只剩背诵。`,
    pinyin: ({ categoryConfig }) => `${categoryConfig.lens.pinyin} huì ràng gù shi yǒu huà miàn ér bú shì zhǐ shèng bèi sòng`,
    en: ({ categoryConfig }) => `${categoryConfig.lens.en} gives the story a scene instead of leaving only memorization.`,
    vi: ({ categoryConfig }) => `${categoryConfig.lens.vi} giúp câu chuyện có hình ảnh, không chỉ còn học thuộc.`,
    th: ({ categoryConfig }) => `${categoryConfig.lens.th} ทำให้เรื่องมีภาพ ไม่เหลือแค่การท่องจำ`,
    id: ({ categoryConfig }) => `${categoryConfig.lens.id} membuat cerita punya gambar, bukan hanya hafalan.`,
  },
  slowRead: shortTemplate('真正关键的部分，常常藏在一个看似平常的转折里。', 'zhēn zhèng guān jiàn de bù fen cháng cháng cáng zài yī gè kàn sì píng cháng de zhuǎn zhé lǐ', 'The truly important part often hides inside a seemingly ordinary turn.', 'Phần thật sự quan trọng thường nằm trong một bước ngoặt tưởng như bình thường.', 'ส่วนสำคัญจริง ๆ มักซ่อนอยู่ในจุดเปลี่ยนที่ดูธรรมดา', 'Bagian yang benar-benar penting sering tersembunyi dalam belokan yang tampak biasa.'),
  humanScale: {
    zh: ({ articleConfig }) => `把${articleConfig.focus.zh}放到日常生活里，它就会变得更容易理解。`,
    pinyin: ({ articleConfig }) => `bǎ ${articleConfig.focus.pinyin} fàng dào rì cháng shēng huó lǐ tā jiù huì biàn de gèng róng yì lǐ jiě`,
    en: ({ articleConfig }) => `Put ${articleConfig.focus.en} into daily life, and it becomes easier to understand.`,
    vi: ({ articleConfig }) => `Đặt ${articleConfig.focus.vi} vào đời sống hằng ngày, nó sẽ dễ hiểu hơn.`,
    th: ({ articleConfig }) => `เมื่อนำ ${articleConfig.focus.th} ไปวางในชีวิตประจำวัน ก็จะเข้าใจง่ายขึ้น`,
    id: ({ articleConfig }) => `Letakkan ${articleConfig.focus.id} dalam kehidupan sehari-hari, maka ia lebih mudah dipahami.`,
  },
  detailPromise: shortTemplate('每个细节都把前因后果连得更紧，答案也因此慢慢清楚。', 'měi gè xì jié dōu bǎ qián yīn hòu guǒ lián de gèng jǐn dá àn yě yīn cǐ màn man qīng chǔ', 'Each detail ties cause and effect more tightly, and the answer slowly becomes clear.', 'Mỗi chi tiết nối nguyên nhân và kết quả chặt hơn, câu trả lời cũng dần rõ.', 'ทุกรายละเอียดเชื่อมเหตุและผลให้แน่นขึ้น คำตอบจึงค่อย ๆ ชัด', 'Setiap detail mengikat sebab dan akibat lebih erat, dan jawabannya perlahan menjadi jelas.'),
  causeResult: shortTemplate('所以，先看原因，再看过程，最后看影响。', 'suǒ yǐ xiān kàn yuán yīn zài kàn guò chéng zuì hòu kàn yǐng xiǎng', 'So first look at causes, then the process, and finally the effects.', 'Vì vậy, hãy nhìn nguyên nhân trước, rồi quá trình, cuối cùng là ảnh hưởng.', 'ดังนั้นให้ดูเหตุผลก่อน ต่อด้วยกระบวนการ แล้วจึงดูผลกระทบ', 'Jadi lihat sebab dahulu, lalu proses, dan terakhir dampaknya.'),
  beginnerMap: shortTemplate('散开的知识被放回一张清楚的地图，人物和地点也有了位置。', 'sàn kāi de zhī shi bèi fàng huí yī zhāng qīng chǔ de dì tú rén wù hé dì diǎn yě yǒu le wèi zhì', 'Scattered knowledge returns to a clear map, and people and places gain their positions.', 'Kiến thức rời rạc trở lại một bản đồ rõ ràng, nhân vật và địa điểm cũng có vị trí.', 'ความรู้ที่กระจัดกระจายกลับสู่แผนที่ชัดเจน บุคคลและสถานที่ก็มีตำแหน่ง', 'Pengetahuan yang tersebar kembali ke peta jelas, dan orang serta tempat memperoleh posisi.'),
  safeTone: shortTemplate('整段讲述只保留文化、生活和学习信息，语气保持中立。', 'zhěng duàn jiǎng shù zhǐ bǎo liú wén huà shēng huó hé xué xí xìn xī yǔ qì bǎo chí zhōng lì', 'The whole narration keeps only cultural, daily-life, and learning information in a neutral tone.', 'Toàn bộ phần kể chỉ giữ thông tin văn hóa, đời sống và học tập với giọng trung lập.', 'การเล่าทั้งหมดคงไว้เฉพาะข้อมูลวัฒนธรรม ชีวิต และการเรียน ด้วยน้ำเสียงเป็นกลาง', 'Seluruh narasi hanya memuat informasi budaya, kehidupan, dan belajar dengan nada netral.'),
  threadForward: shortTemplate('有了这个开头，后面的每个细节都能接上。', 'yǒu le zhè ge kāi tóu hòu miàn de měi gè xì jié dōu néng jiē shàng', 'With this opening, every later detail can connect.', 'Có phần mở đầu này, từng chi tiết phía sau đều có thể nối lại.', 'เมื่อมีจุดเริ่มนี้ รายละเอียดต่อ ๆ ไปก็เชื่อมกันได้', 'Dengan pembuka ini, setiap detail berikutnya dapat tersambung.'),
  beforeFacts: shortTemplate('下面的线索会一层一层展开，而不是突然跳到结论。', 'xià miàn de xiàn suǒ huì yī céng yī céng zhǎn kāi ér bú shì tū rán tiào dào jié lùn', 'The clues below unfold layer by layer instead of jumping to the conclusion.', 'Các manh mối dưới đây sẽ mở ra từng lớp, không nhảy ngay đến kết luận.', 'เบาะแสต่อไปจะคลี่ออกทีละชั้น ไม่กระโดดไปสู่ข้อสรุปทันที', 'Petunjuk berikut akan terbuka lapis demi lapis, bukan langsung melompat ke kesimpulan.'),
  modernLink: {
    zh: ({ articleConfig }) => `今天再看${articleConfig.focus.zh}，它仍然能解释很多学习和旅行中的疑问。`,
    pinyin: ({ articleConfig }) => `jīn tiān zài kàn ${articleConfig.focus.pinyin} tā réng rán néng jiě shì hěn duō xué xí hé lǚ xíng zhōng de yí wèn`,
    en: ({ articleConfig }) => `Looking again at ${articleConfig.focus.en} today still explains many learning and travel questions.`,
    vi: ({ articleConfig }) => `Nhìn lại ${articleConfig.focus.vi} hôm nay vẫn giúp giải thích nhiều câu hỏi khi học và du lịch.`,
    th: ({ articleConfig }) => `เมื่อมอง ${articleConfig.focus.th} วันนี้ ก็ยังอธิบายคำถามในการเรียนและท่องเที่ยวได้มาก`,
    id: ({ articleConfig }) => `Melihat kembali ${articleConfig.focus.id} hari ini masih menjelaskan banyak pertanyaan belajar dan perjalanan.`,
  },
  compareCalmly: shortTemplate('如果遇到不同说法，先比较时间、地点和定义，不急着下判断。', 'rú guǒ yù dào bù tóng shuō fǎ xiān bǐ jiào shí jiān dì diǎn hé dìng yì bù jí zhe xià pàn duàn', 'If different explanations appear, compare time, place, and definitions before judging.', 'Nếu gặp cách nói khác nhau, hãy so thời gian, địa điểm và định nghĩa trước khi kết luận.', 'ถ้าเจอคำอธิบายต่างกัน ให้เทียบเวลา สถานที่ และนิยามก่อนตัดสิน', 'Jika menemukan penjelasan berbeda, bandingkan waktu, tempat, dan definisi sebelum menilai.'),
  learningTipOne: shortTemplate('学习时可以先记主线，再补人物、器物、地点和常见说法。', 'xué xí shí kě yǐ xiān jì zhǔ xiàn zài bǔ rén wù qì wù dì diǎn hé cháng jiàn shuō fǎ', 'When studying, remember the main line first, then add people, objects, places, and common wording.', 'Khi học, hãy nhớ mạch chính trước, rồi bổ sung nhân vật, đồ vật, địa điểm và cách nói thường gặp.', 'เวลาเรียนให้จำแกนหลักก่อน แล้วค่อยเติมบุคคล สิ่งของ สถานที่ และคำพูดที่พบบ่อย', 'Saat belajar, ingat alur utama dahulu, lalu tambahkan tokoh, benda, tempat, dan ungkapan umum.'),
  learningTipTwo: shortTemplate('再把中文、拼音和翻译连在一起，记忆会更稳定。', 'zài bǎ zhōng wén pīn yīn hé fān yì lián zài yī qǐ jì yì huì gèng wěn dìng', 'Then connect Chinese, pinyin, and translation, and memory becomes steadier.', 'Sau đó nối tiếng Trung, pinyin và bản dịch với nhau, trí nhớ sẽ chắc hơn.', 'จากนั้นเชื่อมภาษาจีน พินอิน และคำแปลเข้าด้วยกัน ความจำจะมั่นคงขึ้น', 'Lalu hubungkan Mandarin, pinyin, dan terjemahan, maka ingatan lebih stabil.'),
  entityRecall: {
    zh: ({ articleConfig }) => `至少要记住${articleConfig.entities.slice(0, 3).join('、')}这几个核心名词。`,
    pinyin: ({ articleConfig }) => `zhì shǎo yào jì zhù ${articleEntityPinyin(articleConfig)} zhè jǐ gè hé xīn míng cí`,
    en: ({ articleConfig }) => `At least remember these core terms: ${articleEntityEnglish(articleConfig).slice(0, 3).join(', ')}.`,
    vi: ({ articleConfig }) => `Ít nhất hãy nhớ vài thuật ngữ cốt lõi này: ${articleConfig.entities.slice(0, 3).join(', ')}.`,
    th: ({ articleConfig }) => `อย่างน้อยควรจำคำหลักเหล่านี้: ${articleConfig.entities.slice(0, 3).join(', ')}`,
    id: ({ articleConfig }) => `Setidaknya ingat istilah inti ini: ${articleConfig.entities.slice(0, 3).join(', ')}.`,
  },
  structureRecall: shortTemplate('再记住原因、过程、结果三层，整段内容就能复述出来。', 'zài jì zhù yuán yīn guò chéng jié guǒ sān céng zhěng duàn nèi róng jiù néng fù shù chū lái', 'Then remember the three layers of cause, process, and result, and the whole content can be retold.', 'Sau đó nhớ ba lớp nguyên nhân, quá trình và kết quả, toàn bộ nội dung có thể kể lại.', 'จากนั้นจำสามชั้นคือเหตุ กระบวนการ และผล ก็เล่าเนื้อหาทั้งหมดได้', 'Lalu ingat tiga lapis sebab, proses, dan hasil, maka seluruh isi dapat diceritakan ulang.'),
  questionReturn: {
    zh: ({ articleConfig }) => `回到“${articleConfig.title_i18n.zh}”，答案已经从一句话展开成了一条清楚路径。`,
    pinyin: ({ articleConfig }) => `huí dào ${articleConfig.title_pinyin} dá àn yǐ jīng cóng yī jù huà zhǎn kāi chéng le yī tiáo qīng chǔ lù jìng`,
    en: ({ articleConfig }) => `Back to “${articleConfig.title_i18n.en},” the answer has become a clear path, not just one sentence.`,
    vi: ({ articleConfig }) => `Trở lại “${articleConfig.title_i18n.vi}”, câu trả lời đã thành một lộ trình rõ ràng, không chỉ là một câu.`,
    th: ({ articleConfig }) => `เมื่อกลับมาที่ “${articleConfig.title_i18n.th}” คำตอบได้กลายเป็นเส้นทางชัดเจน ไม่ใช่แค่ประโยคเดียว`,
    id: ({ articleConfig }) => `Kembali ke “${articleConfig.title_i18n.id}”, jawabannya sudah menjadi jalur jelas, bukan hanya satu kalimat.`,
  },
  answerLayer: shortTemplate('第一层回答是什么，第二层解释为什么，第三层说明它怎样影响后来。', 'dì yī céng huí dá shì shén me dì èr céng jiě shì wèi shén me dì sān céng shuō míng tā zěn yàng yǐng xiǎng hòu lái', 'The first layer says what it is, the second explains why, and the third shows later influence.', 'Lớp đầu trả lời là gì, lớp thứ hai giải thích vì sao, lớp thứ ba nói nó ảnh hưởng về sau thế nào.', 'ชั้นแรกตอบว่าคืออะไร ชั้นที่สองอธิบายว่าทำไม ชั้นที่สามบอกว่ามีผลต่อมาภายหลังอย่างไร', 'Lapis pertama menjawab apa, lapis kedua menjelaskan mengapa, lapis ketiga menunjukkan pengaruh berikutnya.'),
  todayUse: shortTemplate('这条路径还可以继续通向其他中国文化主题。', 'zhè tiáo lù jìng hái kě yǐ jì xù tōng xiàng qí tā zhōng guó wén huà zhǔ tí', 'This path can continue toward other Chinese culture topics.', 'Con đường này còn có thể tiếp tục dẫn tới các chủ đề văn hóa Trung Quốc khác.', 'เส้นทางนี้ยังต่อไปสู่หัวข้อวัฒนธรรมจีนอื่นได้', 'Jalur ini masih dapat berlanjut menuju tema budaya Tiongkok lain.'),
  noOverclaim: shortTemplate('需要记住的是，文化解释要清楚，也要避免把复杂问题说得过满。', 'xū yào jì zhù de shì wén huà jiě shì yào qīng chǔ yě yào bì miǎn bǎ fù zá wèn tí shuō de guò mǎn', 'Remember that cultural explanations should be clear and should not overstate complex issues.', 'Cần nhớ rằng giải thích văn hóa phải rõ ràng và không nên nói quá về vấn đề phức tạp.', 'ควรจำว่าการอธิบายวัฒนธรรมต้องชัด และไม่ควรพูดเกินจริงกับเรื่องซับซ้อน', 'Ingat bahwa penjelasan budaya harus jelas dan tidak melebih-lebihkan hal rumit.'),
  relatedPath: {
    zh: ({ categoryConfig }) => `读完以后，可以顺着${categoryConfig.nextPath.zh}继续扩展。`,
    pinyin: ({ categoryConfig }) => `dú wán yǐ hòu kě yǐ shùn zhe ${categoryConfig.nextPath.pinyin} jì xù kuò zhǎn`,
    en: ({ categoryConfig }) => `After reading, continue along ${categoryConfig.nextPath.en}.`,
    vi: ({ categoryConfig }) => `Sau khi đọc, có thể tiếp tục mở rộng theo ${categoryConfig.nextPath.vi}.`,
    th: ({ categoryConfig }) => `อ่านจบแล้วสามารถต่อยอดตาม ${categoryConfig.nextPath.th}`,
    id: ({ categoryConfig }) => `Setelah membaca, lanjutkan melalui ${categoryConfig.nextPath.id}.`,
  },
  finalImage: {
    zh: ({ articleConfig }) => `最后再想象${articleConfig.scene.zh}，整段故事就会重新合在一起。`,
    pinyin: ({ articleConfig }) => `zuì hòu zài xiǎng xiàng ${articleConfig.scene.pinyin} zhěng duàn gù shi jiù huì chóng xīn hé zài yī qǐ`,
    en: ({ articleConfig }) => `Finally imagine ${articleConfig.scene.en} again, and the whole story comes back together.`,
    vi: ({ articleConfig }) => `Cuối cùng hãy tưởng tượng lại ${articleConfig.scene.vi}, toàn bộ câu chuyện sẽ nối lại.`,
    th: ({ articleConfig }) => `สุดท้ายลองนึกถึง ${articleConfig.scene.th} อีกครั้ง เรื่องทั้งหมดจะรวมกันอีกครั้ง`,
    id: ({ articleConfig }) => `Akhirnya bayangkan lagi ${articleConfig.scene.id}, maka seluruh cerita menyatu kembali.`,
  },
  finalMemory: shortTemplate('这时记住的不只是答案，还有它为什么值得被记住。', 'zhè shí jì zhù de bú zhǐ shì dá àn hái yǒu tā wèi shén me zhí de bèi jì zhù', 'At this point, what remains is not only the answer but why it is worth remembering.', 'Lúc này, điều được nhớ không chỉ là câu trả lời mà còn là vì sao nó đáng nhớ.', 'ตอนนี้สิ่งที่จำได้ไม่ใช่แค่คำตอบ แต่รวมถึงเหตุผลที่ควรจำ', 'Pada titik ini, yang diingat bukan hanya jawaban, tetapi mengapa layak diingat.'),
  finalBridge: shortTemplate('从一个问题走到一段故事，答案就变得有来处。', 'cóng yī gè wèn tí zǒu dào yī duàn gù shi dá àn jiù biàn de yǒu lái chù', 'Moving from a question to a story gives the answer a clear source.', 'Đi từ một câu hỏi đến một câu chuyện khiến câu trả lời có nguồn gốc rõ.', 'จากคำถามหนึ่งไปสู่เรื่องราวหนึ่ง คำตอบจึงมีที่มา', 'Bergerak dari pertanyaan ke cerita membuat jawaban memiliki asal yang jelas.'),
  finalClose: {
    zh: ({ articleConfig }) => `这就是${articleConfig.focus.zh}最适合初学者掌握的核心。`,
    pinyin: ({ articleConfig }) => `zhè jiù shì ${articleConfig.focus.pinyin} zuì shì hé chū xué zhě zhǎng wò de hé xīn`,
    en: ({ articleConfig }) => `This is the core of ${articleConfig.focus.en} that beginners can grasp first.`,
    vi: ({ articleConfig }) => `Đó là phần cốt lõi của ${articleConfig.focus.vi} mà người mới nên nắm trước.`,
    th: ({ articleConfig }) => `นี่คือแกนของ ${articleConfig.focus.th} ที่ผู้เริ่มต้นควรเข้าใจก่อน`,
    id: ({ articleConfig }) => `Inilah inti ${articleConfig.focus.id} yang sebaiknya dipahami pemula terlebih dahulu.`,
  },
};

const factTemplates = {
  factLead: ({ factRow, label }) => row({
    zh: `${label.zh}：${factRow.zh}`,
    pinyin: `${label.pinyin} ${factRow.pinyin}`,
    en: `${label.en}: ${factRow.en}`,
    vi: `${label.vi}: ${factRow.vi}`,
    th: `${label.th}: ${factRow.th}`,
    id: `${label.id}: ${factRow.id}`,
  }),
  factMeaning: ({ articleConfig }) => row({
    zh: `这个细节让${articleConfig.focus.zh}变得更具体。`,
    pinyin: `zhè ge xì jié ràng ${articleConfig.focus.pinyin} biàn de gèng jù tǐ`,
    en: `This detail makes ${articleConfig.focus.en} more concrete.`,
    vi: `Chi tiết này khiến ${articleConfig.focus.vi} cụ thể hơn.`,
    th: `รายละเอียดนี้ทำให้ ${articleConfig.focus.th} เป็นรูปธรรมขึ้น`,
    id: `Detail ini membuat ${articleConfig.focus.id} lebih konkret.`,
  }),
  factBeforeAfter: shortTemplate('如果只看结果，就会漏掉前面的铺垫。', 'rú guǒ zhǐ kàn jié guǒ jiù huì lòu diào qián miàn de pū diàn', 'If only the result is seen, the earlier setup is missed.', 'Nếu chỉ nhìn kết quả, phần chuẩn bị phía trước sẽ bị bỏ lỡ.', 'ถ้าดูแต่ผลลัพธ์ ก็จะพลาดการปูเรื่องก่อนหน้า', 'Jika hanya melihat hasil, persiapan sebelumnya akan terlewat.'),
  factHuman: ({ categoryConfig }) => row({
    zh: `从人的角度看，${categoryConfig.humanAngle.zh}在这里开始显形。`,
    pinyin: `cóng rén de jiǎo dù kàn ${categoryConfig.humanAngle.pinyin} zài zhè lǐ kāi shǐ xiǎn xíng`,
    en: `From the human angle, ${categoryConfig.humanAngle.en} begins to appear here.`,
    vi: `Từ góc nhìn con người, ${categoryConfig.humanAngle.vi} bắt đầu hiện rõ ở đây.`,
    th: `จากมุมมนุษย์ ${categoryConfig.humanAngle.th} เริ่มปรากฏตรงนี้`,
    id: `Dari sudut manusia, ${categoryConfig.humanAngle.id} mulai tampak di sini.`,
  }),
  factPlace: ({ articleConfig }) => row({
    zh: `从地点看，${articleConfig.place.zh}给这一步提供了条件。`,
    pinyin: `cóng dì diǎn kàn ${articleConfig.place.pinyin} gěi zhè yī bù tí gōng le tiáo jiàn`,
    en: `From the place angle, ${articleConfig.place.en} provided conditions for this step.`,
    vi: `Từ góc nhìn địa điểm, ${articleConfig.place.vi} tạo điều kiện cho bước này.`,
    th: `จากมุมสถานที่ ${articleConfig.place.th} สร้างเงื่อนไขให้ขั้นตอนนี้`,
    id: `Dari sisi tempat, ${articleConfig.place.id} memberi syarat bagi langkah ini.`,
  }),
  factDetail: shortTemplate('这样的细节让故事有了顺序，也让记忆有了抓手。', 'zhè yàng de xì jié ràng gù shi yǒu le shùn xù yě ràng jì yì yǒu le zhuā shǒu', 'Such detail gives the story order and gives memory a handle.', 'Chi tiết như vậy giúp câu chuyện có thứ tự và giúp trí nhớ có điểm tựa.', 'รายละเอียดแบบนี้ทำให้เรื่องมีลำดับ และทำให้ความจำมีที่ยึด', 'Detail seperti ini memberi cerita urutan dan memberi ingatan pegangan.'),
  factNotAlone: shortTemplate('它不是孤立插曲，而是前后关系中的一环。', 'tā bú shì gū lì chā qǔ ér shì qián hòu guān xì zhōng de yī huán', 'It is not an isolated episode but one link in the before-and-after chain.', 'Nó không phải đoạn chen lẻ, mà là một mắt xích trong quan hệ trước sau.', 'มันไม่ใช่ตอนแยกเดี่ยว แต่เป็นห่วงหนึ่งในความสัมพันธ์ก่อนหลัง', 'Ini bukan sisipan terpisah, melainkan satu mata rantai dalam hubungan sebelum-sesudah.'),
  factBridge: shortTemplate('把它和上一层连起来，故事的方向就更清楚。', 'bǎ tā hé shàng yī céng lián qǐ lái gù shi de fāng xiàng jiù gèng qīng chǔ', 'Connect it with the previous layer, and the story direction becomes clearer.', 'Nối nó với lớp trước, hướng câu chuyện sẽ rõ hơn.', 'เมื่อเชื่อมกับชั้นก่อนหน้า ทิศทางเรื่องก็ชัดขึ้น', 'Hubungkan dengan lapis sebelumnya, maka arah cerita menjadi lebih jelas.'),
  factBeginner: shortTemplate('这一层先稳住，后面的细节就有了安放的位置。', 'zhè yī céng xiān wěn zhù hòu miàn de xì jié jiù yǒu le ān fàng de wèi zhì', 'Once this layer is steady, later details have a place to settle.', 'Khi lớp này đã vững, các chi tiết phía sau sẽ có chỗ để đặt vào.', 'เมื่อชั้นนี้มั่นคง รายละเอียดต่อมาก็มีที่วาง', 'Setelah lapis ini kokoh, detail berikutnya memiliki tempat untuk berlabuh.'),
  factScene: ({ articleConfig }) => row({
    zh: `把画面放回${articleConfig.scene.zh}，这一点会更容易想象。`,
    pinyin: `bǎ huà miàn fàng huí ${articleConfig.scene.pinyin} zhè yī diǎn huì gèng róng yì xiǎng xiàng`,
    en: `Put the scene back into ${articleConfig.scene.en}, and this point becomes easier to imagine.`,
    vi: `Đặt hình ảnh trở lại ${articleConfig.scene.vi}, điểm này sẽ dễ hình dung hơn.`,
    th: `เมื่อนำภาพกลับไปที่ ${articleConfig.scene.th} จุดนี้จะจินตนาการง่ายขึ้น`,
    id: `Letakkan adegan kembali ke ${articleConfig.scene.id}, maka poin ini lebih mudah dibayangkan.`,
  }),
  factImpact: shortTemplate('它的影响不一定轰动，却会慢慢改变后面的选择。', 'tā de yǐng xiǎng bù yí dìng hōng dòng què huì màn man gǎi biàn hòu miàn de xuǎn zé', 'Its influence may not be dramatic, but it slowly changes later choices.', 'Ảnh hưởng của nó không nhất thiết ồn ào, nhưng dần thay đổi các lựa chọn phía sau.', 'ผลของมันอาจไม่หวือหวา แต่ค่อย ๆ เปลี่ยนการเลือกต่อมา', 'Pengaruhnya mungkin tidak gegap gempita, tetapi perlahan mengubah pilihan berikutnya.'),
  factMisread: shortTemplate('如果只停在表面，就会看不见它和前后步骤的关系。', 'rú guǒ zhǐ tíng zài biǎo miàn jiù huì kàn bú jiàn tā hé qián hòu bù zhòu de guān xì', 'If the surface is all that is seen, its relation to surrounding steps disappears.', 'Nếu chỉ dừng ở bề mặt, sẽ không thấy quan hệ của nó với các bước trước sau.', 'ถ้าหยุดอยู่แค่ผิวหน้า ก็จะไม่เห็นความสัมพันธ์กับขั้นก่อนหลัง', 'Jika hanya berhenti di permukaan, hubungannya dengan langkah sekitar tidak terlihat.'),
  factReturn: ({ articleConfig }) => row({
    zh: `回到${articleConfig.focus.zh}，这个细节正好补上一个关键角。`,
    pinyin: `huí dào ${articleConfig.focus.pinyin} zhè ge xì jié zhèng hǎo bǔ shàng yī gè guān jiàn jiǎo`,
    en: `Returning to ${articleConfig.focus.en}, this detail fills an important corner.`,
    vi: `Trở lại ${articleConfig.focus.vi}, chi tiết này bổ sung đúng một góc quan trọng.`,
    th: `เมื่อกลับมาที่ ${articleConfig.focus.th} รายละเอียดนี้เติมมุมสำคัญพอดี`,
    id: `Kembali ke ${articleConfig.focus.id}, detail ini mengisi satu sudut penting.`,
  }),
  factFlow: shortTemplate('原因、过程和结果在这里接成一条线。', 'yuán yīn guò chéng hé jié guǒ zài zhè lǐ jiē chéng yī tiáo xiàn', 'Cause, process, and result connect into one line here.', 'Nguyên nhân, quá trình và kết quả nối thành một đường ở đây.', 'เหตุ กระบวนการ และผล เชื่อมเป็นเส้นเดียวตรงนี้', 'Sebab, proses, dan hasil tersambung menjadi satu garis di sini.'),
  factNext: shortTemplate('理解这一层以后，下一层就不会显得突然。', 'lǐ jiě zhè yī céng yǐ hòu xià yī céng jiù bú huì xiǎn de tū rán', 'After this layer is understood, the next layer will not feel sudden.', 'Sau khi hiểu lớp này, lớp tiếp theo sẽ không còn đột ngột.', 'เมื่อเข้าใจชั้นนี้แล้ว ชั้นต่อไปจะไม่ดูฉับพลัน', 'Setelah lapis ini dipahami, lapis berikutnya tidak terasa tiba-tiba.'),
};

function interpolateRow(templateName, categoryConfig, articleConfig) {
  const template = introTemplates[templateName];
  return rowFromTemplate(template, { categoryConfig, articleConfig });
}

function factSentence(templateName, context) {
  const template = factTemplates[templateName];
  if (typeof template === 'function') return template(context);
  return rowFromTemplate(template, context);
}

function shortTemplate(zh, pinyin, en, vi, th, id) {
  return { zh: () => zh, pinyin: () => pinyin, en: () => en, vi: () => vi, th: () => th, id: () => id };
}

function rowFromTemplate(template, context) {
  return row({
    zh: template.zh(context),
    pinyin: template.pinyin(context),
    en: template.en(context),
    vi: template.vi(context),
    th: template.th(context),
    id: template.id(context),
  });
}

function row(values) {
  return {
    pinyin: values.pinyin,
    content_zh: values.zh,
    content_en: values.en,
    content_vi: values.vi,
    content_th: values.th,
    content_id: values.id,
  };
}

function text(zh, pinyin, en, vi, th, id) {
  return { zh, pinyin, en, vi, th, id };
}

function article(localId, slug, titlePinyin, title_i18n, bluf, focus, place, scene, facts, entities, keywords) {
  return {
    localId,
    slug,
    titlePinyin,
    title_pinyin: titlePinyin,
    title_i18n,
    bluf: row(bluf),
    focus,
    place,
    scene,
    facts,
    entities,
    keywords,
  };
}

function articleEntityEnglish(articleConfig) {
  return articleConfig.entities.map((entityName) => entityEnglishName(entityName));
}

function articleEntityPinyin(articleConfig) {
  return articleConfig.entities.slice(0, 3).map((entityName) => pinyinForEntity(entityName)).join(' ');
}

function buildArticleDocument(categoryConfig, articleConfig, sentences) {
  return {
    schema: 'china.article.v2',
    doc_version: '2026-05-phase1',
    category_code: categoryConfig.categoryCode,
    category_dir: categoryConfig.categoryDir,
    article_slug: articleConfig.slug,
    article: {
      local_id: articleConfig.localId,
      category_code: categoryConfig.categoryCode,
      title_pinyin: articleConfig.titlePinyin,
      title_i18n: articleConfig.title_i18n,
    },
    content_policy: {
      sentence_target: 120,
      sentence_hard_max: 120,
      update_mode: 'append_only_infinite',
      phase: 'phase1',
      writing_mode: 'story_first_then_sentence_split',
      risk_controls: riskControls,
    },
    source_story_zh: sentences.map((sentence) => sentence.content_zh),
    seo: {
      schema_type: 'Article',
      primary_keywords: articleConfig.keywords,
      search_intents: categoryConfig.defaultSearchIntents,
      pseo_paths: [`/china/${categoryConfig.categoryDir}/${articleConfig.slug.replace(/^\d+-/, '')}`],
    },
    geo: {
      bluf: Object.fromEntries(languageKeys.map((languageKey) => [languageKey, sentences[0][contentField(languageKey)]])),
      entities: articleConfig.entities.map((entityName) => ({
        type: categoryConfig.entityType,
        name_zh: entityName,
        name_en: entityEnglishName(entityName),
      })),
      citation_notes: [
        '第 1 句可直接作为简短答案',
        '正文按连续文章推进，不写生成器元话术',
        '内容默认适配越南、泰国、印尼等东南亚首发市场',
      ],
    },
    sentences,
  };
}

function contentField(languageKey) {
  return languageKey === 'zh' ? 'content_zh' : `content_${languageKey}`;
}

function stringifyArticle(document) {
  const header = { ...document };
  delete header.sentences;
  const lines = JSON.stringify(header, null, 2).replace(/\n}$/, ',\n  "sentences": [').split('\n');
  document.sentences.forEach((sentenceRow, sentenceIndex) => {
    const suffix = sentenceIndex === document.sentences.length - 1 ? '' : ',';
    lines.push(`    ${JSON.stringify(sentenceRow)}${suffix}`);
  });
  lines.push('  ]');
  lines.push('}');
  return `${lines.join('\n')}\n`;
}

function sha256(textValue) {
  return createHash('sha256').update(textValue).digest('hex');
}

const factLabels = [
  text('第一层线索', 'dì yī céng xiàn suǒ', 'First clue', 'Manh mối thứ nhất', 'เบาะแสชั้นแรก', 'Petunjuk pertama'),
  text('第二层线索', 'dì èr céng xiàn suǒ', 'Second clue', 'Manh mối thứ hai', 'เบาะแสชั้นที่สอง', 'Petunjuk kedua'),
  text('第三层线索', 'dì sān céng xiàn suǒ', 'Third clue', 'Manh mối thứ ba', 'เบาะแสชั้นที่สาม', 'Petunjuk ketiga'),
  text('第四层线索', 'dì sì céng xiàn suǒ', 'Fourth clue', 'Manh mối thứ tư', 'เบาะแสชั้นที่สี่', 'Petunjuk keempat'),
  text('第五层线索', 'dì wǔ céng xiàn suǒ', 'Fifth clue', 'Manh mối thứ năm', 'เบาะแสชั้นที่ห้า', 'Petunjuk kelima'),
  text('第六层线索', 'dì liù céng xiàn suǒ', 'Sixth clue', 'Manh mối thứ sáu', 'เบาะแสชั้นที่หก', 'Petunjuk keenam'),
];

const categories = {
  history: {
    generatorName: 'history',
    categoryCode: '01',
    categoryDir: '01-history',
    entityType: 'history_entity',
    defaultSearchIntents: ['what_is', 'why', 'timeline', 'beginner_learning'],
    lens: text('时间线和人物选择', 'shí jiān xiàn hé rén wù xuǎn zé', 'timeline and human choices', 'dòng thời gian và lựa chọn con người', 'เส้นเวลาและการเลือกของผู้คน', 'garis waktu dan pilihan manusia'),
    humanAngle: text('人的选择和制度的安排', 'rén de xuǎn zé hé zhì dù de ān pái', 'human choices and institutional arrangements', 'lựa chọn con người và sắp xếp制度', 'การเลือกของคนและการจัด制度', 'pilihan manusia dan susunan lembaga'),
    nextPath: text('朝代、人物和文化主题', 'cháo dài rén wù hé wén huà zhǔ tí', 'dynasties, people, and culture topics', 'triều đại, nhân vật và chủ đề văn hóa', 'ราชวงศ์ บุคคล และหัวข้อวัฒนธรรม', 'dinasti, tokoh, dan tema budaya'),
    articles: [],
  },
  cuisine: {
    generatorName: 'cuisine',
    categoryCode: '02',
    categoryDir: '02-cuisine',
    entityType: 'cuisine_entity',
    defaultSearchIntents: ['what_is', 'why', 'how_to', 'travel_learning', 'beginner_learning'],
    lens: text('味道、食材和地方生活', 'wèi dào shí cái hé dì fāng shēng huó', 'flavor, ingredients, and local life', 'hương vị, nguyên liệu và đời sống địa phương', 'รสชาติ วัตถุดิบ และชีวิตท้องถิ่น', 'rasa, bahan, dan kehidupan lokal'),
    humanAngle: text('火候、口味和日常吃法', 'huǒ hòu kǒu wèi hé rì cháng chī fǎ', 'heat control, taste, and daily ways of eating', 'lửa nấu, khẩu vị và cách ăn hằng ngày', 'ไฟ รสชาติ และวิธีกินประจำวัน', 'pengaturan api, selera, dan cara makan sehari-hari'),
    nextPath: text('菜系、节日食品和点餐表达', 'cài xì jié rì shí pǐn hé diǎn cān biǎo dá', 'regional cuisines, festival foods, and ordering expressions', 'trường phái món ăn, món lễ hội và cách gọi món', 'สายอาหาร อาหารเทศกาล และสำนวนสั่งอาหาร', 'masakan daerah, makanan festival, dan ungkapan memesan'),
    articles: [],
  },
};

categories.history.articles = [
  article('hist-001', '01-dynasty-order-rhyme', 'zhōng guó cháo dài shùn xù kǒu jué lǐ jiǎng le shén me', title('中国朝代顺序口诀里讲了什么？', 'Chinese Dynasty Order Rhyme', 'Câu vè triều đại Trung Quốc', 'กลอนลำดับราชวงศ์จีน', 'Rima Urutan Dinasti Tiongkok'),
    text('中国朝代顺序口诀用固定顺序帮助学习者记住主要王朝。', 'zhōng guó cháo dài shùn xù kǒu jué yòng gù dìng shùn xù bāng zhù xué xí zhě jì zhù zhǔ yào wáng cháo', 'The Chinese dynasty order rhyme helps learners remember the main dynasties in sequence.', 'Câu vè thứ tự triều đại Trung Quốc giúp người học nhớ các triều đại chính.', 'กลอนลำดับราชวงศ์จีนช่วยให้ผู้เรียนจำราชวงศ์หลักตามลำดับ', 'Rima urutan dinasti Tiongkok membantu pelajar mengingat dinasti utama secara berurutan.'),
    text('朝代顺序', 'cháo dài shùn xù', 'dynasty order', 'thứ tự triều đại', 'ลำดับราชวงศ์', 'urutan dinasti'), text('中原历史地图', 'zhōng yuán lì shǐ dì tú', 'the historical map of the Central Plains', 'bản đồ lịch sử Trung Nguyên', 'แผนที่ประวัติศาสตร์จงหยวน', 'peta sejarah Dataran Tengah'), text('背口诀时脑中展开的一条时间河流', 'bèi kǒu jué shí nǎo zhōng zhǎn kāi de yī tiáo shí jiān hé liú', 'a river of time opening in the mind while reciting the rhyme', 'một dòng sông thời gian mở ra trong đầu khi đọc câu vè', 'สายน้ำแห่งเวลาที่เปิดขึ้นในใจเมื่อท่องกลอน', 'sungai waktu yang terbuka saat menghafal rima'), () => historyFacts.dynasty, ['夏朝', '商朝', '周朝', '秦朝', '汉朝', '唐朝'], kw(['中国朝代顺序', '中国历史入门'], ['Chinese dynasty order', 'Chinese history timeline'])),
  article('hist-002', '02-qin-shi-huang-unification', 'qín shǐ huáng tǒng yī zhōng guó zuò le nǎ xiē shì', title('秦始皇统一中国做了哪些事？', 'Qin Shi Huang Unification', 'Tần Thủy Hoàng thống nhất', 'จิ๋นซีฮ่องเต้รวมจีน', 'Penyatuan Qin Shi Huang'),
    text('秦始皇通过灭六国和统一制度建立了中国第一个中央集权帝国。', 'qín shǐ huáng tōng guò miè liù guó hé tǒng yī zhì dù jiàn lì le zhōng guó dì yī gè zhōng yāng jí quán dì guó', 'Qin Shi Huang built China’s first centralized empire by conquering six states and standardizing systems.', 'Tần Thủy Hoàng lập đế quốc tập quyền đầu tiên bằng cách diệt sáu nước và thống nhất制度.', 'จิ๋นซีฮ่องเต้สร้างจักรวรรดิรวมศูนย์แรกของจีนด้วยการพิชิตหกแคว้นและรวมระบบ', 'Qin Shi Huang membangun kekaisaran terpusat pertama dengan menaklukkan enam negara dan menyeragamkan sistem.'),
    text('秦统一', 'qín tǒng yī', 'Qin unification', 'sự thống nhất của Tần', 'การรวมแผ่นดินของฉิน', 'penyatuan Qin'), text('战国末年的关中和六国土地', 'zhàn guó mò nián de guān zhōng hé liù guó tǔ dì', 'Guanzhong and the six states at the end of the Warring States period', 'Quan Trung và đất sáu nước cuối Chiến Quốc', 'กวนจงและดินแดนหกแคว้นปลายยุครณรัฐ', 'Guanzhong dan wilayah enam negara pada akhir Negara Berperang'), text('六国道路、文字和货币被重新整理的时刻', 'liù guó dào lù wén zì hé huò bì bèi chóng xīn zhěng lǐ de shí kè', 'the moment roads, scripts, and currencies of six states were reorganized', 'khoảnh khắc đường sá, chữ viết và tiền tệ sáu nước được sắp xếp lại', 'ช่วงที่ถนน ตัวอักษร และเงินตราของหกแคว้นถูกจัดใหม่', 'saat jalan, aksara, dan mata uang enam negara ditata ulang'), () => historyFacts.qin, ['秦始皇', '李斯', '郡县制', '小篆', '兵马俑', '长城'], kw(['秦始皇', '秦朝统一'], ['Qin Shi Huang', 'first emperor of China'])),
  article('hist-003', '03-zhang-qian-western-regions', 'hàn wǔ dì wèi shén me pài zhāng qiān chū shǐ xī yù', title('汉武帝为什么派张骞出使西域？', 'Why Zhang Qian Went West', 'Vì sao Trương Khiên đi Tây Vực', 'เหตุผลที่จางเชียนไปตะวันตก', 'Mengapa Zhang Qian ke Barat'),
    text('汉武帝派张骞出使西域，是为了寻找盟友并打开通往中亚的通道。', 'hàn wǔ dì pài zhāng qiān chū shǐ xī yù shì wèi le xún zhǎo méng yǒu bìng dǎ kāi tōng wǎng zhōng yà de tōng dào', 'Emperor Han Wu sent Zhang Qian west to seek allies and open routes to Central Asia.', 'Hán Vũ Đế phái Trương Khiên đi Tây Vực để tìm đồng minh và mở đường sang Trung Á.', 'จักรพรรดิฮั่นอู่ส่งจางเชียนไปตะวันตกเพื่อหาพันธมิตรและเปิดทางสู่เอเชียกลาง', 'Kaisar Han Wu mengirim Zhang Qian ke barat untuk mencari sekutu dan membuka jalur ke Asia Tengah.'),
    text('张骞出使西域', 'zhāng qiān chū shǐ xī yù', 'Zhang Qian’s mission to the Western Regions', 'chuyến đi sứ Tây Vực của Trương Khiên', 'ภารกิจไปดินแดนตะวันตกของจางเชียน', 'misi Zhang Qian ke Wilayah Barat'), text('长安通往河西走廊和中亚的路', 'cháng ān tōng wǎng hé xī zǒu láng hé zhōng yà de lù', 'the road from Chang’an through the Hexi Corridor to Central Asia', 'con đường từ Trường An qua hành lang Hà Tây đến Trung Á', 'เส้นทางจากฉางอันผ่านระเบียงเหอซีสู่อเอเชียกลาง', 'jalan dari Chang’an melalui Koridor Hexi ke Asia Tengah'), text('使者离开长安、走向未知草原的早晨', 'shǐ zhě lí kāi cháng ān zǒu xiàng wèi zhī cǎo yuán de zǎo chén', 'the morning an envoy left Chang’an for unknown grasslands', 'buổi sáng sứ giả rời Trường An đi về thảo nguyên chưa biết', 'เช้าที่ทูตออกจากฉางอันสู่ทุ่งหญ้าที่ไม่รู้จัก', 'pagi ketika utusan meninggalkan Chang’an menuju padang rumput yang belum dikenal'), () => historyFacts.zhangQian, ['汉武帝', '张骞', '西域', '大月氏', '匈奴', '长安'], kw(['张骞', '西域', '丝绸之路'], ['Zhang Qian', 'Western Regions', 'Silk Road origin'])),
  article('hist-004', '04-silk-road-opening', 'sī chóu zhī lù shì zěn me kāi tōng de', title('丝绸之路是怎么开通的？', 'How the Silk Road Opened', 'Con đường Tơ lụa mở ra thế nào', 'เส้นทางสายไหมเปิดอย่างไร', 'Bagaimana Jalur Sutra Dibuka'),
    text('丝绸之路是在汉朝外交、边疆经营和商贸往来中逐渐形成的。', 'sī chóu zhī lù shì zài hàn cháo wài jiāo biān jiāng jīng yíng hé shāng mào wǎng lái zhōng zhú jiàn xíng chéng de', 'The Silk Road formed gradually through Han diplomacy, frontier policy, and trade.', 'Con đường Tơ lụa dần hình thành qua ngoại giao, quản lý biên cương và thương mại thời Hán.', 'เส้นทางสายไหมค่อย ๆ ก่อตัวจากการทูต การจัดการชายแดน และการค้าในยุคฮั่น', 'Jalur Sutra terbentuk bertahap lewat diplomasi Han, kebijakan perbatasan, dan perdagangan.'),
    text('丝绸之路形成', 'sī chóu zhī lù xíng chéng', 'the formation of the Silk Road', 'sự hình thành Con đường Tơ lụa', 'การก่อตัวของเส้นทางสายไหม', 'terbentuknya Jalur Sutra'), text('长安、敦煌和中亚绿洲之间', 'cháng ān dūn huáng hé zhōng yà lǜ zhōu zhī jiān', 'between Chang’an, Dunhuang, and Central Asian oases', 'giữa Trường An, Đôn Hoàng và các ốc đảo Trung Á', 'ระหว่างฉางอัน ตุนหวง และโอเอซิสเอเชียกลาง', 'antara Chang’an, Dunhuang, dan oasis Asia Tengah'), text('驼队在关口整理货物、等待出发的场景', 'tuó duì zài guān kǒu zhěng lǐ huò wù děng dài chū fā de chǎng jǐng', 'camel caravans arranging goods at a pass before departure', 'cảnh đoàn lạc đà xếp hàng ở cửa ải trước khi lên đường', 'ภาพคาราวานอูฐจัดสินค้า ณ ด่านก่อนออกเดินทาง', 'kafilah unta menata barang di celah gunung sebelum berangkat'), () => historyFacts.silkRoad, ['丝绸之路', '长安', '敦煌', '楼兰', '中亚', '海上丝路'], kw(['丝绸之路', '长安', '敦煌'], ['Silk Road', 'ancient trade route', 'Chang’an'])),
  article('hist-005', '05-three-kingdoms-formation', 'sān guó shí qī de wèi shǔ wú shì zěn me xíng chéng de', title('三国时期的魏蜀吴是怎么形成的？', 'How Wei Shu Wu Formed', 'Ngụy Thục Ngô hình thành', 'เว่ย สู่ อู๋ก่อตัวอย่างไร', 'Terbentuknya Wei Shu Wu'),
    text('魏蜀吴是在东汉末年军阀混战后形成的三个割据政权。', 'wèi shǔ wú shì zài dōng hàn mò nián jūn fá hùn zhàn hòu xíng chéng de sān gè gē jù zhèng quán', 'Wei, Shu, and Wu were three regimes formed after late Eastern Han warlord conflicts.', 'Ngụy, Thục, Ngô là ba chính quyền hình thành sau hỗn chiến quân phiệt cuối Đông Hán.', 'เว่ย สู่ และอู๋คือสามรัฐที่เกิดหลังศึกขุนศึกปลายฮั่นตะวันออก', 'Wei, Shu, dan Wu adalah tiga rezim setelah konflik panglima perang akhir Han Timur.'),
    text('魏蜀吴形成', 'wèi shǔ wú xíng chéng', 'the formation of Wei, Shu, and Wu', 'sự hình thành Ngụy Thục Ngô', 'การก่อตัวของเว่ย สู่ และอู๋', 'terbentuknya Wei, Shu, dan Wu'), text('东汉末年的北方、巴蜀和江东', 'dōng hàn mò nián de běi fāng bā shǔ hé jiāng dōng', 'the north, Bashu, and Jiangdong in the late Eastern Han', 'miền bắc, Ba Thục và Giang Đông cuối Đông Hán', 'ภาคเหนือ ปาสู่ และเจียงตงปลายฮั่นตะวันออก', 'utara, Bashu, dan Jiangdong pada akhir Han Timur'), text('赤壁之后三方势力重新站稳的局面', 'chì bì zhī hòu sān fāng shì lì chóng xīn zhàn wěn de jú miàn', 'the situation after Red Cliffs when three powers regained balance', 'cục diện sau Xích Bích khi ba thế lực đứng vững lại', 'สถานการณ์หลังผาแดงเมื่อสามฝ่ายตั้งหลักใหม่', 'keadaan setelah Tebing Merah ketika tiga kekuatan kembali seimbang'), () => historyFacts.threeKingdoms, ['曹操', '刘备', '孙权', '诸葛亮', '赤壁', '司马懿'], kw(['三国', '魏蜀吴', '赤壁之战'], ['Three Kingdoms', 'Wei Shu Wu', 'Battle of Red Cliffs'])),
  article('hist-006', '06-great-tang-era', 'táng cháo wèi shén me bèi chēng wéi dà táng shèng shì', title('唐朝为什么被称为大唐盛世？', 'Why Tang Was a Golden Age', 'Vì sao Đường thịnh thế', 'เหตุใดถังเป็นยุครุ่งเรือง', 'Mengapa Tang Zaman Emas'),
    text('唐朝被称为大唐盛世，是因为它在政治、经济、文化和国际交流上都很强盛。', 'táng cháo bèi chēng wéi dà táng shèng shì shì yīn wèi tā zài zhèng zhì jīng jì wén huà hé guó jì jiāo liú shàng dōu hěn qiáng shèng', 'The Tang is called a golden age because politics, economy, culture, and exchange were all strong.', 'Nhà Đường được gọi là thịnh thế vì chính trị, kinh tế, văn hóa và giao lưu đều mạnh.', 'ถังถูกเรียกว่ายุครุ่งเรืองเพราะการเมือง เศรษฐกิจ วัฒนธรรม และการแลกเปลี่ยนล้วนเข้มแข็ง', 'Tang disebut zaman emas karena politik, ekonomi, budaya, dan pertukaran internasionalnya kuat.'),
    text('大唐盛世', 'dà táng shèng shì', 'the Tang golden age', 'thịnh thế Đại Đường', 'ยุครุ่งเรืองต้าถัง', 'zaman emas Tang'), text('长安城和唐代交通网络', 'cháng ān chéng hé táng dài jiāo tōng wǎng luò', 'Chang’an and the Tang transport network', 'Trường An và mạng lưới giao thông thời Đường', 'ฉางอันและเครือข่ายคมนาคมยุคถัง', 'Chang’an dan jaringan transportasi Tang'), text('长安街市里商人、诗人和使节相遇的画面', 'cháng ān jiē shì lǐ shāng rén shī rén hé shǐ jié xiāng yù de huà miàn', 'merchants, poets, and envoys meeting in Chang’an streets', 'cảnh thương nhân, thi nhân và sứ giả gặp nhau trên phố Trường An', 'ภาพพ่อค้า กวี และทูตพบกันในถนนฉางอัน', 'pedagang, penyair, dan utusan bertemu di jalan Chang’an'), () => historyFacts.tang, ['唐太宗', '武则天', '唐玄宗', '长安', '李白', '杜甫'], kw(['唐朝', '大唐盛世', '长安'], ['Tang dynasty', 'Tang golden age', 'Chang’an'])),
  article('hist-007', '07-xuanzang-journey', 'xuán zàng xī xíng qǔ jīng de zhēn shí gù shi', title('玄奘西行取经的真实故事', 'Xuanzang’s Real Journey', 'Hành trình thật của Huyền Trang', 'การเดินทางจริงของพระถังซัมจั๋ง', 'Perjalanan Nyata Xuanzang'),
    text('玄奘西行取经是真实的唐代求法旅行，后来才演变成西游记故事。', 'xuán zàng xī xíng qǔ jīng shì zhēn shí de táng dài qiú fǎ lǚ xíng hòu lái cái yǎn biàn chéng xī yóu jì gù shi', 'Xuanzang’s journey was a real Tang pilgrimage that later inspired Journey to the West.', 'Chuyến đi thỉnh kinh của Huyền Trang là hành trình có thật thời Đường, sau thành Tây Du Ký.', 'การไปอัญเชิญพระไตรปิฎกของพระถังซัมจั๋งเป็นเรื่องจริงยุคถัง ก่อนกลายเป็นไซอิ๋ว', 'Perjalanan Xuanzang adalah ziarah nyata era Tang yang kemudian mengilhami Perjalanan ke Barat.'),
    text('玄奘西行', 'xuán zàng xī xíng', 'Xuanzang’s westward journey', 'hành trình tây du của Huyền Trang', 'การเดินทางไปตะวันตกของพระถังซัมจั๋ง', 'perjalanan barat Xuanzang'), text('长安到印度的漫长道路', 'cháng ān dào yìn dù de màn cháng dào lù', 'the long road from Chang’an to India', 'con đường dài từ Trường An đến Ấn Độ', 'ถนนยาวจากฉางอันสู่อินเดีย', 'jalan panjang dari Chang’an ke India'), text('年轻僧人带着疑问离开长安的夜色', 'nián qīng sēng rén dài zhe yí wèn lí kāi cháng ān de yè sè', 'a young monk leaving Chang’an at night with questions', 'đêm một nhà sư trẻ rời Trường An cùng nhiều câu hỏi', 'ค่ำคืนที่พระหนุ่มออกจากฉางอันพร้อมคำถาม', 'malam ketika biksu muda meninggalkan Chang’an dengan pertanyaan'), () => historyFacts.xuanzang, ['玄奘', '长安', '那烂陀寺', '印度', '大唐西域记', '西游记'], kw(['玄奘', '西游记', '大唐西域记'], ['Xuanzang', 'Journey to the West real story', 'Buddhist scriptures'])),
  article('hist-008', '08-song-economy-military', 'sòng cháo wèi shén me jīng jì fā dá què jūn shì ruò', title('宋朝为什么经济发达却军事弱？', 'Rich Song, Weak Military', 'Tống giàu nhưng quân yếu', 'ซ่งมั่งคั่งแต่ทหารอ่อน', 'Song Kaya tetapi Militer Lemah'),
    text('宋朝经济发达却军事偏弱，核心原因是重文轻武和外部压力长期并存。', 'sòng cháo jīng jì fā dá què jūn shì piān ruò hé xīn yuán yīn shì zhòng wén qīng wǔ hé wài bù yā lì cháng qī bìng cún', 'The Song was rich but militarily weaker because civil governance and external pressure coexisted for a long time.', 'Nhà Tống giàu nhưng quân sự yếu vì trọng văn khinh võ cùng áp lực bên ngoài kéo dài.', 'ซ่งเศรษฐกิจรุ่งแต่ทหารอ่อนเพราะเน้นฝ่ายพลเรือนและมีแรงกดดันภายนอกยาวนาน', 'Song kaya tetapi militernya lemah karena pemerintahan sipil dan tekanan luar berlangsung lama.'),
    text('宋朝经济与军事反差', 'sòng cháo jīng jì yǔ jūn shì fǎn chā', 'the contrast between Song economy and military', 'độ tương phản giữa kinh tế và quân sự nhà Tống', 'ความต่างระหว่างเศรษฐกิจและทหารของซ่ง', 'kontras ekonomi dan militer Song'), text('汴京、临安和北方边境之间', 'biàn jīng lín ān hé běi fāng biān jìng zhī jiān', 'between Bianjing, Lin’an, and the northern frontier', 'giữa Biện Kinh, Lâm An và biên giới phía bắc', 'ระหว่างเปี้ยนจิง หลินอัน และชายแดนเหนือ', 'antara Bianjing, Lin’an, dan perbatasan utara'), text('城市灯火很亮、边境压力也很近的宋代画面', 'chéng shì dēng huǒ hěn liàng biān jìng yā lì yě hěn jìn de sòng dài huà miàn', 'a Song scene where city lights were bright and frontier pressure was close', 'bức tranh thời Tống với phố thị sáng đèn và áp lực biên giới gần kề', 'ภาพยุคซ่งที่เมืองสว่างไสวแต่แรงกดดันชายแดนอยู่ใกล้', 'adegan Song saat kota terang tetapi tekanan perbatasan dekat'), () => historyFacts.song, ['宋朝', '汴京', '临安', '交子', '辽', '金'], kw(['宋朝经济', '重文轻武', '交子'], ['Song dynasty economy', 'why Song military weak', 'Chinese civil service'])),
  article('hist-009', '09-mongol-empire-yuan', 'měng gǔ dì guó shì zěn me jiàn lì yuán cháo de', title('蒙古帝国是怎么建立元朝的？', 'Mongols and the Yuan', 'Mông Cổ lập nhà Nguyên', 'มองโกลสร้างหยวนอย่างไร', 'Mongol Mendirikan Yuan'),
    text('蒙古帝国通过草原统一、军事扩张和忽必烈建制，最终建立元朝。', 'měng gǔ dì guó tōng guò cǎo yuán tǒng yī jūn shì kuò zhāng hé hū bì liè jiàn zhì zuì zhōng jiàn lì yuán cháo', 'The Mongol Empire founded Yuan through steppe unification, expansion, and Kublai Khan’s state-building.', 'Đế quốc Mông Cổ lập Nguyên nhờ thống nhất thảo nguyên, mở rộng và xây dựng nhà nước của Hốt Tất Liệt.', 'จักรวรรดิมองโกลตั้งหยวนผ่านการรวมทุ่งหญ้า การขยายทัพ และการสร้างรัฐของกุบไลข่าน', 'Kekaisaran Mongol mendirikan Yuan lewat penyatuan stepa, ekspansi, dan pembentukan negara oleh Kublai Khan.'),
    text('蒙古建立元朝', 'měng gǔ jiàn lì yuán cháo', 'the Mongol founding of Yuan', 'Mông Cổ lập nhà Nguyên', 'มองโกลตั้งราชวงศ์หยวน', 'Mongol mendirikan Yuan'), text('草原、大都和南宋疆域之间', 'cǎo yuán dà dū hé nán sòng jiāng yù zhī jiān', 'between the steppe, Dadu, and Southern Song territory', 'giữa thảo nguyên, Đại Đô và lãnh thổ Nam Tống', 'ระหว่างทุ่งหญ้า ต้าตู และดินแดนซ่งใต้', 'antara stepa, Dadu, dan wilayah Song Selatan'), text('草原骑兵走向城市制度的转折', 'cǎo yuán qí bīng zǒu xiàng chéng shì zhì dù de zhuǎn zhé', 'the turn from steppe cavalry toward urban institutions', 'bước ngoặt từ kỵ binh thảo nguyên sang制度 đô thị', 'จุดเปลี่ยนจากทหารม้าทุ่งหญ้าสู่制度เมือง', 'peralihan dari kavaleri stepa menuju lembaga kota'), () => historyFacts.yuan, ['成吉思汗', '忽必烈', '大都', '南宋', '马可波罗', '草原'], kw(['蒙古帝国', '元朝', '忽必烈'], ['Mongol Empire', 'Yuan dynasty', 'Kublai Khan'])),
  article('hist-010', '10-zheng-he-voyages', 'zhèng hé qī xià xī yáng qù le nǎ xiē dì fāng', title('郑和七下西洋去了哪些地方？', 'Where Zheng He Sailed', 'Trịnh Hòa đi đến đâu', 'เจิ้งเหอเดินเรือไปไหน', 'Ke Mana Zheng He Berlayar'),
    text('郑和七下西洋到达东南亚、南亚、西亚和东非多地。', 'zhèng hé qī xià xī yáng dào dá dōng nán yà nán yà xī yà hé dōng fēi duō dì', 'Zheng He’s seven voyages reached Southeast Asia, South Asia, West Asia, and East Africa.', 'Bảy chuyến Tây Dương của Trịnh Hòa đến Đông Nam Á, Nam Á, Tây Á và Đông Phi.', 'การเดินเรือเจ็ดครั้งของเจิ้งเหอถึงเอเชียตะวันออกเฉียงใต้ เอเชียใต้ เอเชียตะวันตก และแอฟริกาตะวันออก', 'Tujuh pelayaran Zheng He mencapai Asia Tenggara, Asia Selatan, Asia Barat, dan Afrika Timur.'),
    text('郑和下西洋', 'zhèng hé xià xī yáng', 'Zheng He’s voyages', 'các chuyến Tây Dương của Trịnh Hòa', 'การเดินเรือของเจิ้งเหอ', 'pelayaran Zheng He'), text('南京、太仓、马六甲和印度洋沿岸', 'nán jīng tài cāng mǎ liù jiǎ hé yìn dù yáng yán àn', 'Nanjing, Taicang, Malacca, and Indian Ocean coasts', 'Nam Kinh, Thái Thương, Malacca và bờ Ấn Độ Dương', 'หนานจิง ไท่ชาง มะละกา และชายฝั่งมหาสมุทรอินเดีย', 'Nanjing, Taicang, Malaka, dan pesisir Samudra Hindia'), text('大船出港、风帆铺满江面的早晨', 'dà chuán chū gǎng fēng fān pū mǎn jiāng miàn de zǎo chén', 'a morning when large ships left port and sails covered the river', 'buổi sáng thuyền lớn rời cảng, buồm phủ kín mặt sông', 'เช้าที่เรือใหญ่ออกจากท่าและใบเรือเต็มแม่น้ำ', 'pagi ketika kapal besar keluar pelabuhan dan layar memenuhi sungai'), () => historyFacts.zhengHe, ['郑和', '明成祖', '南京', '马六甲', '印度洋', '东非'], kw(['郑和', '西洋', '海上丝绸之路'], ['Zheng He voyages', 'Ming treasure fleet', 'maritime Silk Road'])),
  article('hist-011', '11-ming-qing-sea-ban', 'míng qīng liǎng dài wèi shén me shí xíng hǎi jìn', title('明清两代为什么实行海禁？', 'Ming Qing Sea Bans', 'Vì sao Minh Thanh cấm biển', 'เหตุใดหมิงชิงห้ามทะเล', 'Mengapa Ming Qing Larangan Laut'),
    text('明清海禁主要出于沿海安全、贸易控制和政权治理需要。', 'míng qīng hǎi jìn zhǔ yào chū yú yán hǎi ān quán mào yì kòng zhì hé zhèng quán zhì lǐ xū yào', 'Ming-Qing sea bans mainly reflected coastal security, trade control, and governance needs.', 'Hải cấm Minh Thanh chủ yếu do an ninh ven biển, kiểm soát thương mại và nhu cầu治理.', 'การห้ามทะเลสมัยหมิงชิงมาจากความปลอดภัยชายฝั่ง การควบคุมค้า และการปกครอง', 'Larangan laut Ming-Qing terutama terkait keamanan pesisir, kontrol perdagangan, dan tata kelola.'),
    text('明清海禁', 'míng qīng hǎi jìn', 'Ming-Qing sea bans', 'hải cấm Minh Thanh', 'การห้ามทะเลสมัยหมิงชิง', 'larangan laut Ming-Qing'), text('东南沿海、广州和官方贸易口岸', 'dōng nán yán hǎi guǎng zhōu hé guān fāng mào yì kǒu àn', 'the southeast coast, Guangzhou, and official trade ports', 'duyên hải đông nam, Quảng Châu và cảng thương mại chính thức', 'ชายฝั่งตะวันออกเฉียงใต้ กว่างโจว และท่าค้าอย่างเป็นทางการ', 'pesisir tenggara, Guangzhou, dan pelabuhan dagang resmi'), text('海岸居民、商船和官府规则同时存在的场景', 'hǎi àn jū mín shāng chuán hé guān fǔ guī zé tóng shí cún zài de chǎng jǐng', 'a scene where coastal residents, merchant ships, and official rules coexisted', 'cảnh cư dân ven biển, thuyền buôn và quy định官 phủ cùng tồn tại', 'ภาพชาวชายฝั่ง เรือค้า และกฎรัฐอยู่พร้อมกัน', 'adegan penduduk pesisir, kapal dagang, dan aturan resmi berdampingan'), () => historyFacts.seaBan, ['明朝', '清朝', '倭寇', '广州', '朝贡', '海商'], kw(['海禁', '明清', '朝贡贸易'], ['Ming sea ban', 'Qing maritime ban', 'Chinese maritime trade'])),
  article('hist-012', '12-opium-war-1840', 'yī bā sì líng nián yā piàn zhàn zhēng fā shēng le shén me', title('1840年鸦片战争发生了什么？', 'What Happened in the Opium War', 'Chiến tranh Nha phiến 1840', 'สงครามฝิ่นปี 1840', 'Perang Candu 1840'),
    text('1840年鸦片战争是清朝与英国围绕鸦片、贸易和外交冲突爆发的战争。', 'yī bā sì líng nián yā piàn zhàn zhēng shì qīng cháo yǔ yīng guó wéi rào yā piàn mào yì hé wài jiāo chōng tū bào fā de zhàn zhēng', 'The 1840 Opium War was a conflict between Qing China and Britain over opium, trade, and diplomacy.', 'Chiến tranh Nha phiến 1840 là xung đột giữa nhà Thanh và Anh về nha phiến, thương mại và ngoại giao.', 'สงครามฝิ่นปี 1840 คือความขัดแย้งระหว่างชิงกับอังกฤษเรื่องฝิ่น การค้า และการทูต', 'Perang Candu 1840 adalah konflik Qing dan Inggris soal opium, perdagangan, dan diplomasi.'),
    text('鸦片战争', 'yā piàn zhàn zhēng', 'the Opium War', 'Chiến tranh Nha phiến', 'สงครามฝิ่น', 'Perang Candu'), text('广州、虎门、南京和海上航线', 'guǎng zhōu hǔ mén nán jīng hé hǎi shàng háng xiàn', 'Guangzhou, Humen, Nanjing, and maritime routes', 'Quảng Châu, Hổ Môn, Nam Kinh và tuyến biển', 'กว่างโจว หู่เหมิน นานกิง และเส้นทางทะเล', 'Guangzhou, Humen, Nanjing, dan jalur laut'), text('贸易矛盾一步步变成战争的清代海岸', 'mào yì máo dùn yī bù bù biàn chéng zhàn zhēng de qīng dài hǎi àn', 'a Qing coast where trade tensions gradually became war', 'bờ biển thời Thanh nơi mâu thuẫn thương mại dần thành chiến tranh', 'ชายฝั่งชิงที่ความตึงเครียดการค้าค่อย ๆ กลายเป็นสงคราม', 'pesisir Qing tempat ketegangan dagang perlahan menjadi perang'), () => historyFacts.opiumWar, ['林则徐', '虎门', '广州', '英国', '南京条约', '清朝'], kw(['鸦片战争', '南京条约', '近代史'], ['Opium War 1840', 'Treaty of Nanjing', 'modern Chinese history'])),
];

function title(zh, en, vi, th, id) {
  return { zh, en, vi, th, id };
}

function kw(zh, en, vi = [], th = [], id = []) {
  return {
    zh,
    en,
    vi: vi.length > 0 ? vi : ['lịch sử Trung Quốc', 'học tiếng Trung qua lịch sử'],
    th: th.length > 0 ? th : ['ประวัติศาสตร์จีน', 'เรียนจีนผ่านประวัติศาสตร์'],
    id: id.length > 0 ? id : ['sejarah Tiongkok', 'belajar Mandarin lewat sejarah'],
  };
}

function entityEnglishName(entityName) {
  return entityNameMap[entityName] ?? entityName;
}

function pinyinForEntity(entityName) {
  return entityPinyinMap[entityName] ?? 'zhōng guó wén huà cí';
}

const entityNameMap = {
  秦始皇: 'Qin Shi Huang', 郡县制: 'commandery-county system', 小篆: 'Small Seal Script', 兵马俑: 'Terracotta Army',
  汉武帝: 'Emperor Han Wu', 张骞: 'Zhang Qian', 西域: 'Western Regions', 丝绸之路: 'Silk Road', 长安: 'Chang’an', 敦煌: 'Dunhuang',
  曹操: 'Cao Cao', 刘备: 'Liu Bei', 孙权: 'Sun Quan', 诸葛亮: 'Zhuge Liang', 赤壁: 'Red Cliffs',
  唐太宗: 'Emperor Taizong of Tang', 武则天: 'Wu Zetian', 唐玄宗: 'Emperor Xuanzong of Tang', 李白: 'Li Bai', 杜甫: 'Du Fu',
  玄奘: 'Xuanzang', 那烂陀寺: 'Nalanda', 大唐西域记: 'Great Tang Records on the Western Regions', 西游记: 'Journey to the West',
  交子: 'Jiaozi paper money', 成吉思汗: 'Genghis Khan', 忽必烈: 'Kublai Khan', 大都: 'Dadu', 郑和: 'Zheng He', 马六甲: 'Malacca',
  鲁菜: 'Shandong cuisine', 川菜: 'Sichuan cuisine', 粤菜: 'Cantonese cuisine', 苏菜: 'Jiangsu cuisine', 闽菜: 'Fujian cuisine', 浙菜: 'Zhejiang cuisine', 湘菜: 'Hunan cuisine', 徽菜: 'Anhui cuisine',
  花椒: 'Sichuan peppercorn', 辣椒: 'chili', 豆瓣酱: 'doubanjiang', 麻婆豆腐: 'mapo tofu', 四川火锅: 'Sichuan hot pot', 北京烤鸭: 'Peking duck', 火锅: 'hot pot', 月饼: 'mooncake',
};

const entityPinyinMap = {
  秦始皇: 'qín shǐ huáng', 郡县制: 'jùn xiàn zhì', 小篆: 'xiǎo zhuàn', 兵马俑: 'bīng mǎ yǒng', 汉武帝: 'hàn wǔ dì', 张骞: 'zhāng qiān', 西域: 'xī yù', 丝绸之路: 'sī chóu zhī lù', 长安: 'cháng ān', 敦煌: 'dūn huáng', 曹操: 'cáo cāo', 刘备: 'liú bèi', 孙权: 'sūn quán', 诸葛亮: 'zhū gé liàng', 赤壁: 'chì bì', 唐太宗: 'táng tài zōng', 武则天: 'wǔ zé tiān', 唐玄宗: 'táng xuán zōng', 李白: 'lǐ bái', 杜甫: 'dù fǔ', 玄奘: 'xuán zàng', 那烂陀寺: 'nà làn tuó sì', 大唐西域记: 'dà táng xī yù jì', 西游记: 'xī yóu jì', 交子: 'jiāo zǐ', 成吉思汗: 'chéng jí sī hán', 忽必烈: 'hū bì liè', 大都: 'dà dū', 郑和: 'zhèng hé', 马六甲: 'mǎ liù jiǎ', 鲁菜: 'lǔ cài', 川菜: 'chuān cài', 粤菜: 'yuè cài', 苏菜: 'sū cài', 闽菜: 'mǐn cài', 浙菜: 'zhè cài', 湘菜: 'xiāng cài', 徽菜: 'huī cài', 花椒: 'huā jiāo', 辣椒: 'là jiāo', 豆瓣酱: 'dòu bàn jiàng', 麻婆豆腐: 'má pó dòu fu', 四川火锅: 'sì chuān huǒ guō', 北京烤鸭: 'běi jīng kǎo yā', 火锅: 'huǒ guō', 月饼: 'yuè bǐng',
};

const historyFacts = {
  dynasty: [
    text('夏商周秦汉是口诀的开头。', 'xià shāng zhōu qín hàn shì kǒu jué de kāi tóu', 'Xia, Shang, Zhou, Qin, and Han open the rhyme.', 'Hạ, Thương, Chu, Tần, Hán là phần mở đầu của câu vè.', 'เซี่ย ซาง โจว ฉิน ฮั่นเป็นช่วงเปิดของกลอน', 'Xia, Shang, Zhou, Qin, dan Han menjadi pembuka rima.'),
    text('三国两晋南北朝概括了长期分裂。', 'sān guó liǎng jìn nán běi cháo gài kuò le cháng qī fēn liè', 'The Three Kingdoms, Two Jin, and Northern-Southern Dynasties summarize long division.', 'Tam Quốc, Lưỡng Tấn và Nam Bắc triều tóm lược thời kỳ chia cắt dài.', 'สามก๊ก สองจิ้น และราชวงศ์เหนือใต้สรุปยุคแบ่งแยกยาวนาน', 'Tiga Kerajaan, Dua Jin, dan Dinasti Utara-Selatan merangkum perpecahan panjang.'),
    text('隋唐五代宋连接了统一和繁荣。', 'suí táng wǔ dài sòng lián jiē le tǒng yī hé fán róng', 'Sui, Tang, Five Dynasties, and Song connect reunification with prosperity.', 'Tùy, Đường, Ngũ Đại và Tống nối liền thống nhất với thịnh vượng.', 'สุย ถัง ห้าราชวงศ์ และซ่งเชื่อมการรวมแผ่นดินกับความรุ่งเรือง', 'Sui, Tang, Lima Dinasti, dan Song menghubungkan penyatuan dengan kemakmuran.'),
    text('元明清是口诀的最后三个大朝代。', 'yuán míng qīng shì kǒu jué de zuì hòu sān gè dà cháo dài', 'Yuan, Ming, and Qing are the last three major dynasties in the rhyme.', 'Nguyên, Minh, Thanh là ba triều đại lớn cuối cùng trong câu vè.', 'หยวน หมิง ชิงคือสามราชวงศ์ใหญ่สุดท้ายในกลอน', 'Yuan, Ming, dan Qing adalah tiga dinasti besar terakhir dalam rima.'),
    text('口诀适合做中国历史入门索引。', 'kǒu jué shì hé zuò zhōng guó lì shǐ rù mén suǒ yǐn', 'The rhyme works as an entry index for Chinese history.', 'Câu vè phù hợp làm chỉ mục nhập môn lịch sử Trung Quốc.', 'กลอนนี้เหมาะเป็นดัชนีเริ่มต้นของประวัติศาสตร์จีน', 'Rima ini cocok menjadi indeks awal sejarah Tiongkok.'),
    text('学习朝代顺序有助于理解人物和事件。', 'xué xí cháo dài shùn xù yǒu zhù yú lǐ jiě rén wù hé shì jiàn', 'Learning dynasty order helps explain people and events.', 'Học thứ tự triều đại giúp hiểu nhân vật và sự kiện.', 'การเรียนลำดับราชวงศ์ช่วยเข้าใจบุคคลและเหตุการณ์', 'Mempelajari urutan dinasti membantu memahami tokoh dan peristiwa.'),
  ],
  qin: [
    text('秦在公元前221年完成统一。', 'qín zài gōng yuán qián èr èr yī nián wán chéng tǒng yī', 'Qin completed unification in 221 BCE.', 'Tần hoàn thành thống nhất năm 221 trước Công nguyên.', 'ฉินรวมแผ่นดินสำเร็จในปี 221 ก่อนคริสตกาล', 'Qin menyelesaikan penyatuan pada 221 SM.'),
    text('皇帝称号从秦始皇开始使用。', 'huáng dì chēng hào cóng qín shǐ huáng kāi shǐ shǐ yòng', 'The title emperor began with Qin Shi Huang.', 'Danh hiệu hoàng đế bắt đầu từ Tần Thủy Hoàng.', 'ตำแหน่งจักรพรรดิเริ่มใช้จากจิ๋นซีฮ่องเต้', 'Gelar kaisar mulai dipakai sejak Qin Shi Huang.'),
    text('小篆成为统一文字的标准。', 'xiǎo zhuàn chéng wéi tǒng yī wén zì de biāo zhǔn', 'Small Seal Script became the standard script.', 'Tiểu triện trở thành chuẩn chữ viết thống nhất.', 'อักษรเสี่ยวจ้วนกลายเป็นมาตรฐานตัวเขียน', 'Aksara Segel Kecil menjadi standar tulisan.'),
    text('郡县制让中央直接管理地方。', 'jùn xiàn zhì ràng zhōng yāng zhí jiē guǎn lǐ dì fāng', 'The commandery-county system let the center govern local areas directly.', 'Chế độ quận huyện giúp trung ương quản lý địa phương trực tiếp.', 'ระบบจวิ้นเซี่ยนทำให้ส่วนกลางปกครองท้องถิ่นโดยตรง', 'Sistem komanderi-kabupaten membuat pusat mengelola daerah langsung.'),
    text('圆形方孔钱统一了货币。', 'yuán xíng fāng kǒng qián tǒng yī le huò bì', 'Round coins with square holes standardized currency.', 'Đồng tiền tròn lỗ vuông thống nhất tiền tệ.', 'เหรียญกลมรูเหลี่ยมทำให้เงินตราเป็นมาตรฐาน', 'Koin bundar berlubang persegi menyeragamkan mata uang.'),
    text('兵马俑让秦始皇陵成为世界闻名的遗址。', 'bīng mǎ yǒng ràng qín shǐ huáng líng chéng wéi shì jiè wén míng de yí zhǐ', 'The Terracotta Army made his mausoleum a world-famous site.', 'Binh mã dũng khiến lăng Tần Thủy Hoàng thành di chỉ nổi tiếng thế giới.', 'กองทัพทหารดินเผาทำให้สุสานจิ๋นซีโด่งดังทั่วโลก', 'Pasukan Terakota membuat makam Qin Shi Huang terkenal di dunia.'),
  ],
  zhangQian: [
    text('张骞第一次出使始于公元前138年。', 'zhāng qiān dì yī cì chū shǐ shǐ yú gōng yuán qián yī sān bā nián', 'Zhang Qian’s first mission began in 138 BCE.', 'Chuyến đi sứ đầu tiên của Trương Khiên bắt đầu năm 138 TCN.', 'ภารกิจแรกของจางเชียนเริ่มในปี 138 ก่อนคริสตกาล', 'Misi pertama Zhang Qian dimulai pada 138 SM.'),
    text('他的目标是联络大月氏。', 'tā de mù biāo shì lián luò dà yuè zhī', 'His goal was to contact the Yuezhi.', 'Mục tiêu của ông là liên lạc với Đại Nguyệt Chi.', 'เป้าหมายของเขาคือติดต่อชาวเยว่จือ', 'Tujuannya adalah menghubungi Yuezhi.'),
    text('他曾被匈奴扣留多年。', 'tā céng bèi xiōng nú kòu liú duō nián', 'He was detained by the Xiongnu for many years.', 'Ông từng bị Hung Nô giữ lại nhiều năm.', 'เขาเคยถูกซยงหนูกักตัวหลายปี', 'Ia pernah ditahan Xiongnu selama bertahun-tahun.'),
    text('军事同盟没有达成，但地理信息非常宝贵。', 'jūn shì tóng méng méi yǒu dá chéng dàn dì lǐ xìn xī fēi cháng bǎo guì', 'The alliance failed, but the geographic intelligence was valuable.', 'Liên minh quân sự thất bại nhưng thông tin địa lý rất quý.', 'พันธมิตรทหารไม่สำเร็จแต่ข้อมูลภูมิศาสตร์มีค่ามาก', 'Aliansi militer gagal, tetapi informasi geografisnya sangat berharga.'),
    text('张骞被视为丝绸之路开拓者。', 'zhāng qiān bèi shì wéi sī chóu zhī lù kāi tuò zhě', 'Zhang Qian is regarded as a pioneer of the Silk Road.', 'Trương Khiên được xem là người mở đường Tơ lụa.', 'จางเชียนถูกมองว่าเป็นผู้บุกเบิกเส้นทางสายไหม', 'Zhang Qian dipandang sebagai perintis Jalur Sutra.'),
    text('西域信息改变了汉朝的战略视野。', 'xī yù xìn xī gǎi biàn le hàn cháo de zhàn lüè shì yě', 'Knowledge of the Western Regions changed Han strategy.', 'Thông tin Tây Vực thay đổi tầm nhìn chiến lược của nhà Hán.', 'ข้อมูลดินแดนตะวันตกเปลี่ยนมุมมองยุทธศาสตร์ของฮั่น', 'Informasi Wilayah Barat mengubah wawasan strategi Han.'),
  ],
  silkRoad: [
    text('丝绸之路不是一条单线道路。', 'sī chóu zhī lù bú shì yī tiáo dān xiàn dào lù', 'The Silk Road was not a single road.', 'Con đường Tơ lụa không phải một tuyến đường duy nhất.', 'เส้นทางสายไหมไม่ใช่ถนนเส้นเดียว', 'Jalur Sutra bukan satu jalan tunggal.'),
    text('长安是重要起点。', 'cháng ān shì zhòng yào qǐ diǎn', 'Chang’an was an important starting point.', 'Trường An là điểm khởi đầu quan trọng.', 'ฉางอันเป็นจุดเริ่มต้นสำคัญ', 'Chang’an adalah titik awal penting.'),
    text('敦煌是中转和文化交流节点。', 'dūn huáng shì zhōng zhuǎn hé wén huà jiāo liú jié diǎn', 'Dunhuang was a transit and cultural exchange hub.', 'Đôn Hoàng là điểm trung chuyển và giao lưu văn hóa.', 'ตุนหวงเป็นจุดพักและแลกเปลี่ยนวัฒนธรรม', 'Dunhuang adalah simpul transit dan pertukaran budaya.'),
    text('丝绸、茶叶和瓷器向西传播。', 'sī chóu chá yè hé cí qì xiàng xī chuán bō', 'Silk, tea, and porcelain moved westward.', 'Tơ lụa, trà và đồ sứ truyền sang phía tây.', 'ผ้าไหม ชา และเครื่องเคลือบแพร่ไปทางตะวันตก', 'Sutra, teh, dan porselen menyebar ke barat.'),
    text('葡萄、香料和玻璃器也传入中国。', 'pú táo xiāng liào hé bō li qì yě chuán rù zhōng guó', 'Grapes, spices, and glassware entered China.', 'Nho, hương liệu và đồ thủy tinh cũng vào Trung Quốc.', 'องุ่น เครื่องเทศ และเครื่องแก้วก็เข้าสู่จีน', 'Anggur, rempah, dan barang kaca juga masuk Tiongkok.'),
    text('海上丝路后来变得同样重要。', 'hǎi shàng sī lù hòu lái biàn de tóng yàng zhòng yào', 'The maritime route later became equally important.', 'Tuyến đường biển về sau cũng trở nên quan trọng.', 'เส้นทางทะเลต่อมาก็สำคัญไม่แพ้กัน', 'Jalur laut kemudian menjadi sama pentingnya.'),
  ],
  threeKingdoms: [
    text('黄巾起义削弱了东汉朝廷。', 'huáng jīn qǐ yì xuē ruò le dōng hàn cháo tíng', 'The Yellow Turban Rebellion weakened the Eastern Han court.', 'Khởi nghĩa Khăn Vàng làm triều đình Đông Hán suy yếu.', 'กบฏโพกผ้าเหลืองทำให้ราชสำนักฮั่นตะวันออกอ่อนแอ', 'Pemberontakan Sorban Kuning melemahkan istana Han Timur.'),
    text('曹操逐渐控制北方。', 'cáo cāo zhú jiàn kòng zhì běi fāng', 'Cao Cao gradually controlled the north.', 'Tào Tháo dần kiểm soát phương Bắc.', 'โจโฉค่อย ๆ ควบคุมภาคเหนือ', 'Cao Cao perlahan menguasai utara.'),
    text('赤壁之战阻止了曹操南下统一。', 'chì bì zhī zhàn zǔ zhǐ le cáo cāo nán xià tǒng yī', 'Red Cliffs stopped Cao Cao from unifying the south.', 'Xích Bích ngăn Tào Tháo thống nhất phương nam.', 'ศึกผาแดงหยุดโจโฉไม่ให้รวมแดนใต้', 'Tebing Merah menghentikan Cao Cao menyatukan selatan.'),
    text('曹丕在220年建立魏。', 'cáo pī zài èr èr líng nián jiàn lì wèi', 'Cao Pi founded Wei in 220.', 'Tào Phi lập nước Ngụy năm 220.', 'โจผีตั้งเว่ยในปี 220', 'Cao Pi mendirikan Wei pada 220.'),
    text('刘备在221年建立蜀。', 'liú bèi zài èr èr yī nián jiàn lì shǔ', 'Liu Bei founded Shu in 221.', 'Lưu Bị lập Thục năm 221.', 'เล่าปี่ตั้งสู่ในปี 221', 'Liu Bei mendirikan Shu pada 221.'),
    text('孙权在229年建立吴。', 'sūn quán zài èr èr jiǔ nián jiàn lì wú', 'Sun Quan founded Wu in 229.', 'Tôn Quyền lập Ngô năm 229.', 'ซุนกวนตั้งอู๋ในปี 229', 'Sun Quan mendirikan Wu pada 229.'),
  ],
  tang: [
    text('唐朝从618年延续到907年。', 'táng cháo cóng liù yī bā nián yán xù dào jiǔ líng qī nián', 'The Tang lasted from 618 to 907.', 'Nhà Đường kéo dài từ 618 đến 907.', 'ราชวงศ์ถังอยู่ตั้งแต่ปี 618 ถึง 907', 'Tang berlangsung dari 618 hingga 907.'),
    text('贞观之治体现了早期治理能力。', 'zhēn guān zhī zhì tǐ xiàn le zǎo qī zhì lǐ néng lì', 'The Zhenguan era showed early governance strength.', 'Trinh Quán chi trị thể hiện năng lực trị quốc ban đầu.', 'ยุคเจินกวนแสดงความสามารถการปกครองระยะแรก', 'Era Zhenguan menunjukkan kekuatan tata kelola awal.'),
    text('开元盛世代表唐朝高峰。', 'kāi yuán shèng shì dài biǎo táng cháo gāo fēng', 'The Kaiyuan era marked Tang’s peak.', 'Khai Nguyên thịnh thế đại diện đỉnh cao nhà Đường.', 'ไคหยวนคือจุดสูงสุดของถัง', 'Era Kaiyuan menandai puncak Tang.'),
    text('长安是国际化大城市。', 'cháng ān shì guó jì huà dà chéng shì', 'Chang’an was an international metropolis.', 'Trường An là đô thị quốc tế.', 'ฉางอันเป็นมหานครนานาชาติ', 'Chang’an adalah kota metropolitan internasional.'),
    text('唐诗成为中国文学高峰。', 'táng shī chéng wéi zhōng guó wén xué gāo fēng', 'Tang poetry became a peak of Chinese literature.', 'Đường thi trở thành đỉnh cao văn học Trung Hoa.', 'กวีนิพนธ์ถังเป็นยอดสูงของวรรณกรรมจีน', 'Puisi Tang menjadi puncak sastra Tiongkok.'),
    text('安史之乱后唐朝由盛转衰。', 'ān shǐ zhī luàn hòu táng cháo yóu shèng zhuǎn shuāi', 'After the An Lushan Rebellion, Tang declined.', 'Sau loạn An Sử, nhà Đường chuyển từ thịnh sang suy.', 'หลังกบฏอันสื่อ ถังเริ่มจากรุ่งสู่เสื่อม', 'Setelah Pemberontakan An Lushan, Tang menurun.'),
  ],
  xuanzang: [
    text('玄奘生活在唐朝初年。', 'xuán zàng shēng huó zài táng cháo chū nián', 'Xuanzang lived in the early Tang.', 'Huyền Trang sống vào đầu thời Đường.', 'พระถังซัมจั๋งมีชีวิตในต้นราชวงศ์ถัง', 'Xuanzang hidup pada awal Dinasti Tang.'),
    text('他为了佛经原典前往印度。', 'tā wèi le fó jīng yuán diǎn qián wǎng yìn dù', 'He went to India for original Buddhist texts.', 'Ông đến Ấn Độ để tìm kinh Phật nguyên bản.', 'เขาไปอินเดียเพื่อค้นหาคัมภีร์พุทธต้นฉบับ', 'Ia pergi ke India mencari naskah Buddha asli.'),
    text('那烂陀寺是他重要的学习地点。', 'nà làn tuó sì shì tā zhòng yào de xué xí dì diǎn', 'Nalanda was an important place of study for him.', 'Nalanda là nơi học tập quan trọng của ông.', 'นาลันทาเป็นสถานที่ศึกษาสำคัญของเขา', 'Nalanda adalah tempat belajar penting baginya.'),
    text('他带回了大量佛经。', 'tā dài huí le dà liàng fó jīng', 'He brought back many Buddhist scriptures.', 'Ông mang về nhiều kinh Phật.', 'เขานำพระคัมภีร์กลับมาจำนวนมาก', 'Ia membawa pulang banyak kitab Buddha.'),
    text('大唐西域记记录了沿途见闻。', 'dà táng xī yù jì jì lù le yán tú jiàn wén', 'Great Tang Records on the Western Regions recorded what he saw.', 'Đại Đường Tây Vực Ký ghi lại điều ông thấy trên đường.', 'ต้าถังซีอวี่จี้บันทึกสิ่งที่เขาพบระหว่างทาง', 'Catatan Wilayah Barat Tang Agung merekam pengamatannya.'),
    text('西游记把真实旅程文学化了。', 'xī yóu jì bǎ zhēn shí lǚ chéng wén xué huà le', 'Journey to the West turned the real trip into literature.', 'Tây Du Ký văn học hóa hành trình có thật.', 'ไซอิ๋วทำให้การเดินทางจริงกลายเป็นวรรณกรรม', 'Perjalanan ke Barat mengubah perjalanan nyata menjadi sastra.'),
  ],
  song: [
    text('宋朝商业和城市经济非常活跃。', 'sòng cháo shāng yè hé chéng shì jīng jì fēi cháng huó yuè', 'Song commerce and urban economy were very active.', 'Thương mại và kinh tế đô thị thời Tống rất sôi động.', 'การค้าและเศรษฐกิจเมืองยุคซ่งคึกคักมาก', 'Perdagangan dan ekonomi kota Song sangat aktif.'),
    text('交子被视为早期纸币。', 'jiāo zǐ bèi shì wéi zǎo qī zhǐ bì', 'Jiaozi is seen as early paper money.', 'Giao tử được xem là tiền giấy sơ khai.', 'เจียวจื่อถูกมองว่าเป็นเงินกระดาษยุคแรก', 'Jiaozi dipandang sebagai uang kertas awal.'),
    text('科举扩大了士人官僚群体。', 'kē jǔ kuò dà le shì rén guān liáo qún tǐ', 'Exams expanded the scholar-official class.', 'Khoa cử mở rộng tầng lớp sĩ đại phu.', 'การสอบขยายชนชั้นขุนนางนักปราชญ์', 'Ujian memperluas kelas sarjana-pejabat.'),
    text('重文轻武限制了武将权力。', 'zhòng wén qīng wǔ xiàn zhì le wǔ jiàng quán lì', 'Valuing civil officials limited military commanders.', 'Trọng văn khinh võ hạn chế quyền võ tướng.', 'การเน้นพลเรือนจำกัดอำนาจแม่ทัพ', 'Mengutamakan sipil membatasi kuasa jenderal.'),
    text('辽、西夏和金长期施压。', 'liáo xī xià hé jīn cháng qī shī yā', 'Liao, Western Xia, and Jin exerted long pressure.', 'Liêu, Tây Hạ và Kim gây áp lực lâu dài.', 'เหลียว ซีเซี่ย และจินกดดันยาวนาน', 'Liao, Xia Barat, dan Jin memberi tekanan lama.'),
    text('宋词和绘画代表高度文化成就。', 'sòng cí hé huì huà dài biǎo gāo dù wén huà chéng jiù', 'Song lyrics and painting show high cultural achievement.', 'Tống từ và hội họa thể hiện thành tựu văn hóa cao.', 'กวีนิพนธ์ซ่งและจิตรกรรมแสดงความสำเร็จวัฒนธรรมสูง', 'Lirik Song dan lukisan menunjukkan capaian budaya tinggi.'),
  ],
  yuan: [
    text('成吉思汗统一了蒙古诸部。', 'chéng jí sī hán tǒng yī le měng gǔ zhū bù', 'Genghis Khan unified Mongol tribes.', 'Thành Cát Tư Hãn thống nhất các bộ Mông Cổ.', 'เจงกิสข่านรวมเผ่ามองโกล', 'Jenghis Khan menyatukan suku-suku Mongol.'),
    text('蒙古骑兵机动能力很强。', 'měng gǔ qí bīng jī dòng néng lì hěn qiáng', 'Mongol cavalry was highly mobile.', 'Kỵ binh Mông Cổ cơ động rất mạnh.', 'ทหารม้ามองโกลเคลื่อนที่ได้ยอดเยี่ยม', 'Kavaleri Mongol sangat lincah.'),
    text('忽必烈采用中原制度。', 'hū bì liè cǎi yòng zhōng yuán zhì dù', 'Kublai Khan adopted Central Plains institutions.', 'Hốt Tất Liệt dùng制度 Trung Nguyên.', 'กุบไลข่านใช้ระบบที่ราบกลางจีน', 'Kublai Khan mengadopsi lembaga Dataran Tengah.'),
    text('元朝定都大都。', 'yuán cháo dìng dū dà dū', 'Yuan set its capital at Dadu.', 'Nhà Nguyên đặt đô ở Đại Đô.', 'หยวนตั้งเมืองหลวงที่ต้าตู', 'Yuan menetapkan ibu kota di Dadu.'),
    text('南宋在1279年灭亡。', 'nán sòng zài yī èr qī jiǔ nián miè wáng', 'Southern Song fell in 1279.', 'Nam Tống diệt vong năm 1279.', 'ซ่งใต้ล่มสลายในปี 1279', 'Song Selatan runtuh pada 1279.'),
    text('马可波罗让欧洲认识元朝。', 'mǎ kě bō luó ràng ōu zhōu rèn shi yuán cháo', 'Marco Polo helped Europe know Yuan China.', 'Marco Polo giúp châu Âu biết đến nhà Nguyên.', 'มาร์โคโปโลทำให้ยุโรปรู้จักหยวน', 'Marco Polo membantu Eropa mengenal Yuan.'),
  ],
  zhengHe: [
    text('郑和是明朝航海家。', 'zhèng hé shì míng cháo háng hǎi jiā', 'Zheng He was a Ming navigator.', 'Trịnh Hòa là nhà hàng hải thời Minh.', 'เจิ้งเหอเป็นนักเดินเรือสมัยหมิง', 'Zheng He adalah navigator Ming.'),
    text('七次远航发生在1405到1433年。', 'qī cì yuǎn háng fā shēng zài yī sì líng wǔ dào yī sì sān sān nián', 'The seven voyages took place from 1405 to 1433.', 'Bảy chuyến đi diễn ra từ 1405 đến 1433.', 'เจ็ดครั้งเกิดระหว่างปี 1405 ถึง 1433', 'Tujuh pelayaran berlangsung dari 1405 sampai 1433.'),
    text('船队从南京和太仓出发。', 'chuán duì cóng nán jīng hé tài cāng chū fā', 'The fleet departed from Nanjing and Taicang.', 'Hạm đội xuất phát từ Nam Kinh và Thái Thương.', 'กองเรือออกจากหนานจิงและไท่ชาง', 'Armada berangkat dari Nanjing dan Taicang.'),
    text('马六甲是重要停靠点。', 'mǎ liù jiǎ shì zhòng yào tíng kào diǎn', 'Malacca was an important stop.', 'Malacca là điểm dừng quan trọng.', 'มะละกาเป็นจุดแวะสำคัญ', 'Malaka adalah persinggahan penting.'),
    text('船队到过印度洋沿岸。', 'chuán duì dào guò yìn dù yáng yán àn', 'The fleet reached Indian Ocean coasts.', 'Hạm đội từng đến ven Ấn Độ Dương.', 'กองเรือถึงชายฝั่งมหาสมุทรอินเดีย', 'Armada mencapai pesisir Samudra Hindia.'),
    text('郑和航行推动了海上交流。', 'zhèng hé háng xíng tuī dòng le hǎi shàng jiāo liú', 'Zheng He’s voyages promoted maritime exchange.', 'Các chuyến đi của Trịnh Hòa thúc đẩy giao lưu biển.', 'การเดินเรือของเจิ้งเหอส่งเสริมการแลกเปลี่ยนทางทะเล', 'Pelayaran Zheng He mendorong pertukaran maritim.'),
  ],
  seaBan: [
    text('明初海禁与倭寇威胁有关。', 'míng chū hǎi jìn yǔ wō kòu wēi xié yǒu guān', 'Early Ming bans related to wokou piracy.', 'Hải cấm đầu Minh liên quan uy hiếp Oa khấu.', 'ห้ามทะเลต้นหมิงเกี่ยวกับภัยโจรสลัดวอโค่ว', 'Larangan awal Ming terkait ancaman bajak laut wokou.'),
    text('官方贸易依赖朝贡体系。', 'guān fāng mào yì yī lài cháo gòng tǐ xì', 'Official trade relied on the tribute system.', 'Thương mại chính thức dựa vào hệ thống triều cống.', 'การค้าอย่างเป็นทางการพึ่งระบบบรรณาการ', 'Perdagangan resmi bergantung pada sistem upeti.'),
    text('民间贸易常被严格限制。', 'mín jiān mào yì cháng bèi yán gé xiàn zhì', 'Private trade was often tightly restricted.', 'Thương mại dân gian thường bị hạn chế nghiêm ngặt.', 'การค้าเอกชนมักถูกจำกัดเข้มงวด', 'Perdagangan swasta sering dibatasi ketat.'),
    text('清初迁界影响沿海居民。', 'qīng chū qiān jiè yǐng xiǎng yán hǎi jū mín', 'Early Qing coastal relocation affected residents.', 'Dời ranh đầu Thanh ảnh hưởng cư dân ven biển.', 'การย้ายเขตต้นชิงกระทบชาวชายฝั่ง', 'Relokasi pesisir awal Qing memengaruhi penduduk.'),
    text('广州一口通商是清代重要制度。', 'guǎng zhōu yī kǒu tōng shāng shì qīng dài zhòng yào zhì dù', 'The Canton System was important in Qing trade.', 'Nhất khẩu Quảng Châu là制度 thương mại quan trọng thời Thanh.', 'ระบบค้าผ่านกว่างโจวเป็น制度สำคัญสมัยชิง', 'Sistem Canton penting dalam perdagangan Qing.'),
    text('海禁并不等于完全没有海上交流。', 'hǎi jìn bìng bù děng yú wán quán méi yǒu hǎi shàng jiāo liú', 'Sea bans did not mean all maritime exchange stopped.', 'Hải cấm không có nghĩa là hết giao lưu biển.', 'ห้ามทะเลไม่ได้แปลว่าไม่มีการแลกเปลี่ยนทางทะเลเลย', 'Larangan laut tidak berarti semua pertukaran maritim berhenti.'),
  ],
  opiumWar: [
    text('战争爆发前中英贸易矛盾加深。', 'zhàn zhēng bào fā qián zhōng yīng mào yì máo dùn jiā shēn', 'Before the war, Sino-British trade tensions deepened.', 'Trước chiến tranh, mâu thuẫn thương mại Trung-Anh sâu hơn.', 'ก่อนสงคราม ความตึงเครียดการค้าจีน-อังกฤษเพิ่มขึ้น', 'Sebelum perang, ketegangan dagang Tiongkok-Inggris meningkat.'),
    text('林则徐在广州禁烟。', 'lín zé xú zài guǎng zhōu jìn yān', 'Lin Zexu suppressed opium in Guangzhou.', 'Lâm Tắc Từ cấm nha phiến ở Quảng Châu.', 'หลินเจ๋อสวีปราบฝิ่นที่กว่างโจว', 'Lin Zexu menindak opium di Guangzhou.'),
    text('虎门销烟是重要导火索。', 'hǔ mén xiāo yān shì zhòng yào dǎo huǒ suǒ', 'The destruction of opium at Humen was a major trigger.', 'Tiêu hủy nha phiến ở Hổ Môn là mồi lửa lớn.', 'การทำลายฝิ่นที่หู่เหมินเป็นชนวนสำคัญ', 'Penghancuran opium di Humen menjadi pemicu utama.'),
    text('英国舰队利用海军优势进攻。', 'yīng guó jiàn duì lì yòng hǎi jūn yōu shì jìn gōng', 'The British fleet attacked with naval superiority.', 'Hạm đội Anh tấn công bằng ưu thế hải quân.', 'กองเรืออังกฤษโจมตีด้วยความเหนือกว่าทางทะเล', 'Armada Inggris menyerang dengan keunggulan laut.'),
    text('南京条约在1842年签订。', 'nán jīng tiáo yuē zài yī bā sì èr nián qiān dìng', 'The Treaty of Nanjing was signed in 1842.', 'Hiệp ước Nam Kinh ký năm 1842.', 'สนธิสัญญานานกิงลงนามในปี 1842', 'Perjanjian Nanjing ditandatangani pada 1842.'),
    text('鸦片战争常被视为中国近代史开端。', 'yā piàn zhàn zhēng cháng bèi shì wéi zhōng guó jìn dài shǐ kāi duān', 'The Opium War is often seen as the start of modern Chinese history.', 'Chiến tranh Nha phiến thường được xem là mở đầu cận đại Trung Quốc.', 'สงครามฝิ่นมักถูกมองว่าเป็นจุดเริ่มประวัติศาสตร์จีนสมัยใหม่', 'Perang Candu sering dipandang sebagai awal sejarah modern Tiongkok.'),
  ],
};

const cuisineArticles = [
  article('cui-001', '01-eight-chinese-cuisines', 'bā dà cài xì shì nǎ bā gè', title('八大菜系是哪八个？', 'What Are the Eight Chinese Cuisines?', 'Tám trường phái ẩm thực Trung Quốc là gì?', 'อาหารจีนแปดสายมีอะไรบ้าง?', 'Apa Saja Delapan Masakan Tiongkok?'),
    text('八大菜系通常指鲁菜、川菜、粤菜、苏菜、闽菜、浙菜、湘菜和徽菜。', 'bā dà cài xì tōng cháng zhǐ lǔ cài chuān cài yuè cài sū cài mǐn cài zhè cài xiāng cài hé huī cài', 'The Eight Chinese Cuisines usually mean Shandong, Sichuan, Cantonese, Jiangsu, Fujian, Zhejiang, Hunan, and Anhui cuisines.', 'Tám trường phái ẩm thực Trung Quốc thường gồm Sơn Đông, Tứ Xuyên, Quảng Đông, Giang Tô, Phúc Kiến, Chiết Giang, Hồ Nam và An Huy.', 'อาหารจีนแปดสายมักหมายถึงซานตง เสฉวน กวางตุ้ง เจียงซู ฝูเจี้ยน เจ้อเจียง หูหนาน และอันฮุย', 'Delapan masakan Tiongkok biasanya mencakup Shandong, Sichuan, Kanton, Jiangsu, Fujian, Zhejiang, Hunan, dan Anhui.'),
    text('八大菜系', 'bā dà cài xì', 'the Eight Chinese Cuisines', 'tám trường phái ẩm thực', 'อาหารจีนแปดสาย', 'delapan masakan Tiongkok'), text('一张从北方宴席到南方茶楼的餐桌地图', 'yī zhāng cóng běi fāng yàn xí dào nán fāng chá lóu de cān zhuō dì tú', 'a dining map from northern banquets to southern teahouses', 'bản đồ bàn ăn từ tiệc miền bắc đến trà lâu miền nam', 'แผนที่โต๊ะอาหารจากงานเลี้ยงเหนือถึงโรงน้ำชาภาคใต้', 'peta meja makan dari jamuan utara ke rumah teh selatan'), text('一桌菜同时摆出不同地方味道的场景', 'yī zhuō cài tóng shí bǎi chū bù tóng dì fāng wèi dào de chǎng jǐng', 'a table showing flavors from different regions at once', 'một bàn ăn bày cùng lúc hương vị nhiều vùng', 'โต๊ะหนึ่งที่วางรสชาติจากหลายพื้นที่พร้อมกัน', 'satu meja yang menampilkan rasa dari berbagai daerah'), () => cuisineFacts.eightCuisines, ['鲁菜', '川菜', '粤菜', '苏菜', '闽菜', '浙菜'], kw(['八大菜系', '中国菜系'], ['eight Chinese cuisines', 'Chinese regional cuisine'])),
  article('cui-002', '02-sichuan-mala-origin', 'chuān cài de má là cóng nǎ r lái', title('川菜的麻辣从哪儿来？', 'Where Does Sichuan Mala Come From?', 'Vị tê cay Tứ Xuyên đến từ đâu?', 'รสหมาล่าเสฉวนมาจากไหน?', 'Dari Mana Rasa Mala Sichuan?'),
    text('川菜的麻辣主要来自花椒的麻感、辣椒的辣味和四川盆地的饮食习惯。', 'chuān cài de má là zhǔ yào lái zì huā jiāo de má gǎn là jiāo de là wèi hé sì chuān pén dì de yǐn shí xí guàn', 'Sichuan mala mainly comes from Sichuan peppercorns, chili heat, and eating habits in the Sichuan Basin.', 'Vị tê cay Tứ Xuyên chủ yếu đến từ hoa tiêu, ớt và thói quen ăn uống ở bồn địa Tứ Xuyên.', 'รสหมาล่าเสฉวนมาจากพริกฮวาเจียว พริกเผ็ด และนิสัยการกินในแอ่งเสฉวน', 'Rasa mala Sichuan terutama berasal dari lada Sichuan, cabai, dan kebiasaan makan di Cekungan Sichuan.'),
    text('川菜麻辣', 'chuān cài má là', 'Sichuan mala', 'vị tê cay Tứ Xuyên', 'หมาล่าเสฉวน', 'mala Sichuan'), text('成都小馆和潮湿盆地里的厨房', 'chéng dū xiǎo guǎn hé cháo shī pén dì lǐ de chú fáng', 'small Chengdu eateries and kitchens in a humid basin', 'quán nhỏ Thành Đô và căn bếp trong bồn địa ẩm', 'ร้านเล็กเฉิงตูและครัวในแอ่งชื้น', 'kedai kecil Chengdu dan dapur di cekungan lembap'), text('热锅里花椒和辣椒香气升起来的瞬间', 'rè guō lǐ huā jiāo hé là jiāo xiāng qì shēng qǐ lái de shùn jiān', 'the moment peppercorn and chili aroma rises from a hot wok', 'khoảnh khắc hương hoa tiêu và ớt bốc lên từ chảo nóng', 'ช่วงที่กลิ่นฮวาเจียวและพริกลอยขึ้นจากกระทะร้อน', 'saat aroma lada Sichuan dan cabai naik dari wajan panas'), () => cuisineFacts.mala, ['花椒', '辣椒', '豆瓣酱', '四川盆地', '麻婆豆腐', '四川火锅'], kw(['川菜麻辣', '花椒'], ['Sichuan mala', 'Sichuan peppercorn'])),
  article('cui-003', '03-cantonese-freshness', 'yuè cài wèi shén me jiǎng jiū xiān', title('粤菜为什么讲究鲜？', 'Why Cantonese Cuisine Values Freshness', 'Vì sao món Quảng Đông coi trọng độ tươi?', 'ทำไมอาหารกวางตุ้งเน้นความสด?', 'Mengapa Masakan Kanton Menekankan Kesegaran?'),
    text('粤菜讲究鲜，是因为岭南物产丰富、海鲜常见，并重视保留食材本味。', 'yuè cài jiǎng jiū xiān shì yīn wèi lǐng nán wù chǎn fēng fù hǎi xiān cháng jiàn bìng zhòng shì bǎo liú shí cái běn wèi', 'Cantonese cuisine values freshness because Lingnan has rich ingredients, common seafood, and a tradition of preserving original flavor.', 'Ẩm thực Quảng Đông coi trọng độ tươi vì Lĩnh Nam có nhiều sản vật, hải sản phổ biến và chuộng vị nguyên bản.', 'อาหารกวางตุ้งเน้นความสดเพราะหลิงหนานมีวัตถุดิบหลากหลาย อาหารทะเลพบมาก และให้ค่ารสเดิม', 'Masakan Kanton menekankan kesegaran karena Lingnan kaya bahan, seafood umum, dan tradisinya menjaga rasa asli.'),
    text('粤菜鲜味', 'yuè cài xiān wèi', 'Cantonese freshness', 'độ tươi của món Quảng Đông', 'ความสดของอาหารกวางตุ้ง', 'kesegaran Kanton'), text('岭南海岸和广州茶楼之间', 'lǐng nán hǎi àn hé guǎng zhōu chá lóu zhī jiān', 'between the Lingnan coast and Guangzhou teahouses', 'giữa bờ biển Lĩnh Nam và trà lâu Quảng Châu', 'ระหว่างชายฝั่งหลิงหนานกับโรงน้ำชากว่างโจว', 'antara pesisir Lingnan dan rumah teh Guangzhou'), text('一条清蒸鱼端上桌、热气刚刚散开的画面', 'yī tiáo qīng zhēng yú duān shàng zhuō rè qì gāng gāng sàn kāi de huà miàn', 'a steamed fish arriving as steam begins to spread', 'cảnh cá hấp vừa lên bàn, hơi nóng tỏa ra', 'ภาพปลานึ่งขึ้นโต๊ะพร้อมไอน้ำค่อย ๆ กระจาย', 'ikan kukus tersaji saat uap mulai menyebar'), () => cuisineFacts.cantonese, ['粤菜', '岭南', '清蒸鱼', '早茶', '点心', '烧味'], kw(['粤菜鲜味', '广东菜'], ['Cantonese freshness', 'Cantonese cuisine'])),
  article('cui-004', '04-shandong-banquet-base', 'lǔ cài shì zhōng guó yàn xí de jī chǔ ma', title('鲁菜是中国宴席的基础吗？', 'Is Shandong Cuisine a Base of Chinese Banquets?', 'Ẩm thực Sơn Đông có phải nền tảng tiệc Trung Quốc không?', 'อาหารซานตงเป็นฐานงานเลี้ยงจีนหรือไม่?', 'Apakah Masakan Shandong Dasar Jamuan Tiongkok?'),
    text('鲁菜常被看作中国北方宴席的重要基础，因为它重汤、重火候，也影响宫廷和宴会菜。', 'lǔ cài cháng bèi kàn zuò zhōng guó běi fāng yàn xí de zhòng yào jī chǔ yīn wèi tā zhòng tāng zhòng huǒ hòu yě yǐng xiǎng gōng tíng hé yàn huì cài', 'Shandong cuisine is often seen as a base for northern Chinese banquets because it values stock, heat control, and banquet technique.', 'Ẩm thực Sơn Đông thường được xem là nền tảng tiệc miền bắc vì coi trọng nước dùng, lửa và kỹ thuật tiệc.', 'อาหารซานตงมักถูกมองว่าเป็นฐานงานเลี้ยงจีนเหนือ เพราะเน้นน้ำซุป ไฟ และเทคนิคงานเลี้ยง', 'Masakan Shandong sering dipandang sebagai dasar jamuan Tiongkok utara karena menekankan kaldu, api, dan teknik perjamuan.'),
    text('鲁菜宴席技法', 'lǔ cài yàn xí jì fǎ', 'Shandong banquet technique', 'kỹ thuật tiệc Sơn Đông', 'เทคนิคงานเลี้ยงซานตง', 'teknik jamuan Shandong'), text('山东厨房和北方宴席之间', 'shān dōng chú fáng hé běi fāng yàn xí zhī jiān', 'between Shandong kitchens and northern banquets', 'giữa bếp Sơn Đông và tiệc miền bắc', 'ระหว่างครัวซานตงกับงานเลี้ยงเหนือ', 'antara dapur Shandong dan jamuan utara'), text('一锅高汤慢慢吊出清亮味道的场景', 'yī guō gāo tāng màn man diào chū qīng liàng wèi dào de chǎng jǐng', 'a pot of stock slowly drawing out a clear flavor', 'cảnh nồi nước dùng dần tạo vị trong sáng', 'ภาพหม้อน้ำซุปค่อย ๆ ดึงรสใสออกมา', 'panci kaldu perlahan mengeluarkan rasa jernih'), () => cuisineFacts.shandong, ['鲁菜', '山东', '高汤', '葱烧海参', '九转大肠', '北京宴席'], kw(['鲁菜', '中国宴席'], ['Shandong cuisine', 'Chinese banquet food'])),
  article('cui-005', '05-peking-duck-how-to-eat', 'běi jīng kǎo yā zěn me chī cái dì dào', title('北京烤鸭怎么吃才地道？', 'How Do You Eat Peking Duck Properly?', 'Ăn vịt quay Bắc Kinh thế nào cho đúng?', 'กินเป็ดปักกิ่งอย่างไรให้ถูกแบบ?', 'Bagaimana Cara Makan Bebek Peking yang Autentik?'),
    text('北京烤鸭通常配薄饼、葱丝、黄瓜条和甜面酱一起卷着吃。', 'běi jīng kǎo yā tōng cháng pèi báo bǐng cōng sī huáng guā tiáo hé tián miàn jiàng yī qǐ juǎn zhe chī', 'Peking duck is usually eaten wrapped in thin pancakes with scallion, cucumber, and sweet bean sauce.', 'Vịt quay Bắc Kinh thường được cuốn với bánh mỏng, hành thái, dưa chuột và tương ngọt.', 'เป็ดปักกิ่งมักกินโดยห่อแป้งบางกับต้นหอม แตงกวา และซอสหวาน', 'Bebek Peking biasanya dimakan dengan pancake tipis, daun bawang, mentimun, dan saus manis.'),
    text('北京烤鸭吃法', 'běi jīng kǎo yā chī fǎ', 'how to eat Peking duck', 'cách ăn vịt quay Bắc Kinh', 'วิธีกินเป็ดปักกิ่ง', 'cara makan bebek Peking'), text('北京餐馆的片鸭桌边', 'běi jīng cān guǎn de piàn yā zhuō biān', 'the carving table in a Beijing restaurant', 'bên bàn thái vịt ở nhà hàng Bắc Kinh', 'ข้างโต๊ะแล่เป็ดในร้านปักกิ่ง', 'meja iris bebek di restoran Beijing'), text('师傅片鸭、薄饼摊开、酱香靠近的画面', 'shī fu piàn yā báo bǐng tān kāi jiàng xiāng kào jìn de huà miàn', 'the cook slicing duck as pancakes open and sauce aroma comes close', 'cảnh đầu bếp thái vịt, bánh mỏng mở ra và hương xốt lan tới', 'ภาพช่างแล่เป็ด แผ่นแป้งแผ่ออก และกลิ่นซอสเข้ามาใกล้', 'juru masak mengiris bebek saat pancake terbuka dan aroma saus mendekat'), () => cuisineFacts.pekingDuck, ['北京烤鸭', '薄饼', '甜面酱', '葱丝', '全聚德', '北京'], kw(['北京烤鸭', '烤鸭怎么吃'], ['Peking duck', 'how to eat Peking duck'])),
  article('cui-006', '06-hot-pot-north-south-differences', 'huǒ guō de nán běi chā yì shì shén me', title('火锅的南北差异是什么？', 'What Are North-South Hot Pot Differences?', 'Lẩu miền bắc và miền nam Trung Quốc khác gì?', 'หม้อไฟเหนือใต้ของจีนต่างกันอย่างไร?', 'Apa Beda Hot Pot Utara dan Selatan?'),
    text('火锅的南北差异主要体现在锅底、蘸料、食材和吃法节奏上。', 'huǒ guō de nán běi chā yì zhǔ yào tǐ xiàn zài guō dǐ zhàn liào shí cái hé chī fǎ jié zòu shàng', 'North-south hot pot differences mainly appear in soup base, dipping sauce, ingredients, and eating rhythm.', 'Khác biệt lẩu bắc nam chủ yếu nằm ở nước lẩu, nước chấm, nguyên liệu và nhịp ăn.', 'ความต่างหม้อไฟเหนือใต้หลัก ๆ อยู่ที่น้ำซุป น้ำจิ้ม วัตถุดิบ และจังหวะการกิน', 'Perbedaan hot pot utara-selatan terutama ada pada kuah, saus celup, bahan, dan ritme makan.'),
    text('火锅南北差异', 'huǒ guō nán běi chā yì', 'north-south hot pot differences', 'khác biệt lẩu bắc nam', 'ความต่างหม้อไฟเหนือใต้', 'perbedaan hot pot utara-selatan'), text('北京铜锅、重庆红锅和潮汕清汤之间', 'běi jīng tóng guō chóng qìng hóng guō hé cháo shàn qīng tāng zhī jiān', 'between Beijing copper pots, Chongqing red pots, and Chaoshan clear broth', 'giữa nồi đồng Bắc Kinh, nồi đỏ Trùng Khánh và nước trong Triều Sán', 'ระหว่างหม้อทองแดงปักกิ่ง หม้อแดงฉงชิ่ง และน้ำใสเฉาซ่าน', 'antara panci tembaga Beijing, kuah merah Chongqing, dan kaldu bening Chaoshan'), text('一桌人围着锅等食材翻滚的场景', 'yī zhuō rén wéi zhe guō děng shí cái fān gǔn de chǎng jǐng', 'people around one pot waiting for ingredients to roll in the broth', 'cảnh cả bàn người quanh nồi chờ nguyên liệu sôi lên', 'ภาพคนทั้งโต๊ะล้อมหม้อรอวัตถุดิบเดือด', 'orang satu meja mengelilingi panci menunggu bahan bergolak'), () => cuisineFacts.hotPot, ['火锅', '锅底', '蘸料', '涮羊肉', '四川火锅', '潮汕牛肉火锅'], kw(['火锅南北差异', '中国火锅'], ['Chinese hot pot', 'Sichuan hot pot'])),
  article('cui-007', '07-guangdong-dim-sum-must-order', 'guǎng dōng zǎo chá yǒu nǎ xiē bì diǎn', title('广东早茶有哪些必点？', 'What Dim Sum Should You Order at Cantonese Morning Tea?', 'Trà sáng Quảng Đông nên gọi món gì?', 'หยำฉ่ากวางตุ้งควรสั่งอะไร?', 'Apa yang Wajib Dipesan Saat Yum Cha Kanton?'),
    text('广东早茶常见必点包括虾饺、烧卖、叉烧包、肠粉和蛋挞。', 'guǎng dōng zǎo chá cháng jiàn bì diǎn bāo kuò xiā jiǎo shāo mài chā shāo bāo cháng fěn hé dàn tà', 'Common Cantonese morning tea must-orders include shrimp dumplings, shumai, barbecue pork buns, rice rolls, and egg tarts.', 'Các món nên gọi trong trà sáng Quảng Đông gồm há cảo tôm, xíu mại, bánh bao xá xíu, bánh cuốn và tart trứng.', 'เมนูควรสั่งในหยำฉ่ากวางตุ้งมีฮะเก๋า ขนมจีบ ซาลาเปาหมูแดง ก๋วยเตี๋ยวหลอด และทาร์ตไข่', 'Pesanan umum saat yum cha Kanton meliputi hakau, shumai, bakpao char siu, rice roll, dan tart telur.'),
    text('广东早茶点心', 'guǎng dōng zǎo chá diǎn xīn', 'Cantonese morning tea dim sum', 'dim sum trà sáng Quảng Đông', 'ติ่มซำหยำฉ่ากวางตุ้ง', 'dim sum yum cha Kanton'), text('广州茶楼和一笼笼点心之间', 'guǎng zhōu chá lóu hé yī lóng lóng diǎn xīn zhī jiān', 'between Guangzhou teahouses and baskets of dim sum', 'giữa trà lâu Quảng Châu và từng xửng dim sum', 'ระหว่างโรงน้ำชากว่างโจวกับติ่มซำเป็นเข่ง ๆ', 'antara rumah teh Guangzhou dan keranjang dim sum'), text('茶壶上桌、蒸笼打开、点心热气升起的早晨', 'chá hú shàng zhuō zhēng lóng dǎ kāi diǎn xīn rè qì shēng qǐ de zǎo chén', 'a morning when the teapot arrives, baskets open, and dim sum steam rises', 'buổi sáng ấm trà lên bàn, xửng mở ra, hơi dim sum bốc lên', 'เช้าที่กาน้ำชาขึ้นโต๊ะ เข่งเปิด และไอติ่มซำลอยขึ้น', 'pagi ketika teko teh datang, keranjang terbuka, dan uap dim sum naik'), () => cuisineFacts.dimSum, ['早茶', '虾饺', '烧卖', '叉烧包', '肠粉', '蛋挞'], kw(['广东早茶', '点心'], ['Cantonese dim sum', 'yum cha order'])),
  article('cui-008', '08-lanzhou-beef-noodles', 'lán zhōu niú ròu miàn de yī qīng èr bái shì shén me', title('兰州牛肉面的一清二白是什么？', 'What Does Yi Qing Er Bai Mean in Lanzhou Beef Noodles?', 'Nhất thanh nhị bạch trong mì bò Lan Châu là gì?', 'อีชิงเอ้อร์ไป๋ของบะหมี่เนื้อหลานโจวคืออะไร?', 'Apa Arti Yi Qing Er Bai pada Mi Sapi Lanzhou?'),
    text('兰州牛肉面的一清二白通常指汤清、萝卜白，并与红油、绿蒜苗、黄面条一起构成颜色标准。', 'lán zhōu niú ròu miàn de yī qīng èr bái tōng cháng zhǐ tāng qīng luó bo bái bìng yǔ hóng yóu lǜ suàn miáo huáng miàn tiáo yī qǐ gòu chéng yán sè biāo zhǔn', 'In Lanzhou beef noodles, yi qing er bai usually means clear broth and white radish, forming a color standard with red chili oil, green garlic sprouts, and yellow noodles.', 'Trong mì bò Lan Châu, nhất thanh nhị bạch thường chỉ nước trong và củ cải trắng, cùng dầu đỏ, mầm tỏi xanh và mì vàng tạo thành chuẩn màu.', 'ในบะหมี่เนื้อหลานโจว อีชิงเอ้อร์ไป๋มักหมายถึงน้ำซุปใสและหัวไชเท้าขาว รวมกับน้ำมันแดง ต้นกระเทียมเขียว และเส้นเหลือง', 'Pada mi sapi Lanzhou, yi qing er bai biasanya berarti kuah jernih dan lobak putih, bersama minyak merah, daun bawang hijau, dan mi kuning membentuk standar warna.'),
    text('兰州牛肉面颜色口诀', 'lán zhōu niú ròu miàn yán sè kǒu jué', 'the color formula of Lanzhou beef noodles', 'câu nhớ màu của mì bò Lan Châu', 'สูตรจำสีของบะหมี่เนื้อหลานโจว', 'rumus warna mi sapi Lanzhou'), text('兰州面馆的案板、汤锅和拉面师傅之间', 'lán zhōu miàn guǎn de àn bǎn tāng guō hé lā miàn shī fu zhī jiān', 'between the board, broth pot, and noodle puller in a Lanzhou shop', 'giữa thớt, nồi nước và thợ kéo mì ở quán Lan Châu', 'ระหว่างเขียง หม้อน้ำซุป และช่างดึงเส้นในร้านหลานโจว', 'antara papan, panci kuah, dan pembuat mi tarik di kedai Lanzhou'), text('面条入碗、清汤透亮、红油点开的画面', 'miàn tiáo rù wǎn qīng tāng tòu liàng hóng yóu diǎn kāi de huà miàn', 'noodles entering the bowl, clear broth shining, and red oil spreading', 'cảnh mì vào bát, nước trong sáng và dầu đỏ lan ra', 'ภาพเส้นลงชาม น้ำซุปใสวาว และน้ำมันแดงกระจาย', 'mi masuk mangkuk, kuah jernih bersinar, dan minyak merah menyebar'), () => cuisineFacts.lanzhou, ['兰州牛肉面', '牛肉汤', '萝卜', '辣椒油', '蒜苗', '拉面'], kw(['兰州牛肉面', '一清二白'], ['Lanzhou beef noodles', 'yi qing er bai'])),
  article('cui-009', '09-shengjian-vs-xiaolongbao', 'shàng hǎi shēng jiān bāo hé xiǎo lóng bāo yǒu shén me bù yī yàng', title('上海生煎包和小笼包有什么不一样？', 'How Are Shengjianbao and Xiaolongbao Different?', 'Bánh sinh chiên Thượng Hải khác tiểu long bao thế nào?', 'เซิงเจียนเปากับเสี่ยวหลงเปาต่างกันอย่างไร?', 'Apa Bedanya Shengjianbao dan Xiaolongbao?'),
    text('生煎包是煎出来的带脆底包子，小笼包是蒸出来的带汤汁小包。', 'shēng jiān bāo shì jiān chū lái de dài cuì dǐ bāo zi xiǎo lóng bāo shì zhēng chū lái de dài tāng zhī xiǎo bāo', 'Shengjianbao is pan-fried with a crispy bottom, while xiaolongbao is steamed and filled with soup.', 'Sinh chiên bao được áp chảo có đáy giòn, còn tiểu long bao được hấp và có nước súp bên trong.', 'เซิงเจียนเปาทอดจนก้นกรอบ ส่วนเสี่ยวหลงเปานึ่งและมีน้ำซุปด้านใน', 'Shengjianbao digoreng dengan dasar renyah, sedangkan xiaolongbao dikukus dan berisi kuah.'),
    text('生煎包和小笼包的区别', 'shēng jiān bāo hé xiǎo lóng bāo de qū bié', 'the difference between shengjianbao and xiaolongbao', 'khác biệt giữa sinh chiên bao và tiểu long bao', 'ความต่างระหว่างเซิงเจียนเปากับเสี่ยวหลงเปา', 'perbedaan shengjianbao dan xiaolongbao'), text('上海街边锅和小蒸笼之间', 'shàng hǎi jiē biān guō hé xiǎo zhēng lóng zhī jiān', 'between a Shanghai street pan and a small steamer', 'giữa chảo ven đường Thượng Hải và xửng nhỏ', 'ระหว่างกระทะริมถนนเซี่ยงไฮ้กับเข่งนึ่งเล็ก', 'antara wajan jalanan Shanghai dan kukusan kecil'), text('锅底滋滋作响、蒸笼冒出热气的早晨', 'guō dǐ zī zī zuò xiǎng zhēng lóng mào chū rè qì de zǎo chén', 'a morning with a sizzling pan bottom and steam rising from baskets', 'buổi sáng đáy chảo xèo xèo và xửng bốc hơi', 'เช้าที่ก้นกระทะดังฉ่าและเข่งมีไอน้ำลอย', 'pagi dengan dasar wajan mendesis dan uap naik dari keranjang'), () => cuisineFacts.shanghaiBuns, ['生煎包', '小笼包', '上海', '汤包', '蒸笼', '脆底'], kw(['生煎包 小笼包 区别', '上海小吃'], ['shengjianbao vs xiaolongbao', 'Shanghai street food'])),
  article('cui-010', '10-mapo-tofu-origin', 'má pó dòu fu shì shuí fā míng de', title('麻婆豆腐是谁发明的？', 'Who Invented Mapo Tofu?', 'Ai đã tạo ra đậu phụ Mapo?', 'ใครคิดค้นเต้าหู้หม่าโผ?', 'Siapa yang Menciptakan Mapo Tofu?'),
    text('麻婆豆腐通常被认为源自成都一家陈姓店主经营的小饭铺。', 'má pó dòu fu tōng cháng bèi rèn wéi yuán zì chéng dū yī jiā chén xìng diàn zhǔ jīng yíng de xiǎo fàn pù', 'Mapo tofu is usually traced to a small Chengdu eatery run by a shop owner surnamed Chen.', 'Đậu phụ Mapo thường được cho là bắt nguồn từ một quán ăn nhỏ ở Thành Đô do chủ họ Trần mở.', 'เต้าหู้หม่าโผมักถูกเล่าว่ามาจากร้านอาหารเล็กในเฉิงตูของเจ้าของแซ่เฉิน', 'Mapo tofu biasanya ditelusuri ke kedai kecil di Chengdu yang dikelola pemilik bermarga Chen.'),
    text('麻婆豆腐由来', 'má pó dòu fu yóu lái', 'the origin of mapo tofu', 'nguồn gốc đậu phụ Mapo', 'ที่มาเต้าหู้หม่าโผ', 'asal mapo tofu'), text('成都街巷的小饭铺和热锅旁', 'chéng dū jiē xiàng de xiǎo fàn pù hé rè guō páng', 'a small Chengdu eatery beside a hot wok', 'một quán nhỏ Thành Đô bên chảo nóng', 'ร้านเล็กในตรอกเฉิงตูข้างกระทะร้อน', 'kedai kecil Chengdu di samping wajan panas'), text('豆腐入锅、红油翻动、花椒香气散开的画面', 'dòu fu rù guō hóng yóu fān dòng huā jiāo xiāng qì sàn kāi de huà miàn', 'tofu entering the wok as red oil moves and peppercorn aroma spreads', 'cảnh đậu phụ vào chảo, dầu đỏ chuyển động và hương hoa tiêu lan ra', 'ภาพเต้าหู้ลงกระทะ น้ำมันแดงเคลื่อนไหว และกลิ่นฮวาเจียวกระจาย', 'tahu masuk wajan saat minyak merah bergerak dan aroma lada menyebar'), () => cuisineFacts.mapoTofu, ['麻婆豆腐', '成都', '陈麻婆', '豆腐', '郫县豆瓣', '花椒'], kw(['麻婆豆腐', '麻婆豆腐由来'], ['mapo tofu origin', 'Sichuan tofu dish'])),
  article('cui-011', '11-six-types-of-chinese-tea', 'zhōng guó rén hē chá de liù dà lèi chá', title('中国人喝茶的六大类茶', 'The Six Main Types of Chinese Tea', 'Sáu loại trà chính của Trung Quốc', 'ชาจีนหกประเภทหลัก', 'Enam Jenis Utama Teh Tiongkok'),
    text('中国茶常按工艺分为绿茶、白茶、黄茶、青茶、红茶和黑茶六大类。', 'zhōng guó chá cháng àn gōng yì fēn wéi lǜ chá bái chá huáng chá qīng chá hóng chá hé hēi chá liù dà lèi', 'Chinese tea is often grouped by processing into green, white, yellow, oolong, black, and dark tea.', 'Trà Trung Quốc thường được chia theo quy trình thành trà xanh, trắng, vàng, ô long, đỏ và hắc trà.', 'ชาจีนมักแบ่งตามกรรมวิธีเป็นชาเขียว ชาขาว ชาเหลือง ชาอู่หลง ชาดำจีน และชาหมักเข้ม', 'Teh Tiongkok sering dikelompokkan menurut proses menjadi teh hijau, putih, kuning, oolong, hitam, dan dark tea.'),
    text('中国茶六大类', 'zhōng guó chá liù dà lèi', 'six main types of Chinese tea', 'sáu loại trà Trung Quốc', 'ชาจีนหกประเภท', 'enam jenis teh Tiongkok'), text('茶山、茶坊和一只热水壶之间', 'chá shān chá fāng hé yī zhī rè shuǐ hú zhī jiān', 'between tea mountains, tea workshops, and a kettle', 'giữa núi trà, xưởng trà và ấm nước nóng', 'ระหว่างภูเขาชา โรงทำชา และกาน้ำร้อน', 'antara gunung teh, bengkel teh, dan ketel air panas'), text('茶叶遇水舒展、香气慢慢出来的画面', 'chá yè yù shuǐ shū zhǎn xiāng qì màn man chū lái de huà miàn', 'tea leaves opening in water as aroma slowly appears', 'cảnh lá trà nở trong nước và hương dần hiện ra', 'ภาพใบชาคลี่ในน้ำและกลิ่นค่อย ๆ ออกมา', 'daun teh terbuka dalam air saat aroma perlahan muncul'), () => cuisineFacts.tea, ['绿茶', '白茶', '黄茶', '乌龙茶', '红茶', '黑茶'], kw(['中国茶六大类', '茶文化'], ['six types of Chinese tea', 'Chinese tea guide'])),
  article('cui-012', '12-mooncake-sweet-salty', 'yuè bǐng wèi shén me yǒu tián xián liǎng pài', title('月饼为什么有甜咸两派？', 'Why Are Some Mooncakes Sweet and Others Salty?', 'Vì sao bánh trung thu có loại ngọt và mặn?', 'ทำไมขนมไหว้พระจันทร์มีทั้งหวานและเค็ม?', 'Mengapa Kue Bulan Ada yang Manis dan Asin?'),
    text('月饼有甜咸两派，主要因为地区口味、馅料传统和节日消费习惯不同。', 'yuè bǐng yǒu tián xián liǎng pài zhǔ yào yīn wèi dì qū kǒu wèi xiàn liào chuán tǒng hé jié rì xiāo fèi xí guàn bù tóng', 'Mooncakes can be sweet or salty mainly because regional tastes, filling traditions, and festival habits differ.', 'Bánh trung thu có loại ngọt và mặn chủ yếu do khẩu vị vùng miền, truyền thống nhân và thói quen dịp lễ khác nhau.', 'ขนมไหว้พระจันทร์มีทั้งหวานและเค็มเพราะรสนิยมภูมิภาค ไส้ดั้งเดิม และนิสัยการซื้อในเทศกาลต่างกัน', 'Kue bulan bisa manis atau asin terutama karena selera daerah, tradisi isian, dan kebiasaan festival berbeda.'),
    text('月饼甜咸差异', 'yuè bǐng tián xián chā yì', 'sweet and savory mooncake differences', 'khác biệt bánh trung thu ngọt mặn', 'ความต่างขนมไหว้พระจันทร์หวานเค็ม', 'perbedaan kue bulan manis asin'), text('中秋餐桌和不同城市的点心铺之间', 'zhōng qiū cān zhuō hé bù tóng chéng shì de diǎn xīn pù zhī jiān', 'between Mid-Autumn tables and pastry shops in different cities', 'giữa bàn Trung thu và tiệm bánh ở nhiều thành phố', 'ระหว่างโต๊ะไหว้พระจันทร์กับร้านขนมในหลายเมือง', 'antara meja Festival Pertengahan Musim Gugur dan toko kue di berbagai kota'), text('月饼切开后露出莲蓉、蛋黄或鲜肉馅的画面', 'yuè bǐng qiē kāi hòu lòu chū lián róng dàn huáng huò xiān ròu xiàn de huà miàn', 'a cut mooncake revealing lotus paste, egg yolk, or fresh meat filling', 'cảnh bánh trung thu cắt ra lộ nhân sen, trứng muối hoặc thịt tươi', 'ภาพขนมไหว้พระจันทร์ผ่าออกเห็นไส้เม็ดบัว ไข่แดง หรือเนื้อสด', 'kue bulan dibelah menampakkan pasta lotus, kuning telur, atau daging segar'), () => cuisineFacts.mooncake, ['月饼', '中秋节', '莲蓉', '蛋黄', '鲜肉月饼', '冰皮月饼'], kw(['月饼甜咸', '中秋节月饼'], ['mooncake sweet or salty', 'Mid-Autumn mooncake'])),
];

const cuisineFacts = {
  eightCuisines: [
    text('鲁菜常被视为北方宴席菜的重要基础。', 'lǔ cài cháng bèi shì wéi běi fāng yàn xí cài de zhòng yào jī chǔ', 'Shandong cuisine is often seen as an important base for northern banquet cooking.', 'Ẩm thực Sơn Đông thường được xem là nền tảng quan trọng của tiệc miền bắc.', 'อาหารซานตงมักถูกมองว่าเป็นพื้นฐานสำคัญของอาหารเลี้ยงภาคเหนือ', 'Masakan Shandong sering dipandang sebagai dasar penting hidangan jamuan utara.'),
    text('川菜以麻、辣、香和复合味闻名。', 'chuān cài yǐ má là xiāng hé fù hé wèi wén míng', 'Sichuan cuisine is known for numbing, spicy, fragrant, and layered flavors.', 'Ẩm thực Tứ Xuyên nổi tiếng với vị tê, cay, thơm và nhiều tầng vị.', 'อาหารเสฉวนขึ้นชื่อเรื่องรสชา เผ็ด หอม และรสซ้อนหลายชั้น', 'Masakan Sichuan terkenal dengan rasa kebas, pedas, harum, dan berlapis.'),
    text('粤菜强调食材本味和清鲜口感。', 'yuè cài qiáng diào shí cái běn wèi hé qīng xiān kǒu gǎn', 'Cantonese cuisine emphasizes original ingredient flavor and freshness.', 'Ẩm thực Quảng Đông nhấn mạnh vị nguyên bản và độ tươi.', 'อาหารกวางตุ้งเน้นรสเดิมของวัตถุดิบและความสด', 'Masakan Kanton menekankan rasa asli bahan dan kesegaran.'),
    text('苏菜常以刀工、汤汁和精致摆盘见长。', 'sū cài cháng yǐ dāo gōng tāng zhī hé jīng zhì bǎi pán jiàn cháng', 'Jiangsu cuisine is strong in knife work, sauces, soups, and refined plating.', 'Ẩm thực Giang Tô nổi bật ở kỹ thuật dao, nước xốt và cách bày tinh tế.', 'อาหารเจียงซูเด่นเรื่องฝีมือมีด น้ำซุปซอส และการจัดจานประณีต', 'Masakan Jiangsu unggul dalam teknik potong, kuah, saus, dan penyajian halus.'),
    text('闽菜重视海鲜、汤和红糟等地方风味。', 'mǐn cài zhòng shì hǎi xiān tāng hé hóng zāo děng dì fāng fēng wèi', 'Fujian cuisine values seafood, soups, and local red yeast rice flavors.', 'Ẩm thực Phúc Kiến coi trọng hải sản, canh và hương vị men đỏ địa phương.', 'อาหารฝูเจี้ยนให้ความสำคัญกับอาหารทะเล น้ำแกง และรสท้องถิ่นอย่างหงเจา', 'Masakan Fujian menonjolkan seafood, sup, dan rasa lokal seperti angkak.'),
    text('徽菜常使用山珍、火腿和慢炖技法。', 'huī cài cháng shǐ yòng shān zhēn huǒ tuǐ hé màn dùn jì fǎ', 'Anhui cuisine often uses mountain ingredients, ham, and slow braising.', 'Ẩm thực An Huy thường dùng sản vật núi, giăm bông và kỹ thuật hầm chậm.', 'อาหารอันฮุยมักใช้วัตถุดิบภูเขา แฮม และการตุ๋นช้า', 'Masakan Anhui sering memakai hasil pegunungan, ham, dan teknik rebus perlahan.'),
  ],
  mala: [
    text('花椒带来的麻感是川菜辨识度最高的味觉线索。', 'huā jiāo dài lái de má gǎn shì chuān cài biàn shí dù zuì gāo de wèi jué xiàn suǒ', 'The numbing feeling from Sichuan peppercorns is a key taste clue for Sichuan food.', 'Cảm giác tê từ hoa tiêu là dấu hiệu vị giác rất rõ của món Tứ Xuyên.', 'ความชาจากฮวาเจียวคือสัญญาณรสชาติสำคัญของอาหารเสฉวน', 'Sensasi kebas dari lada Sichuan adalah petunjuk rasa utama masakan Sichuan.'),
    text('辣椒在明清以后逐渐进入中国西南饮食。', 'là jiāo zài míng qīng yǐ hòu zhú jiàn jìn rù zhōng guó xī nán yǐn shí', 'Chili gradually entered southwestern Chinese cooking after the Ming and Qing periods.', 'Ớt dần đi vào ẩm thực tây nam Trung Quốc sau thời Minh Thanh.', 'พริกค่อย ๆ เข้าสู่อาหารจีนตะวันตกเฉียงใต้หลังยุคหมิงชิง', 'Cabai perlahan masuk masakan Tiongkok barat daya setelah era Ming-Qing.'),
    text('四川盆地湿润气候让重口味调味更受欢迎。', 'sì chuān pén dì shī rùn qì hòu ràng zhòng kǒu wèi tiáo wèi gèng shòu huān yíng', 'The humid Sichuan Basin helped strong seasoning become popular.', 'Khí hậu ẩm của bồn địa Tứ Xuyên khiến gia vị đậm được ưa chuộng.', 'ภูมิอากาศชื้นของแอ่งเสฉวนทำให้รสจัดได้รับความนิยม', 'Iklim lembap Cekungan Sichuan membuat bumbu kuat populer.'),
    text('豆瓣酱为许多川菜提供咸香和红亮颜色。', 'dòu bàn jiàng wèi xǔ duō chuān cài tí gōng xián xiāng hé hóng liàng yán sè', 'Doubanjiang gives many Sichuan dishes salty aroma and a red shine.', 'Tương đậu cay tạo mùi mặn thơm và màu đỏ bóng cho nhiều món Tứ Xuyên.', 'โต้วป้านเจียงให้ความเค็มหอมและสีแดงเงาแก่อาหารเสฉวนหลายจาน', 'Doubanjiang memberi aroma asin dan warna merah cerah pada banyak hidangan Sichuan.'),
    text('麻辣不是单纯越辣越好，而是讲究层次。', 'má là bú shì dān chún yuè là yuè hǎo ér shì jiǎng jiū céng cì', 'Mala is not simply about being hotter; it values layers of flavor.', 'Tê cay không phải càng cay càng tốt, mà coi trọng tầng vị.', 'หมาล่าไม่ได้ยิ่งเผ็ดยิ่งดี แต่สำคัญที่ชั้นรส', 'Mala bukan sekadar makin pedas makin baik, tetapi menekankan lapisan rasa.'),
    text('水煮鱼、麻婆豆腐和火锅都是常见川菜例子。', 'shuǐ zhǔ yú má pó dòu fu hé huǒ guō dōu shì cháng jiàn chuān cài lì zi', 'Boiled fish, mapo tofu, and hot pot are common Sichuan examples.', 'Cá luộc cay, đậu phụ Mapo và lẩu đều là ví dụ Tứ Xuyên phổ biến.', 'ปลาต้มเผ็ด เต้าหู้หม่าโผ และหม้อไฟเป็นตัวอย่างเสฉวนที่พบได้บ่อย', 'Ikan rebus pedas, mapo tofu, dan hot pot adalah contoh Sichuan yang umum.'),
  ],
  cantonese: [
    text('清蒸鱼常被用来说明粤菜的鲜味逻辑。', 'qīng zhēng yú cháng bèi yòng lái shuō míng yuè cài de xiān wèi luó jí', 'Steamed fish is often used to explain the Cantonese freshness logic.', 'Cá hấp thường được dùng để giải thích logic vị tươi của món Quảng Đông.', 'ปลานึ่งมักใช้เพื่ออธิบายแนวคิดความสดของอาหารกวางตุ้ง', 'Ikan kukus sering dipakai untuk menjelaskan logika kesegaran Kanton.'),
    text('粤菜常用蒸、白灼和快炒保留食材口感。', 'yuè cài cháng yòng zhēng bái zhuó hé kuài chǎo bǎo liú shí cái kǒu gǎn', 'Cantonese cooking often uses steaming, quick blanching, and fast stir-frying to keep texture.', 'Món Quảng Đông hay dùng hấp, chần nhanh và xào nhanh để giữ kết cấu.', 'อาหารกวางตุ้งมักใช้นึ่ง ลวกเร็ว และผัดเร็วเพื่อรักษาเนื้อสัมผัส', 'Masakan Kanton sering memakai kukus, rebus cepat, dan tumis cepat untuk menjaga tekstur.'),
    text('早茶把点心、茶和社交场景连在一起。', 'zǎo chá bǎ diǎn xīn chá hé shè jiāo chǎng jǐng lián zài yī qǐ', 'Morning tea connects dim sum, tea, and social settings.', 'Trà sáng nối dim sum, trà và không gian giao tiếp.', 'หยำฉ่าเชื่อมติ่มซำ ชา และบริบทสังคมเข้าด้วยกัน', 'Yum cha menghubungkan dim sum, teh, dan suasana sosial.'),
    text('岭南地区靠近海洋，海鲜菜式很丰富。', 'lǐng nán dì qū kào jìn hǎi yáng hǎi xiān cài shì hěn fēng fù', 'Lingnan is close to the sea, so seafood dishes are abundant.', 'Lĩnh Nam gần biển nên món hải sản rất phong phú.', 'หลิงหนานใกล้ทะเล จึงมีอาหารทะเลหลากหลาย', 'Lingnan dekat laut, sehingga hidangan seafood berlimpah.'),
    text('粤菜并不等于清淡无味，而是追求干净的层次。', 'yuè cài bìng bù děng yú qīng dàn wú wèi ér shì zhuī qiú gān jìng de céng cì', 'Cantonese food is not tasteless; it seeks clean layers of flavor.', 'Món Quảng Đông không phải nhạt vô vị, mà theo đuổi tầng vị sạch.', 'อาหารกวางตุ้งไม่ได้จืดไร้รส แต่เน้นชั้นรสที่สะอาด', 'Masakan Kanton bukan hambar, tetapi mengejar lapisan rasa yang bersih.'),
    text('烧味和点心让粤菜在海外餐厅很常见。', 'shāo wèi hé diǎn xīn ràng yuè cài zài hǎi wài cān tīng hěn cháng jiàn', 'Roast meats and dim sum make Cantonese cuisine common in overseas restaurants.', 'Thịt quay và dim sum khiến món Quảng Đông rất phổ biến ở nhà hàng quốc tế.', 'หมูเป็ดย่างและติ่มซำทำให้อาหารกวางตุ้งพบได้บ่อยในร้านต่างประเทศ', 'Daging panggang dan dim sum membuat masakan Kanton umum di restoran luar negeri.'),
  ],
  shandong: [
    text('鲁菜发源于山东，代表北方饮食传统。', 'lǔ cài fā yuán yú shān dōng dài biǎo běi fāng yǐn shí chuán tǒng', 'Shandong cuisine originated in Shandong and represents northern food traditions.', 'Ẩm thực Sơn Đông bắt nguồn từ Sơn Đông và đại diện truyền thống ẩm thực miền bắc.', 'อาหารซานตงเกิดจากซานตงและแทนประเพณีอาหารภาคเหนือ', 'Masakan Shandong berasal dari Shandong dan mewakili tradisi makanan utara.'),
    text('高汤是鲁菜理解宴席味道的关键。', 'gāo tāng shì lǔ cài lǐ jiě yàn xí wèi dào de guān jiàn', 'Rich stock is key to understanding banquet flavor in Shandong cuisine.', 'Nước dùng đậm là chìa khóa hiểu vị tiệc trong món Sơn Đông.', 'น้ำซุปเข้มคือกุญแจเข้าใจรสงานเลี้ยงแบบซานตง', 'Kaldu kaya adalah kunci memahami rasa jamuan Shandong.'),
    text('葱烧海参是鲁菜常见的代表菜名。', 'cōng shāo hǎi shēn shì lǔ cài cháng jiàn de dài biǎo cài míng', 'Braised sea cucumber with scallion is a common representative Shandong dish.', 'Hải sâm om hành là món đại diện Sơn Đông thường gặp.', 'ปลิงทะเลตุ๋นต้นหอมเป็นตัวแทนอาหารซานตงที่พบได้บ่อย', 'Teripang rebus daun bawang adalah hidangan Shandong yang umum dikenal.'),
    text('九转大肠体现鲁菜对火候和调味的控制。', 'jiǔ zhuǎn dà cháng tǐ xiàn lǔ cài duì huǒ hòu hé tiáo wèi de kòng zhì', 'Jiuzhuan dachang shows Shandong control of heat and seasoning.', 'Cửu chuyển đại tràng thể hiện khả năng kiểm soát lửa và gia vị của Sơn Đông.', 'จิ่วจ่วนต้าฉางแสดงการควบคุมไฟและรสของซานตง', 'Jiuzhuan dachang menunjukkan kendali api dan bumbu dalam masakan Shandong.'),
    text('鲁菜影响了北京、天津等北方城市饮食。', 'lǔ cài yǐng xiǎng le běi jīng tiān jīn děng běi fāng chéng shì yǐn shí', 'Shandong cuisine influenced food in Beijing, Tianjin, and other northern cities.', 'Ẩm thực Sơn Đông ảnh hưởng đến món ăn Bắc Kinh, Thiên Tân và nhiều thành phố miền bắc.', 'อาหารซานตงมีอิทธิพลต่ออาหารปักกิ่ง เทียนจิน และเมืองเหนืออื่น ๆ', 'Masakan Shandong memengaruhi kuliner Beijing, Tianjin, dan kota utara lain.'),
    text('说鲁菜是基础，重点是说它的技法和影响力。', 'shuō lǔ cài shì jī chǔ zhòng diǎn shì shuō tā de jì fǎ hé yǐng xiǎng lì', 'Calling it a base mainly refers to its techniques and influence.', 'Nói Sơn Đông là nền tảng chủ yếu nói về kỹ thuật và ảnh hưởng của nó.', 'การเรียกว่าเป็นฐาน หมายถึงเทคนิคและอิทธิพลเป็นหลัก', 'Menyebutnya dasar terutama merujuk pada teknik dan pengaruhnya.'),
  ],
  pekingDuck: [
    text('烤鸭皮脆是很多游客最先注意到的特点。', 'kǎo yā pí cuì shì hěn duō yóu kè zuì xiān zhù yì dào de tè diǎn', 'Crispy skin is the first feature many visitors notice.', 'Da giòn là đặc điểm nhiều du khách chú ý đầu tiên.', 'หนังกรอบคือจุดเด่นแรกที่นักท่องเที่ยวหลายคนสังเกต', 'Kulit renyah adalah ciri pertama yang banyak wisatawan perhatikan.'),
    text('片鸭师傅会把鸭肉切成适合卷饼的薄片。', 'piàn yā shī fu huì bǎ yā ròu qiē chéng shì hé juǎn bǐng de báo piàn', 'The duck carver slices the meat thinly for wrapping.', 'Người thái vịt cắt thịt thành lát mỏng phù hợp để cuốn.', 'ช่างแล่เป็ดจะหั่นเนื้อเป็นชิ้นบางเหมาะสำหรับห่อ', 'Juru iris bebek memotong daging tipis agar cocok dibungkus.'),
    text('甜面酱提供甜咸平衡。', 'tián miàn jiàng tí gōng tián xián píng héng', 'Sweet bean sauce gives a sweet-salty balance.', 'Tương ngọt tạo cân bằng ngọt mặn.', 'ซอสหวานให้สมดุลหวานเค็ม', 'Saus manis memberi keseimbangan manis dan asin.'),
    text('葱丝和黄瓜条让口感更清爽。', 'cōng sī hé huáng guā tiáo ràng kǒu gǎn gèng qīng shuǎng', 'Scallion and cucumber make the bite fresher.', 'Hành thái và dưa chuột làm vị ăn tươi mát hơn.', 'ต้นหอมและแตงกวาทำให้รสสัมผัสสดขึ้น', 'Daun bawang dan mentimun membuat gigitan lebih segar.'),
    text('有些餐厅会把鸭架做成汤。', 'yǒu xiē cān tīng huì bǎ yā jià zuò chéng tāng', 'Some restaurants turn the duck bones into soup.', 'Một số nhà hàng dùng khung vịt nấu canh.', 'บางร้านนำโครงเป็ดไปทำซุป', 'Beberapa restoran mengolah tulang bebek menjadi sup.'),
    text('北京烤鸭常被用来介绍中国饮食入门。', 'běi jīng kǎo yā cháng bèi yòng lái jiè shào zhōng guó yǐn shí rù mén', 'Peking duck is often used to introduce Chinese food to beginners.', 'Vịt quay Bắc Kinh thường được dùng để giới thiệu nhập môn ẩm thực Trung Quốc.', 'เป็ดปักกิ่งมักใช้แนะนำอาหารจีนเบื้องต้น', 'Bebek Peking sering dipakai untuk memperkenalkan makanan Tiongkok bagi pemula.'),
  ],
  hotPot: [
    text('北方涮羊肉常用清汤和芝麻酱。', 'běi fāng shuàn yáng ròu cháng yòng qīng tāng hé zhī ma jiàng', 'Northern lamb hot pot often uses clear broth and sesame paste.', 'Lẩu cừu miền bắc thường dùng nước trong và sốt mè.', 'หม้อไฟเนื้อแกะภาคเหนือมักใช้น้ำซุปใสและซอสงา', 'Hot pot domba utara sering memakai kuah bening dan saus wijen.'),
    text('四川火锅常用牛油和麻辣锅底。', 'sì chuān huǒ guō cháng yòng niú yóu hé má là guō dǐ', 'Sichuan hot pot often uses beef tallow and a mala soup base.', 'Lẩu Tứ Xuyên thường dùng mỡ bò và nước lẩu tê cay.', 'หม้อไฟเสฉวนมักใช้ไขมันวัวและน้ำซุปหมาล่า', 'Hot pot Sichuan sering memakai lemak sapi dan kuah mala.'),
    text('潮汕牛肉火锅强调牛肉部位和清汤。', 'cháo shàn niú ròu huǒ guō qiáng diào niú ròu bù wèi hé qīng tāng', 'Chaoshan beef hot pot stresses beef cuts and clear broth.', 'Lẩu bò Triều Sán nhấn mạnh phần thịt bò và nước trong.', 'หม้อไฟเนื้อเฉาซ่านเน้นส่วนเนื้อและน้ำซุปใส', 'Hot pot sapi Chaoshan menekankan potongan sapi dan kuah bening.'),
    text('云南菌菇火锅突出山野食材。', 'yún nán jūn gū huǒ guō tū chū shān yě shí cái', 'Yunnan mushroom hot pot highlights mountain ingredients.', 'Lẩu nấm Vân Nam làm nổi bật nguyên liệu núi rừng.', 'หม้อไฟเห็ดยูนนานเด่นที่วัตถุดิบภูเขา', 'Hot pot jamur Yunnan menonjolkan bahan pegunungan.'),
    text('火锅适合社交，因为大家共享同一口锅。', 'huǒ guō shì hé shè jiāo yīn wèi dà jiā gòng xiǎng tóng yī kǒu guō', 'Hot pot suits social dining because everyone shares one pot.', 'Lẩu phù hợp giao lưu vì mọi người cùng dùng một nồi.', 'หม้อไฟเหมาะกับการสังสรรค์เพราะทุกคนใช้หม้อเดียวกัน', 'Hot pot cocok untuk makan sosial karena semua berbagi satu panci.'),
    text('点火锅时常见词包括锅底、蘸料和加菜。', 'diǎn huǒ guō shí cháng jiàn cí bāo kuò guō dǐ zhàn liào hé jiā cài', 'Common hot pot ordering words include soup base, dipping sauce, and add-on dishes.', 'Từ thường gặp khi gọi lẩu gồm nước lẩu, nước chấm và gọi thêm món.', 'คำสั่งหม้อไฟที่พบบ่อยมีน้ำซุป น้ำจิ้ม และเพิ่มอาหาร', 'Kata umum saat memesan hot pot mencakup kuah, saus celup, dan tambah menu.'),
  ],
  dimSum: [
    text('虾饺常用透明外皮包住整虾或虾仁。', 'xiā jiǎo cháng yòng tòu míng wài pí bāo zhù zhěng xiā huò xiā rén', 'Shrimp dumplings often wrap whole shrimp or shrimp pieces in translucent skin.', 'Há cảo tôm thường dùng vỏ trong bọc tôm nguyên con hoặc tôm cắt.', 'ฮะเก๋ามักใช้แป้งใสห่อกุ้งทั้งตัวหรือชิ้นกุ้ง', 'Hakau sering membungkus udang utuh atau potongan udang dalam kulit bening.'),
    text('烧卖通常露出馅料，颜色很容易辨认。', 'shāo mài tōng cháng lòu chū xiàn liào yán sè hěn róng yì biàn rèn', 'Shumai usually shows its filling, making it easy to recognize.', 'Xíu mại thường lộ nhân nên dễ nhận ra bằng màu sắc.', 'ขนมจีบมักเห็นไส้ด้านบน จึงจำได้ง่ายจากสี', 'Shumai biasanya memperlihatkan isian sehingga mudah dikenali.'),
    text('叉烧包把甜咸叉烧馅包进松软面皮。', 'chā shāo bāo bǎ tián xián chā shāo xiàn bāo jìn sōng ruǎn miàn pí', 'Char siu buns wrap sweet-salty pork filling in soft dough.', 'Bánh bao xá xíu bọc nhân xá xíu ngọt mặn trong vỏ mềm.', 'ซาลาเปาหมูแดงห่อไส้หวานเค็มในแป้งนุ่ม', 'Bakpao char siu membungkus isian manis asin dalam adonan lembut.'),
    text('肠粉口感滑，常配酱油类调味。', 'cháng fěn kǒu gǎn huá cháng pèi jiàng yóu lèi tiáo wèi', 'Rice rolls are smooth and often served with soy-based sauce.', 'Bánh cuốn Quảng Đông mềm trơn và thường dùng nước tương.', 'ก๋วยเตี๋ยวหลอดเนื้อลื่นและมักเสิร์ฟกับซอสซีอิ๊ว', 'Rice roll bertekstur halus dan sering disajikan dengan saus kecap.'),
    text('蛋挞常和港式点心一起出现。', 'dàn tà cháng hé gǎng shì diǎn xīn yī qǐ chū xiàn', 'Egg tarts often appear with Hong Kong-style dim sum.', 'Tart trứng thường xuất hiện cùng dim sum kiểu Hong Kong.', 'ทาร์ตไข่มักปรากฏคู่กับติ่มซำฮ่องกง', 'Tart telur sering muncul bersama dim sum Hong Kong.'),
    text('早茶不是只喝茶，而是一种慢节奏餐饮社交。', 'zǎo chá bú shì zhǐ hē chá ér shì yī zhǒng màn jié zòu cān yǐn shè jiāo', 'Morning tea is not only drinking tea; it is slow-paced dining and socializing.', 'Trà sáng không chỉ là uống trà, mà là ăn uống và giao tiếp chậm rãi.', 'หยำฉ่าไม่ใช่แค่ดื่มชา แต่เป็นการกินและสังสรรค์แบบช้า ๆ', 'Yum cha bukan hanya minum teh, tetapi makan dan bersosialisasi santai.'),
  ],
  lanzhou: [
    text('一清指牛肉汤要清亮。', 'yī qīng zhǐ niú ròu tāng yào qīng liàng', 'Yi qing means the beef broth should be clear.', 'Nhất thanh nghĩa là nước bò phải trong.', 'อีชิงหมายถึงน้ำซุปเนื้อต้องใส', 'Yi qing berarti kuah sapi harus jernih.'),
    text('二白指萝卜片要白。', 'èr bái zhǐ luó bo piàn yào bái', 'Er bai means the radish slices should be white.', 'Nhị bạch nghĩa là lát củ cải phải trắng.', 'เอ้อร์ไป๋หมายถึงหัวไชเท้าหั่นต้องขาว', 'Er bai berarti irisan lobak harus putih.'),
    text('三红常指辣椒油颜色红亮。', 'sān hóng cháng zhǐ là jiāo yóu yán sè hóng liàng', 'San hong often refers to bright red chili oil.', 'Tam hồng thường chỉ dầu ớt đỏ sáng.', 'ซานหงมักหมายถึงน้ำมันพริกสีแดงสด', 'San hong sering merujuk pada minyak cabai merah cerah.'),
    text('四绿常指蒜苗或香菜带来的绿色。', 'sì lǜ cháng zhǐ suàn miáo huò xiāng cài dài lái de lǜ sè', 'Si lv often means green from garlic sprouts or cilantro.', 'Tứ lục thường chỉ màu xanh từ mầm tỏi hoặc rau mùi.', 'ซื่อลวี่มักหมายถึงสีเขียวจากต้นกระเทียมหรือผักชี', 'Si lv sering berarti warna hijau dari daun bawang atau ketumbar.'),
    text('五黄常指面条颜色和筋道口感。', 'wǔ huáng cháng zhǐ miàn tiáo yán sè hé jīn dào kǒu gǎn', 'Wu huang often points to noodle color and chewy texture.', 'Ngũ hoàng thường nói đến màu mì và độ dai.', 'อู่หวงมักหมายถึงสีเส้นและความหนึบ', 'Wu huang sering menunjuk warna mi dan tekstur kenyal.'),
    text('拉面师傅会根据顾客要求调整面条粗细。', 'lā miàn shī fu huì gēn jù gù kè yāo qiú tiáo zhěng miàn tiáo cū xì', 'Noodle pullers adjust noodle thickness based on customer requests.', 'Thợ kéo mì điều chỉnh độ dày theo yêu cầu khách.', 'ช่างดึงเส้นปรับความหนาเส้นตามคำขอลูกค้า', 'Pembuat mi tarik menyesuaikan ketebalan sesuai permintaan pelanggan.'),
  ],
  shanghaiBuns: [
    text('生煎包底部因为油煎而形成脆壳。', 'shēng jiān bāo dǐ bù yīn wèi yóu jiān ér xíng chéng cuì ké', 'Shengjianbao forms a crisp bottom because it is pan-fried.', 'Sinh chiên bao có đáy giòn vì được áp chảo.', 'เซิงเจียนเปามีก้นกรอบเพราะทอดกระทะ', 'Shengjianbao memiliki dasar renyah karena digoreng di wajan.'),
    text('小笼包通常放在小蒸笼里蒸熟。', 'xiǎo lóng bāo tōng cháng fàng zài xiǎo zhēng lóng lǐ zhēng shú', 'Xiaolongbao is usually steamed in small bamboo baskets.', 'Tiểu long bao thường được hấp trong xửng nhỏ.', 'เสี่ยวหลงเปามักนึ่งในเข่งเล็ก', 'Xiaolongbao biasanya dikukus dalam keranjang bambu kecil.'),
    text('两者都可能有汤汁，但吃法不同。', 'liǎng zhě dōu kě néng yǒu tāng zhī dàn chī fǎ bù tóng', 'Both may contain broth, but the eating method differs.', 'Cả hai đều có thể có nước súp, nhưng cách ăn khác nhau.', 'ทั้งสองอาจมีน้ำซุป แต่กินต่างกัน', 'Keduanya bisa berisi kuah, tetapi cara makannya berbeda.'),
    text('吃小笼包时常先咬小口再喝汤。', 'chī xiǎo lóng bāo shí cháng xiān yǎo xiǎo kǒu zài hē tāng', 'When eating xiaolongbao, people often bite a small hole first and sip the soup.', 'Khi ăn tiểu long bao, người ta thường cắn lỗ nhỏ rồi uống nước.', 'เวลาทานเสี่ยวหลงเปามักกัดรูเล็กก่อนแล้วซดน้ำ', 'Saat makan xiaolongbao, orang sering menggigit sedikit lalu menyeruput kuah.'),
    text('生煎包更像街头小吃，节奏更快。', 'shēng jiān bāo gèng xiàng jiē tóu xiǎo chī jié zòu gèng kuài', 'Shengjianbao feels more like street food and is eaten faster.', 'Sinh chiên bao giống món đường phố hơn và nhịp ăn nhanh hơn.', 'เซิงเจียนเปาคล้ายของกินข้างทางและกินเร็วกว่า', 'Shengjianbao terasa lebih seperti jajanan jalanan dan dimakan lebih cepat.'),
    text('小笼包在海外常被翻译成soup dumplings。', 'xiǎo lóng bāo zài hǎi wài cháng bèi fān yì chéng tāng bāo', 'Xiaolongbao is often translated overseas as soup dumplings.', 'Tiểu long bao ở nước ngoài thường được dịch là soup dumplings.', 'เสี่ยวหลงเปาในต่างประเทศมักแปลว่า soup dumplings', 'Xiaolongbao di luar negeri sering diterjemahkan sebagai soup dumplings.'),
  ],
  mapoTofu: [
    text('麻婆豆腐的名字和成都地方传说有关。', 'má pó dòu fu de míng zi hé chéng dū dì fāng chuán shuō yǒu guān', 'The name mapo tofu is tied to a Chengdu local story.', 'Tên đậu phụ Mapo gắn với một câu chuyện địa phương Thành Đô.', 'ชื่อเต้าหู้หม่าโผเกี่ยวกับเรื่องเล่าท้องถิ่นเฉิงตู', 'Nama mapo tofu terkait cerita lokal Chengdu.'),
    text('豆腐提供柔软口感，牛肉末提供香味。', 'dòu fu tí gōng róu ruǎn kǒu gǎn niú ròu mò tí gōng xiāng wèi', 'Tofu gives a soft texture, while minced beef adds aroma.', 'Đậu phụ tạo độ mềm, còn thịt bò băm thêm hương thơm.', 'เต้าหู้ให้สัมผัสนุ่ม ส่วนเนื้อบดเพิ่มกลิ่นหอม', 'Tahu memberi tekstur lembut, daging cincang menambah aroma.'),
    text('郫县豆瓣是麻婆豆腐的重要调味。', 'pí xiàn dòu bàn shì má pó dòu fu de zhòng yào tiáo wèi', 'Pixian doubanjiang is an important seasoning for mapo tofu.', 'Tương đậu Pixian là gia vị quan trọng của đậu phụ Mapo.', 'โต้วป้านผีเซี่ยนเป็นเครื่องปรุงสำคัญของเต้าหู้หม่าโผ', 'Doubanjiang Pixian adalah bumbu penting untuk mapo tofu.'),
    text('花椒粉让菜品带有明显麻感。', 'huā jiāo fěn ràng cài pǐn dài yǒu míng xiǎn má gǎn', 'Sichuan pepper powder gives the dish a clear numbing feeling.', 'Bột hoa tiêu tạo cảm giác tê rõ cho món ăn.', 'ผงฮวาเจียวทำให้อาหารมีความชาเด่นชัด', 'Bubuk lada Sichuan memberi sensasi kebas yang jelas.'),
    text('麻婆豆腐适合解释川菜复合味。', 'má pó dòu fu shì hé jiě shì chuān cài fù hé wèi', 'Mapo tofu is useful for explaining layered Sichuan flavor.', 'Đậu phụ Mapo phù hợp để giải thích tầng vị Tứ Xuyên.', 'เต้าหู้หม่าโผเหมาะอธิบายรสซ้อนของอาหารเสฉวน', 'Mapo tofu cocok menjelaskan rasa berlapis Sichuan.'),
    text('海外餐厅常把麻婆豆腐作为川菜代表。', 'hǎi wài cān tīng cháng bǎ má pó dòu fu zuò wéi chuān cài dài biǎo', 'Overseas restaurants often use mapo tofu as a representative Sichuan dish.', 'Nhà hàng quốc tế thường xem đậu phụ Mapo là đại diện món Tứ Xuyên.', 'ร้านอาหารต่างประเทศมักใช้เต้าหู้หม่าโผเป็นตัวแทนอาหารเสฉวน', 'Restoran luar negeri sering menjadikan mapo tofu wakil masakan Sichuan.'),
  ],
  tea: [
    text('绿茶通常不经过明显发酵，口感清爽。', 'lǜ chá tōng cháng bù jīng guò míng xiǎn fā jiào kǒu gǎn qīng shuǎng', 'Green tea is usually not heavily oxidized and tastes fresh.', 'Trà xanh thường không oxy hóa rõ và có vị thanh.', 'ชาเขียวมักไม่ผ่านออกซิเดชันมากและรสสด', 'Teh hijau biasanya tidak banyak teroksidasi dan rasanya segar.'),
    text('白茶工艺相对简单，常显得柔和。', 'bái chá gōng yì xiāng duì jiǎn dān cháng xiǎn de róu hé', 'White tea has relatively simple processing and often tastes gentle.', 'Trà trắng có quy trình tương đối đơn giản và vị dịu.', 'ชาขาวมีกระบวนการค่อนข้างเรียบง่ายและรสนุ่ม', 'Teh putih diproses relatif sederhana dan sering terasa lembut.'),
    text('黄茶有闷黄工艺，数量相对少。', 'huáng chá yǒu mèn huáng gōng yì shù liàng xiāng duì shǎo', 'Yellow tea uses a sealed yellowing process and is relatively rare.', 'Trà vàng có công đoạn ủ vàng và số lượng tương đối ít.', 'ชาเหลืองมีกระบวนการอบเหลืองและพบค่อนข้างน้อย', 'Teh kuning memakai proses penguningan tertutup dan relatif langka.'),
    text('青茶也常被称为乌龙茶。', 'qīng chá yě cháng bèi chēng wéi wū lóng chá', 'Qing tea is also commonly called oolong tea.', 'Thanh trà cũng thường được gọi là trà ô long.', 'ชาชิงมักเรียกว่าอู่หลง', 'Qing tea juga sering disebut oolong.'),
    text('中国红茶在英语里通常对应black tea。', 'zhōng guó hóng chá zài yīng yǔ lǐ tōng cháng duì yìng hēi chá', 'Chinese hong cha usually corresponds to black tea in English.', 'Hồng trà Trung Quốc trong tiếng Anh thường là black tea.', 'หงฉาจีนในภาษาอังกฤษมักตรงกับ black tea', 'Hong cha Tiongkok biasanya setara dengan black tea dalam bahasa Inggris.'),
    text('黑茶包括普洱熟茶等后发酵茶。', 'hēi chá bāo kuò pǔ ěr shú chá děng hòu fā jiào chá', 'Dark tea includes post-fermented teas such as ripe Pu’er.', 'Hắc trà gồm các trà hậu lên men như Phổ Nhĩ chín.', 'ชาหมักเข้มรวมถึงผู่เอ๋อร์สุกและชาหลังหมัก', 'Dark tea mencakup teh pasca-fermentasi seperti Pu’er matang.'),
  ],
  mooncake: [
    text('广式月饼常见莲蓉、豆沙和蛋黄馅。', 'guǎng shì yuè bǐng cháng jiàn lián róng dòu shā hé dàn huáng xiàn', 'Cantonese mooncakes often use lotus seed paste, red bean paste, and egg yolk.', 'Bánh trung thu kiểu Quảng Đông thường có nhân sen, đậu đỏ và lòng đỏ trứng.', 'ขนมไหว้พระจันทร์แบบกวางตุ้งมักมีไส้เม็ดบัว ถั่วแดง และไข่แดง', 'Kue bulan Kanton sering memakai pasta lotus, kacang merah, dan kuning telur.'),
    text('苏式鲜肉月饼是咸味月饼的代表。', 'sū shì xiān ròu yuè bǐng shì xián wèi yuè bǐng de dài biǎo', 'Suzhou-style fresh meat mooncakes represent savory mooncakes.', 'Bánh trung thu thịt tươi kiểu Tô Châu là đại diện vị mặn.', 'ขนมไหว้พระจันทร์ไส้หมูสดแบบซูโจวเป็นตัวแทนรสเค็ม', 'Kue bulan daging segar Suzhou mewakili jenis asin.'),
    text('蛋黄莲蓉把甜味和咸香结合在一起。', 'dàn huáng lián róng bǎ tián wèi hé xián xiāng jié hé zài yī qǐ', 'Egg yolk lotus paste combines sweetness with savory aroma.', 'Nhân sen trứng muối kết hợp vị ngọt và thơm mặn.', 'ไส้เม็ดบัวไข่แดงรวมความหวานกับกลิ่นเค็มหอม', 'Pasta lotus kuning telur memadukan manis dan gurih asin.'),
    text('中秋节让月饼成为重要节日食品。', 'zhōng qiū jié ràng yuè bǐng chéng wéi zhòng yào jié rì shí pǐn', 'Mid-Autumn Festival makes mooncakes an important festival food.', 'Tết Trung thu khiến bánh trung thu thành món lễ hội quan trọng.', 'เทศกาลไหว้พระจันทร์ทำให้ขนมชนิดนี้เป็นอาหารเทศกาลสำคัญ', 'Festival Pertengahan Musim Gugur membuat kue bulan menjadi makanan festival penting.'),
    text('不同城市会推出冰皮、流心和低糖月饼。', 'bù tóng chéng shì huì tuī chū bīng pí liú xīn hé dī táng yuè bǐng', 'Different cities offer snow-skin, lava, and low-sugar mooncakes.', 'Nhiều thành phố có bánh dẻo lạnh, nhân chảy và ít đường.', 'หลายเมืองมีแบบเปลือกหิมะ ไส้ไหล และน้ำตาลต่ำ', 'Berbagai kota menawarkan snow-skin, lava, dan rendah gula.'),
    text('讨论甜咸月饼时，最好用地区和馅料解释。', 'tǎo lùn tián xián yuè bǐng shí zuì hǎo yòng dì qū hé xiàn liào jiě shì', 'When discussing sweet and salty mooncakes, region and filling explain the difference best.', 'Khi nói về bánh ngọt mặn, nên giải thích bằng vùng miền và nhân.', 'เวลาพูดถึงหวานเค็ม ควรอธิบายด้วยภูมิภาคและไส้', 'Saat membahas kue bulan manis asin, wilayah dan isian adalah penjelasan terbaik.'),
  ],
};

categories.cuisine.articles = cuisineArticles;