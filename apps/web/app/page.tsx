"use client"

import { useState, useEffect, useRef } from "react"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000"

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void
    YT: any
  }
}

export default function HomePage() {
  const [message, setMessage] = useState("")
  const [response, setResponse] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [radioQueue, setRadioQueue] = useState<any[]>([])
  const radioQueueRef = useRef<any[]>([])
  
  const playerRef = useRef<any>(null)

  // Sync ref with state for use in event handlers
  useEffect(() => {
    radioQueueRef.current = radioQueue
  }, [radioQueue])

  // Load YouTube IFrame API
  useEffect(() => {
    if (!window.YT) {
      const tag = document.createElement("script")
      tag.src = "https://www.youtube.com/iframe_api"
      const firstScriptTag = document.getElementsByTagName("script")[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    }
  }, [])

  async function fetchRadioTracks(videoId: string) {
    // Only fetch radio tracks if the current queue is low (e.g. less than 2)
    if (radioQueueRef.current.length > 2) return

    try {
      const res = await fetch(`${API_URL}/api/radio/${videoId}`)
      const data = await res.json()
      if (data.tracks && data.tracks.length > 0) {
        // Filter out the current video and anything already in queue
        const existingIds = new Set([
          response?.track?.videoId,
          ...radioQueueRef.current.map(t => t.videoId)
        ])
        const newTracks = data.tracks.filter((t: any) => !existingIds.has(t.videoId))
        
        setRadioQueue(prev => [...prev, ...newTracks.slice(0, 10)])
      }
    } catch (err) {
      console.error("Failed to fetch radio tracks", err)
    }
  }

  async function playNextInQueue() {
    const queue = radioQueueRef.current
    if (queue.length === 0) {
      console.warn("Queue is empty, trying to fetch emergency radio...")
      if (response?.track?.videoId) fetchRadioTracks(response.track.videoId)
      return
    }

    const nextTrack = queue[0]
    setRadioQueue(prev => prev.slice(1))
    
    setResponse((prev: any) => ({
      ...prev,
      say: `自動播放：${nextTrack.title}`,
      track: nextTrack
    }))

    // If queue is getting low, fetch more radio tracks
    if (queue.length <= 3) {
      fetchRadioTracks(nextTrack.videoId)
    }
  }

  // Handle player state changes
  const onPlayerStateChange = (event: any) => {
    // event.data: 0 = ended, 1 = playing, 2 = paused, 3 = buffering, 5 = cued
    console.log("Player State Change:", event.data)
    if (event.data === 0) {
      console.log("Song ended, triggering next song...")
      playNextInQueue()
    }
  }

  // Effect to initialize or update the player when the track changes
  useEffect(() => {
    if (response?.track?.videoId && typeof window !== "undefined" && window.YT && window.YT.Player) {
      const initPlayer = () => {
        const playerElement = document.getElementById("youtube-player")
        if (!playerElement) {
          console.warn("Player element not found in DOM")
          return
        }

        if (!playerRef.current) {
          console.log("Initializing new player for:", response.track.videoId)
          playerRef.current = new window.YT.Player("youtube-player", {
            height: "100%",
            width: "100%",
            videoId: response.track.videoId,
            playerVars: {
              autoplay: 1,
              controls: 1,
              modestbranding: 1,
              rel: 0,
              origin: typeof window !== "undefined" ? window.location.origin : undefined,
            },
            events: {
              onStateChange: onPlayerStateChange,
              onReady: (e: any) => {
                console.log("Player Ready")
                e.target.playVideo()
              },
              onError: (e: any) => {
                console.error("Player Error:", e.data)
                playNextInQueue()
              }
            },
          })
        } else {
          console.log("Loading video by ID:", response.track.videoId)
          try {
            playerRef.current.loadVideoById(response.track.videoId)
          } catch (err) {
            console.error("Failed to load video, re-initializing...", err)
            playerRef.current = null
            setTimeout(initPlayer, 100)
          }
        }
      }

      // Small delay to ensure Iframe API is fully ready if it just loaded
      if (window.YT.loaded) {
        initPlayer()
      } else {
        const checkLoaded = setInterval(() => {
          if (window.YT.loaded) {
            clearInterval(checkLoaded)
            initPlayer()
          }
        }, 100)
      }

      // Start fetching radio queue whenever a new manual search result is played
      if (radioQueue.length === 0 || radioQueue[0].videoId !== response.track.videoId) {
        fetchRadioTracks(response.track.videoId)
      }
    }
  }, [response?.track?.videoId])

  async function send() {
    if (!message.trim()) return
    setLoading(true)
    setError(null)
    setRadioQueue([]) // Reset queue for new manual search
    
    try {
      const res = await fetch(`${API_URL}/api/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ message })
      })

      if (!res.ok) {
        throw new Error(`Server responded with ${res.status}`)
      }

      const data = await res.json()
      setResponse(data)
      
      // Populate the queue with other search results from the same query
      if (data.tracks && data.tracks.length > 1) {
        setRadioQueue(data.tracks.slice(1))
      } else {
        setRadioQueue([])
      }
    } catch (err: any) {
      setError(err.message || "連線失敗")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main style={{ 
      padding: "40px 20px", 
      fontFamily: "system-ui, -apple-system, sans-serif",
      maxWidth: "800px",
      margin: "0 auto",
      backgroundColor: "#0f172a",
      color: "#f8fafc",
      minHeight: "100vh"
    }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px", color: "#38bdf8" }}>
        🎧 MUSIC DJ AGENT
      </h1>

      <div style={{ 
        display: "flex", 
        gap: "12px", 
        padding: "20px",
        backgroundColor: "#1e293b",
        borderRadius: "12px",
        boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)"
      }}>
        <input
          style={{ 
            flex: 1, 
            padding: "12px 16px", 
            borderRadius: "8px", 
            border: "1px solid #334155",
            backgroundColor: "#0f172a",
            color: "#f8fafc",
            outline: "none"
          }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="例如：放點深夜 chill 的音樂..."
          onKeyDown={(e) => e.key === "Enter" && send()}
        />

        <button 
          onClick={send} 
          disabled={loading}
          style={{ 
            padding: "12px 24px", 
            borderRadius: "8px", 
            border: "none",
            backgroundColor: loading ? "#64748b" : "#38bdf8",
            color: "#0f172a",
            fontWeight: "bold",
            cursor: loading ? "not-allowed" : "pointer",
            transition: "all 0.2s"
          }}
        >
          {loading ? "搜尋中..." : "發送"}
        </button>
      </div>

      {error && (
        <div style={{ 
          marginTop: "20px", 
          padding: "12px", 
          backgroundColor: "#450a0a", 
          color: "#fca5a5",
          borderRadius: "8px",
          textAlign: "center"
        }}>
          ⚠️ {error}
        </div>
      )}

      {/* Player Section - Always in DOM for stability */}
      <div style={{ 
        display: response?.track ? "block" : "none",
        marginTop: "40px", 
        padding: "30px",
        backgroundColor: "#1e293b",
        borderRadius: "16px",
        animation: "fadeIn 0.5s ease-out"
      }}>
        <h2 style={{ color: "#38bdf8", marginBottom: "15px" }}>{response?.say}</h2>

        <div style={{ marginBottom: "20px", padding: "15px", backgroundColor: "#0f172a", borderRadius: "8px" }}>
          <div style={{ fontSize: "18px", fontWeight: "bold" }}>{response?.track?.title}</div>
          <div style={{ color: "#94a3b8" }}>{response?.track?.artist}</div>
          {response?.track?.album && (
            <div style={{ fontSize: "14px", color: "#64748b", marginTop: "4px" }}>
              專輯：{response.track.album}
            </div>
          )}
        </div>

        <div style={{ 
          position: "relative", 
          paddingBottom: "56.25%", 
          height: 0, 
          overflow: "hidden",
          borderRadius: "12px",
          backgroundColor: "#000"
        }}>
          <div id="youtube-player" style={{ 
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%"
          }} />
        </div>

        {radioQueue.length > 0 && (
          <div style={{ marginTop: "20px" }}>
            <h3 style={{ fontSize: "14px", color: "#64748b", textTransform: "uppercase", letterSpacing: "1px" }}>
              📻 電台模式：即將播放
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              {radioQueue.slice(0, 3).map((track, i) => (
                <div key={track.videoId + i} style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "10px", 
                  fontSize: "14px",
                  padding: "8px",
                  backgroundColor: "#0f172a",
                  borderRadius: "6px"
                }}>
                  <span style={{ color: "#38bdf8", fontWeight: "bold" }}>{i + 1}</span>
                  <div style={{ flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {track.title} <span style={{ color: "#64748b" }}>- {track.artist}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <button 
          onClick={() => { setResponse(null); setMessage(""); setRadioQueue([]); }}
          style={{ 
            marginTop: "30px",
            padding: "8px 16px",
            backgroundColor: "transparent",
            border: "1px solid #334155",
            color: "#94a3b8",
            borderRadius: "6px",
            cursor: "pointer"
          }}
        >
          清除結果
        </button>
      </div>

      {!response && !loading && (
        <div style={{ textAlign: "center", marginTop: "100px", color: "#475569" }}>
          <div style={{ fontSize: "48px", marginBottom: "20px" }}>📻</div>
          <p>準備好聽點什麼了嗎？</p>
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        body { margin: 0; background-color: #0f172a; }
      `}</style>
    </main>
  )
}