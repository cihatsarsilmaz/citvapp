// Karakter replikleri: büyük kazanç, bonus girişi ve dokunma anlarında
// sahnenin üstünde kısa bir balon olarak görünür.
const LINES = {
  c: ["Kasa benim!", "İşte bu!", "Bunu bekliyordum.", "Makine benimle.", "Bir daha!"],
  win: ["Güzel.", "Devam.", "Aldık.", "Tamam, sıradaki."],
  bonus: ["Vadi beni çağırıyor.", "Aşağı iniyoruz.", "Tünel açıldı.", "Ben önden gidiyorum."],
};

export function lineFor(game, mood) {
  const pool = LINES[mood];
  if (!game || !pool || !pool.length) return "";
  return pool[Math.floor(Math.random() * pool.length)];
}
