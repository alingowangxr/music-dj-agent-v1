import YTMusic from "ytmusic-api"

let ytmusic: YTMusic | null = null

async function getClient() {
  if (!ytmusic) {
    console.log("[Music] Initializing new YTMusic client...")
    ytmusic = new YTMusic()
    await ytmusic.initialize()
    console.log("[Music] YTMusic client initialized.")
  }
  return ytmusic
}

export async function searchTrack(query: string) {
  if (!query || query.trim() === "") {
    console.warn("[Music] Empty search query received.")
    return []
  }

  console.log(`[Music] Searching for: "${query}"`)
  try {
    const client = await getClient()
    const songs = await client.searchSongs(query)
    
    console.log(`[Music] Search results for "${query}": ${songs.length} items found.`)

    if (songs.length === 0) {
      return []
    }

    // Map all found songs to our standard format
    return songs.map(song => ({
      title: song.name,
      artist: song.artist?.name || "Unknown Artist",
      videoId: song.videoId,
      album: song.album?.name ?? null,
    }))
  } catch (err) {
    console.error("[Music] YouTube Music search failed:", err)
    ytmusic = null
    return []
  }
}

export async function getNextTracks(videoId: string) {
  console.log(`[Music] Getting radio tracks for: ${videoId}`)
  try {
    const client = await getClient()
    const upNexts = await client.getUpNexts(videoId)

    if (upNexts && upNexts.length > 0) {
      console.log(`[Music] First related track sample:`, JSON.stringify(upNexts[0], null, 2))
    }

    // Map to our standard track format
    return upNexts.map(song => ({
      title: song.title || song.name || "Unknown Title",
      artist: song.artists || song.artist?.name || (typeof song.artist === 'string' ? song.artist : "Unknown Artist"),
      videoId: song.videoId,
      album: null,
    }))
  } catch (err) {
    console.error("[Music] Failed to get next tracks:", err)
    return []
  }
}