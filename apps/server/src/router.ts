export function detectIntent(message: string) {
  const m = message.toLowerCase()
  const keywords = ["放", "聽", "play", "music", "song", "音樂", "歌", "來點", "點"]
  
  if (keywords.some(k => m.includes(k))) {
    return "play_music"
  }

  // If message length is > 2 and contains typical artist/song names, we might want to treat it as music
  // But for now, let's stick to explicit keywords to avoid false positives
  return "chat"
}