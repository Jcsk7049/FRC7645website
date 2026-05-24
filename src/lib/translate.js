// MyMemory free API — no key needed, ~500 chars/request limit
export async function translateText(text, from = "zh", to = "en") {
  if (!text || !text.trim()) return "";

  // Split into ≤450-char chunks at sentence/newline boundaries
  const chunks = [];
  const parts = text.split(/(?<=[。！？\n])/);
  let current = "";
  for (const s of parts) {
    if ((current + s).length > 450 && current) {
      chunks.push(current.trim());
      current = s;
    } else {
      current += s;
    }
  }
  if (current.trim()) chunks.push(current.trim());

  const results = [];
  for (const chunk of chunks) {
    const res = await fetch(
      `https://api.mymemory.translated.net/get?q=${encodeURIComponent(chunk)}&langpair=${from}|${to}`
    );
    const data = await res.json();
    results.push(
      data.responseStatus === 200 ? data.responseData.translatedText : chunk
    );
    if (chunks.length > 1) await new Promise(r => setTimeout(r, 300));
  }
  return results.join(" ");
}
