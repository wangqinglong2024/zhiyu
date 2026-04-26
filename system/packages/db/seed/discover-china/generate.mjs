/* eslint-disable no-console */
/**
 * Generates articles.json (36 entries, 3 per category × 12) from a compact
 * template. Run once: `node packages/db/seed/discover-china/generate.mjs`.
 *
 * Each article ships 4-6 sentences with translations in en/vi/th/id (zh kept
 * as the source). Content is intentionally bite-sized for HSK 1-3 readers.
 */
import { writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const cats = JSON.parse(await readFile(path.join(__dirname, 'categories.json'), 'utf8'));

/**
 * Per-category article seed templates.
 * Keys: category slug → array of { slug, hsk, title (i18n), summary (i18n),
 *   sentences: [{zh, pinyin, en, vi, th, id}] }.
 *
 * Translations are intentionally short and idiomatic but not literary.
 */
const T = {
  history: [
    {
      slug: 'great-wall-origins',
      hsk: 2,
      title: { 'zh-CN': '长城的起源', en: 'Origins of the Great Wall', vi: 'Nguồn gốc Vạn Lý Trường Thành', th: 'ต้นกำเนิดกำแพงเมืองจีน', id: 'Asal-usul Tembok Besar' },
      summary: { 'zh-CN': '从战国土墙到明代砖石长城。', en: 'From Warring States ramparts to Ming brickwork.', vi: 'Từ tường đất Chiến Quốc đến gạch đá nhà Minh.', th: 'จากกำแพงดินยุคจ้านกั๋วสู่อิฐหินยุคหมิง', id: 'Dari tembok tanah Negara Berperang ke batu Ming.' },
      sentences: [
        { zh: '长城始建于春秋时期。', pinyin: 'Chángchéng shǐ jiàn yú Chūnqiū shíqī.', en: 'The Great Wall was first built in the Spring and Autumn period.', vi: 'Vạn Lý Trường Thành bắt đầu xây từ thời Xuân Thu.', th: 'กำแพงเมืองจีนเริ่มสร้างในยุคชุนชิว', id: 'Tembok Besar mulai dibangun pada periode Musim Semi & Musim Gugur.' },
        { zh: '秦始皇连接了各国旧墙。', pinyin: 'Qín Shǐhuáng liánjiē le gèguó jiù qiáng.', en: 'Qin Shi Huang linked the older walls of various states.', vi: 'Tần Thủy Hoàng nối liền các bức tường cũ của các nước.', th: 'จิ๋นซีฮ่องเต้เชื่อมกำแพงเก่าของแคว้นต่างๆ', id: 'Qin Shi Huang menyambung tembok-tembok lama berbagai negara.' },
        { zh: '明朝用砖石加固了长城。', pinyin: 'Míng cháo yòng zhuān shí jiāgù le Chángchéng.', en: 'The Ming dynasty reinforced the wall with brick and stone.', vi: 'Triều Minh gia cố tường bằng gạch và đá.', th: 'ราชวงศ์หมิงเสริมกำแพงด้วยอิฐและหิน', id: 'Dinasti Ming memperkuat tembok dengan bata dan batu.' },
        { zh: '今天它已成为世界文化遗产。', pinyin: 'Jīntiān tā yǐ chéngwéi shìjiè wénhuà yíchǎn.', en: 'Today it is a UNESCO World Heritage site.', vi: 'Ngày nay nó là di sản văn hóa thế giới.', th: 'วันนี้กลายเป็นมรดกโลกทางวัฒนธรรม', id: 'Kini ia menjadi Situs Warisan Dunia.' }
      ]
    },
    {
      slug: 'silk-road-glance',
      hsk: 3,
      title: { 'zh-CN': '丝绸之路一瞥', en: 'A Glance at the Silk Road', vi: 'Thoáng nhìn Con đường Tơ lụa', th: 'มองเส้นทางสายไหม', id: 'Sekilas Jalur Sutra' },
      summary: { 'zh-CN': '商队、骆驼与跨越大陆的故事。', en: 'Caravans, camels, and a story across continents.', vi: 'Đoàn thương buôn, lạc đà và câu chuyện xuyên lục địa.', th: 'กองคาราวาน อูฐ และเรื่องราวข้ามทวีป', id: 'Kafilah, unta, dan kisah lintas benua.' },
      sentences: [
        { zh: '丝绸之路连接了东西方。', pinyin: 'Sīchóu zhī lù liánjiē le dōngxī fāng.', en: 'The Silk Road linked the East and the West.', vi: 'Con đường Tơ lụa nối Đông và Tây.', th: 'เส้นทางสายไหมเชื่อมโลกตะวันออกกับตะวันตก', id: 'Jalur Sutra menghubungkan Timur dan Barat.' },
        { zh: '骆驼商队带去了丝绸和茶叶。', pinyin: 'Luòtuo shāngduì dàiqù le sīchóu hé cháyè.', en: 'Camel caravans carried silk and tea.', vi: 'Đoàn lạc đà mang theo lụa và trà.', th: 'กองคาราวานอูฐนำผ้าไหมและใบชาไปด้วย', id: 'Kafilah unta membawa sutra dan teh.' },
        { zh: '佛教也沿着这条路传入中国。', pinyin: 'Fójiào yě yánzhe zhè tiáo lù chuánrù Zhōngguó.', en: 'Buddhism also reached China via this route.', vi: 'Phật giáo cũng theo con đường này vào Trung Quốc.', th: 'พุทธศาสนาก็เข้าสู่จีนตามเส้นทางนี้', id: 'Buddhisme juga masuk ke Tiongkok melalui jalur ini.' },
        { zh: '今天丝绸之路成为文化记忆。', pinyin: 'Jīntiān Sīchóu zhī lù chéngwéi wénhuà jìyì.', en: 'Today the Silk Road remains a cultural memory.', vi: 'Hôm nay Con đường Tơ lụa vẫn là ký ức văn hóa.', th: 'ทุกวันนี้เส้นทางสายไหมเป็นความทรงจำทางวัฒนธรรม', id: 'Kini Jalur Sutra menjadi memori budaya.' }
      ]
    },
    {
      slug: 'tang-prosperity',
      hsk: 3,
      title: { 'zh-CN': '盛唐气象', en: 'The Splendor of Tang', vi: 'Khí phách Đại Đường', th: 'ความรุ่งโรจน์แห่งถัง', id: 'Kemegahan Dinasti Tang' },
      summary: { 'zh-CN': '诗歌、丝绸与开放的长安城。', en: 'Poetry, silk, and the open city of Chang’an.', vi: 'Thơ ca, lụa, và Trường An rộng mở.', th: 'กวีนิพนธ์ ผ้าไหม และนครฉางอันที่เปิดกว้าง', id: 'Puisi, sutra, dan kota Chang’an yang terbuka.' },
      sentences: [
        { zh: '唐朝是中国最开放的时代之一。', pinyin: 'Táng cháo shì Zhōngguó zuì kāifàng de shídài zhī yī.', en: 'The Tang was one of China’s most open eras.', vi: 'Đường là một trong những thời kỳ cởi mở nhất.', th: 'ยุคถังเป็นหนึ่งในยุคที่เปิดกว้างที่สุดของจีน', id: 'Tang adalah salah satu era paling terbuka di Tiongkok.' },
        { zh: '长安成为国际化的大都市。', pinyin: 'Cháng’ān chéngwéi guójì huà de dà dūshì.', en: 'Chang’an became a cosmopolitan capital.', vi: 'Trường An trở thành đô thị quốc tế.', th: 'ฉางอันกลายเป็นนครนานาชาติ', id: 'Chang’an menjadi metropolis internasional.' },
        { zh: '诗人李白和杜甫名扬天下。', pinyin: 'Shīrén Lǐ Bái hé Dù Fǔ míng yáng tiānxià.', en: 'Poets Li Bai and Du Fu were known across the realm.', vi: 'Nhà thơ Lý Bạch và Đỗ Phủ vang danh thiên hạ.', th: 'กวีหลี่ไป๋และตู้ฝู่ลือชาทั่วแผ่นดิน', id: 'Penyair Li Bai dan Du Fu termasyhur di mana-mana.' },
        { zh: '盛唐气象至今令人神往。', pinyin: 'Shèng Táng qìxiàng zhì jīn lìng rén shén wǎng.', en: 'Tang grandeur still captivates today.', vi: 'Khí phách Đường nay vẫn cuốn hút.', th: 'ความรุ่งโรจน์แห่งถังยังตรึงใจมาจนถึงทุกวันนี้', id: 'Keagungan Tang masih memikat hingga kini.' }
      ]
    }
  ],
  cuisine: [
    {
      slug: 'eight-cuisines',
      hsk: 2,
      title: { 'zh-CN': '中华八大菜系', en: 'The Eight Great Cuisines', vi: 'Bát đại trường phái ẩm thực', th: 'แปดสำรับใหญ่ของจีน', id: 'Delapan Masakan Besar' },
      summary: { 'zh-CN': '川、鲁、粤、苏、闽、浙、湘、徽。', en: 'Sichuan, Shandong, Cantonese, Jiangsu, Fujian, Zhejiang, Hunan, Anhui.', vi: 'Tứ Xuyên, Sơn Đông, Quảng Đông, Giang Tô, Phúc Kiến, Triết Giang, Hồ Nam, An Huy.', th: 'เสฉวน ซานตง กวางตุ้ง เจียงซู ฝูเจี้ยน เจ้อเจียง หูหนาน อันฮุย', id: 'Sichuan, Shandong, Kanton, Jiangsu, Fujian, Zhejiang, Hunan, Anhui.' },
      sentences: [
        { zh: '中国有八大菜系。', pinyin: 'Zhōngguó yǒu bā dà càixì.', en: 'China has eight major cuisines.', vi: 'Trung Quốc có tám trường phái ẩm thực.', th: 'จีนมีแปดสำรับใหญ่', id: 'Tiongkok punya delapan masakan besar.' },
        { zh: '川菜以麻辣闻名。', pinyin: 'Chuāncài yǐ málà wénmíng.', en: 'Sichuan cuisine is famed for its numbing spice.', vi: 'Tứ Xuyên nổi tiếng cay tê.', th: 'อาหารเสฉวนขึ้นชื่อเรื่องเผ็ดชา', id: 'Masakan Sichuan terkenal pedas mati rasa.' },
        { zh: '粤菜讲究原汁原味。', pinyin: 'Yuècài jiǎngjiu yuánzhī yuánwèi.', en: 'Cantonese cuisine values original flavours.', vi: 'Quảng Đông coi trọng vị nguyên bản.', th: 'อาหารกวางตุ้งเน้นรสดั้งเดิม', id: 'Masakan Kanton mengutamakan rasa asli.' },
        { zh: '每个菜系都讲述地方故事。', pinyin: 'Měi gè càixì dōu jiǎngshù dìfāng gùshi.', en: 'Each cuisine tells a regional story.', vi: 'Mỗi trường phái kể câu chuyện địa phương.', th: 'แต่ละสำรับเล่าเรื่องท้องถิ่น', id: 'Setiap masakan menuturkan kisah lokal.' }
      ]
    },
    {
      slug: 'hot-pot-night',
      hsk: 1,
      title: { 'zh-CN': '火锅之夜', en: 'A Hot Pot Night', vi: 'Đêm lẩu', th: 'ค่ำคืนหม้อไฟ', id: 'Malam Hot Pot' },
      summary: { 'zh-CN': '一锅汤，朋友围坐，热气腾腾。', en: 'One pot of broth, friends around, steam rising.', vi: 'Một nồi nước dùng, bạn bè quây quần, hơi nóng bốc lên.', th: 'หม้อน้ำซุปหนึ่งใบ เพื่อนล้อมวง ควันลอย', id: 'Sepanci kuah, teman mengelilingi, uap mengepul.' },
      sentences: [
        { zh: '我们一起吃火锅。', pinyin: 'Wǒmen yìqǐ chī huǒguō.', en: 'We eat hot pot together.', vi: 'Chúng tôi cùng ăn lẩu.', th: 'พวกเรากินหม้อไฟด้วยกัน', id: 'Kami makan hot pot bersama.' },
        { zh: '锅里有牛肉和蔬菜。', pinyin: 'Guō lǐ yǒu niúròu hé shūcài.', en: 'There is beef and vegetables in the pot.', vi: 'Trong nồi có bò và rau.', th: 'ในหม้อมีเนื้อวัวและผัก', id: 'Di panci ada daging sapi dan sayur.' },
        { zh: '蘸料是麻酱加葱花。', pinyin: 'Zhànliào shì májiàng jiā cōnghuā.', en: 'The dip is sesame paste with chopped scallion.', vi: 'Nước chấm là tương vừng và hành lá.', th: 'น้ำจิ้มทำจากซอสงาและต้นหอม', id: 'Cocolannya pasta wijen dengan daun bawang.' },
        { zh: '冬天吃火锅最暖心。', pinyin: 'Dōngtiān chī huǒguō zuì nuǎn xīn.', en: 'Hot pot in winter is the warmest comfort.', vi: 'Mùa đông ăn lẩu ấm lòng nhất.', th: 'หม้อไฟในฤดูหนาวอุ่นใจที่สุด', id: 'Hot pot di musim dingin paling menghangatkan.' }
      ]
    },
    {
      slug: 'tea-ceremony-basics',
      hsk: 2,
      title: { 'zh-CN': '茶道入门', en: 'Basics of Tea Ceremony', vi: 'Nhập môn trà đạo', th: 'พื้นฐานพิธีชา', id: 'Dasar Upacara Teh' },
      summary: { 'zh-CN': '六大茶类与一壶清香。', en: 'Six tea families and one fragrant pot.', vi: 'Sáu họ trà và một ấm thơm.', th: 'หกตระกูลชาในหม้อหอมหนึ่งใบ', id: 'Enam keluarga teh dalam satu poci harum.' },
      sentences: [
        { zh: '中国有六大茶类。', pinyin: 'Zhōngguó yǒu liù dà chá lèi.', en: 'China has six major tea categories.', vi: 'Trung Quốc có sáu họ trà chính.', th: 'จีนมีชาหลักหกตระกูล', id: 'Tiongkok memiliki enam jenis teh utama.' },
        { zh: '绿茶清新，乌龙茶香醇。', pinyin: 'Lǜchá qīngxīn, wūlóngchá xiāngchún.', en: 'Green tea is fresh; oolong is mellow.', vi: 'Trà xanh tươi mát, ô long đậm thơm.', th: 'ชาเขียวสดชื่น อูหลงหอมนวล', id: 'Teh hijau segar; oolong harum lembut.' },
        { zh: '泡茶需要适合的水温。', pinyin: 'Pào chá xūyào shìhé de shuǐwēn.', en: 'Brewing tea needs the right water temperature.', vi: 'Pha trà cần nhiệt độ nước phù hợp.', th: 'การชงชาต้องใช้อุณหภูมิน้ำที่เหมาะสม', id: 'Menyeduh teh perlu suhu air yang tepat.' },
        { zh: '一杯好茶让人心静。', pinyin: 'Yī bēi hǎo chá ràng rén xīn jìng.', en: 'A good cup of tea brings a quiet mind.', vi: 'Một tách trà ngon làm dịu lòng.', th: 'ชาดีๆ หนึ่งถ้วยทำให้จิตใจสงบ', id: 'Secangkir teh bagus menenangkan hati.' }
      ]
    }
  ]
};

// For brevity, generate the remaining 10 categories with three articles each
// using a compact templating loop. Real editorial content can replace these
// later through the content factory (E16).
const FILLER_BANK = {
  scenic: [
    ['guilin-river', '桂林山水', 'Guilin Landscape', 'Phong cảnh Quế Lâm', 'ทิวทัศน์กุ้ยหลิน', 'Pemandangan Guilin'],
    ['huangshan-clouds', '黄山云海', 'Huangshan Sea of Clouds', 'Biển mây Hoàng Sơn', 'ทะเลเมฆหวงซาน', 'Lautan Awan Huangshan'],
    ['xihu-spring', '西湖春色', 'Spring at West Lake', 'Mùa xuân Tây Hồ', 'ฤดูใบไม้ผลิ ณ ทะเลสาบซีหู', 'Musim Semi di Danau Barat']
  ],
  festivals: [
    ['spring-festival', '春节团圆', 'Spring Festival Reunion', 'Đoàn viên Tết Nguyên Đán', 'รวมญาติตรุษจีน', 'Reuni Tahun Baru Imlek'],
    ['mid-autumn', '中秋月圆', 'Mid-Autumn Moon', 'Trăng Trung Thu', 'พระจันทร์ไหว้พระจันทร์', 'Bulan Pertengahan Musim Gugur'],
    ['dragon-boat', '端午龙舟', 'Dragon Boat Race', 'Đua thuyền Đoan Ngọ', 'แข่งเรือมังกร', 'Lomba Perahu Naga']
  ],
  arts: [
    ['calligraphy-stroke', '一笔之间', 'Within a Stroke', 'Trong một nét bút', 'ในขีดเดียว', 'Dalam Satu Goresan'],
    ['porcelain-blue-white', '青花瓷韵', 'Blue and White Porcelain', 'Sứ xanh trắng', 'เครื่องเคลือบขาวน้ำเงิน', 'Porselen Biru Putih'],
    ['silk-thread', '丝线之美', 'Beauty of Silk Thread', 'Vẻ đẹp sợi tơ', 'ความงามของเส้นไหม', 'Keindahan Benang Sutra']
  ],
  music: [
    ['erhu-night', '月下二胡', 'Erhu Under the Moon', 'Nhị hồ dưới trăng', 'เอ้อหูใต้แสงจันทร์', 'Erhu di Bawah Bulan'],
    ['peking-opera-faces', '京剧脸谱', 'Faces of Peking Opera', 'Mặt nạ Kinh kịch', 'หน้ากากงิ้วปักกิ่ง', 'Topeng Opera Beijing'],
    ['guzheng-river', '古筝流水', 'Guzheng like Flowing Water', 'Đàn tranh tựa dòng nước', 'กู่เจิงดั่งสายน้ำ', 'Guzheng Bagai Air Mengalir']
  ],
  literature: [
    ['journey-west', '西游故事', 'Tales from Journey to the West', 'Câu chuyện Tây Du', 'เรื่องเล่าไซอิ๋ว', 'Kisah Perjalanan ke Barat'],
    ['dream-red-mansions', '红楼一梦', 'A Dream of Red Mansions', 'Một giấc Hồng Lâu', 'ความฝันในหอแดง', 'Mimpi Loteng Merah'],
    ['three-kingdoms', '三国风云', 'Winds of Three Kingdoms', 'Gió mây Tam Quốc', 'ลมแห่งสามก๊ก', 'Angin Tiga Kerajaan']
  ],
  idioms: [
    ['draw-snake-add-feet', '画蛇添足', 'Drawing Feet on a Snake', 'Vẽ rắn thêm chân', 'วาดงูเพิ่มเท้า', 'Menggambar Kaki pada Ular'],
    ['mountain-tiger-no', '虎落平阳', 'A Tiger on the Plain', 'Hổ về đồng bằng', 'เสือลงสู่ที่ราบ', 'Harimau di Dataran'],
    ['old-horse-knows', '老马识途', 'An Old Horse Knows the Way', 'Ngựa già biết đường', 'ม้าแก่รู้ทาง', 'Kuda Tua Tahu Jalan']
  ],
  philosophy: [
    ['confucius-rectify-names', '孔子正名', 'Confucius on the Rectification of Names', 'Khổng Tử và chính danh', 'ขงจื๊อกับการตั้งชื่อให้ถูก', 'Konfusius dan Pelurusan Nama'],
    ['laozi-soft-water', '柔水之力', 'The Power of Soft Water', 'Sức mạnh của nước mềm', 'พลังของน้ำที่อ่อนโยน', 'Kekuatan Air yang Lembut'],
    ['zhuangzi-butterfly', '庄周梦蝶', 'Zhuangzi’s Butterfly Dream', 'Giấc mộng Trang Chu', 'ผีเสื้อในฝันจวงจื๊อ', 'Mimpi Kupu-kupu Zhuangzi']
  ],
  modern: [
    ['high-speed-rail', '高铁速度', 'Speed of High-Speed Rail', 'Tốc độ tàu cao tốc', 'ความเร็วรถไฟไฮสปีด', 'Kecepatan Kereta Cepat'],
    ['wechat-life', '微信生活', 'Life on WeChat', 'Cuộc sống WeChat', 'ชีวิตบนวีแชต', 'Hidup di WeChat'],
    ['shenzhen-rise', '深圳速度', 'The Shenzhen Pace', 'Nhịp độ Thâm Quyến', 'จังหวะเซินเจิ้น', 'Tempo Shenzhen']
  ],
  'fun-chinese': [
    ['four-tones-game', '四声游戏', 'A Four-Tone Game', 'Trò chơi bốn thanh', 'เกมสี่เสียงวรรณยุกต์', 'Permainan Empat Nada'],
    ['homophone-fun', '谐音趣谈', 'Fun with Homophones', 'Vui với chữ đồng âm', 'สนุกกับคำพ้องเสียง', 'Bermain Kata Senada'],
    ['net-slang-yyds', '网络流行语', 'Net Slang Today', 'Tiếng lóng mạng', 'สแลงเน็ตวันนี้', 'Slang Internet Hari Ini']
  ],
  myths: [
    ['nuwa-mends-sky', '女娲补天', 'Nuwa Mends the Sky', 'Nữ Oa vá trời', 'หนี่วาซ่อมฟ้า', 'Nuwa Memperbaiki Langit'],
    ['houyi-shoots-suns', '后羿射日', 'Houyi Shoots the Suns', 'Hậu Nghệ bắn mặt trời', 'โฮ่วอี้ยิงดวงอาทิตย์', 'Houyi Memanah Matahari'],
    ['change-flies-moon', '嫦娥奔月', 'Chang’e Flies to the Moon', 'Hằng Nga bay lên cung trăng', 'ฉางเอ๋อบินสู่ดวงจันทร์', 'Chang’e Terbang ke Bulan']
  ]
};

// Sentence template per filler article — same shape, three lines.
function buildFillerSentences(name) {
  return [
    { zh: `${name}是中国文化的一部分。`, pinyin: '', en: `${name} is part of Chinese culture.`, vi: `${name} là một phần văn hóa Trung Hoa.`, th: `${name} เป็นส่วนหนึ่งของวัฒนธรรมจีน`, id: `${name} adalah bagian dari budaya Tiongkok.` },
    { zh: `它的故事流传了很久。`, pinyin: 'Tā de gùshi liúchuán le hěn jiǔ.', en: 'Its story has been told for a long time.', vi: 'Câu chuyện của nó đã được kể từ lâu.', th: 'เรื่องราวของมันถูกเล่ามาช้านาน', id: 'Kisahnya telah dituturkan sejak lama.' },
    { zh: `今天我们仍然喜爱它。`, pinyin: 'Jīntiān wǒmen réngrán xǐ’ài tā.', en: 'Today we still cherish it.', vi: 'Hôm nay chúng ta vẫn yêu thích nó.', th: 'จนถึงวันนี้พวกเรายังคงรักมัน', id: 'Hingga kini kita masih mencintainya.' },
    { zh: `欢迎你来感受。`, pinyin: 'Huānyíng nǐ lái gǎnshòu.', en: 'You are welcome to experience it.', vi: 'Mời bạn đến cảm nhận.', th: 'ขอเชิญคุณมาสัมผัส', id: 'Silakan datang merasakannya.' }
  ];
}

const out = [];
for (const c of cats) {
  if (T[c.slug]) {
    for (const a of T[c.slug]) {
      out.push({
        slug: a.slug,
        category: c.slug,
        hsk_level: a.hsk,
        estimated_minutes: 4,
        i18n_title: a.title,
        i18n_summary: a.summary,
        body_md: '',
        sentences: a.sentences.map((s) => ({
          zh: s.zh,
          pinyin: s.pinyin || '',
          i18n: { en: s.en, vi: s.vi, th: s.th, id: s.id, 'zh-CN': s.zh }
        }))
      });
    }
  } else {
    const filler = FILLER_BANK[c.slug] || [];
    for (const [slug, zh, en, vi, th, id] of filler) {
      out.push({
        slug,
        category: c.slug,
        hsk_level: 2,
        estimated_minutes: 3,
        i18n_title: { 'zh-CN': zh, en, vi, th, id },
        i18n_summary: { 'zh-CN': `${zh}的小故事。`, en: `A short tale of ${en}.`, vi: `Câu chuyện ngắn về ${vi}.`, th: `เรื่องสั้นของ${th}`, id: `Kisah singkat ${id}.` },
        body_md: '',
        sentences: buildFillerSentences(zh).map((s) => ({
          zh: s.zh,
          pinyin: s.pinyin,
          i18n: { en: s.en.replace('${name}', en), vi: s.vi.replace('${name}', vi), th: s.th.replace('${name}', th), id: s.id.replace('${name}', id), 'zh-CN': s.zh }
        }))
      });
    }
  }
}

await writeFile(path.join(__dirname, 'articles.json'), JSON.stringify(out, null, 2), 'utf8');
console.log(`[generate] wrote ${out.length} articles`);
