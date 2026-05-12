import dotenv from "dotenv"
dotenv.config()


import express from "express"
import cors from "cors"

import { detectIntent } from "./router.js"
import { generateDJResponse, getCurrentProvider } from "./llm.js"
import { searchTrack, getNextTracks } from "./music.js"

const app = express()

app.use(cors())
app.use(express.json())

app.get("/", (_req, res) => {
  const { provider, model } = getCurrentProvider()
  res.json({
    name: "music-dj-agent",
    status: "ok",
    llm: { provider, model }
  })
})

app.post("/api/chat", async (req, res) => {
  const { message } = req.body
  console.log(`[Chat] User message: "${message}"`)

  const intent = detectIntent(message)
  console.log(`[Chat] Detected intent: ${intent}`)

  if (intent !== "play_music") {
    return res.json({
      say: "今晚想聽什麼？"
    })
  }

  try {
    const dj = await generateDJResponse(message)
    console.log(`[Chat] LLM Response:`, dj)

    const tracks = await searchTrack(dj.search)
    console.log(`[Chat] Search Results count for "${dj.search}": ${tracks.length}`)

    if (tracks.length === 0) {
      return res.json({
        say: dj.say || "抱歉，在 YouTube Music 上找不到這首歌",
        track: null,
        tracks: []
      })
    }

    res.json({
      say: dj.say,
      track: tracks[0],
      tracks: tracks.slice(0, 5) // Return top 5 search results
    })
  } catch (err) {
    console.error(`[Chat] Error:`, err)
    res.status(500).json({ say: "伺服器發生錯誤" })
  }
})

app.get("/api/radio/:videoId", async (req, res) => {
  const { videoId } = req.params
  const tracks = await getNextTracks(videoId)
  res.json({ tracks })
})

const port = process.env.PORT || 4000
const llm = getCurrentProvider()

app.listen(port, () => {
  console.log(`Server running on ${port}`)
  console.log(`LLM: ${llm.provider} / ${llm.model}`)
})