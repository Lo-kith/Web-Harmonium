"use client"

import { useState, useEffect, useRef, useCallback } from "react"
import {
  FaVolumeHigh,
  FaBookOpen,
  FaGear,
  FaAward,
  FaInfo,
  FaHeadphones,
  FaArrowRotateLeft,
  FaGithub,
  FaLinkedin,
  FaInstagram,
  FaFacebook,
  FaTwitter,
  FaGlobe,
  FaEnvelope,
  FaPlus,
  FaArrowUp,
  FaUsers,
  FaCodepen,
  FaMusic,
  FaKeyboard,
  FaSun,
  FaMoon,
  FaQuestion,
} from "react-icons/fa6"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useTheme } from "next-themes"

interface AudioContextType extends AudioContext {
  createGain(): GainNode
  createBufferSource(): AudioBufferSourceNode
  createConvolver(): ConvolverNode
  decodeAudioData(audioData: ArrayBuffer): Promise<AudioBuffer>
}

export default function WebHarmonium() {
  const { theme, setTheme } = useTheme()
  const [isLoaded, setIsLoaded] = useState(false)
  const [volume, setVolume] = useState(80)
  const [useReverb, setUseReverb] = useState(false)
  const [transpose, setTranspose] = useState(0)
  const [currentOctave, setCurrentOctave] = useState(3)
  const [additionalReeds, setAdditionalReeds] = useState(0)
  const [midiDevices, setMidiDevices] = useState<any[]>([])
  const [selectedMidiDevice, setSelectedMidiDevice] = useState<string>("")
  const [midiSupported, setMidiSupported] = useState(false)
  const [showGuide, setShowGuide] = useState(false)
  const [showShortcuts, setShowShortcuts] = useState(false)

  const audioContextRef = useRef<AudioContextType | null>(null)
  const audioBufferRef = useRef<AudioBuffer | null>(null)
  const reverbBufferRef = useRef<AudioBuffer | null>(null)
  const gainNodeRef = useRef<GainNode | null>(null)
  const reverbNodeRef = useRef<ConvolverNode | null>(null)
  const sourceNodesRef = useRef<(AudioBufferSourceNode | null)[]>([])
  const sourceNodeStateRef = useRef<number[]>([])

  const keyboardMap: { [key: string]: number } = {
    s: 53,
    S: 53,
    a: 54,
    A: 54,
    "`": 55,
    "1": 56,
    q: 57,
    Q: 57,
    "2": 58,
    w: 59,
    W: 59,
    e: 60,
    E: 60,
    "4": 61,
    r: 62,
    R: 62,
    "5": 63,
    t: 64,
    T: 64,
    y: 65,
    Y: 65,
    "7": 66,
    u: 67,
    U: 67,
    "8": 68,
    i: 69,
    I: 69,
    "9": 70,
    o: 71,
    O: 71,
    p: 72,
    P: 72,
    "-": 73,
    "[": 74,
    "=": 75,
    "]": 76,
    "\\": 77,
    "'": 78,
    ";": 79,
  }

  const octaveMap = [-36, -24, -12, 0, 12, 24, 36]
  const baseKeyNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
  const keyMap = useRef<number[]>([])
  const baseKeyMap = useRef<number[]>([])

  // Check if guide has been shown before
  useEffect(() => {
    const hasSeenGuide = localStorage.getItem("harmonium-guide-seen")
    if (!hasSeenGuide && isLoaded) {
      setShowGuide(true)
      localStorage.setItem("harmonium-guide-seen", "true")
    }
  }, [isLoaded])

  const initializeAudio = useCallback(async () => {
    try {
      const AudioContext = window.AudioContext || (window as any).webkitAudioContext
      audioContextRef.current = new AudioContext()

      gainNodeRef.current = audioContextRef.current.createGain()
      gainNodeRef.current.gain.value = volume / 100
      gainNodeRef.current.connect(audioContextRef.current.destination)

      reverbNodeRef.current = audioContextRef.current.createConvolver()
      reverbNodeRef.current.connect(audioContextRef.current.destination)

      try {
        const harmoniumResponse = await fetch(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/harmonium-kannan-orig-6DIgVWUXlXjskJRcrUvRNLUBNigcyy.wav",
        )
        if (!harmoniumResponse.ok) {
          throw new Error(`HTTP error! status: ${harmoniumResponse.status}`)
        }
        const harmoniumArrayBuffer = await harmoniumResponse.arrayBuffer()
        audioBufferRef.current = await audioContextRef.current.decodeAudioData(harmoniumArrayBuffer)
      } catch (audioError) {
        console.warn("Could not load harmonium sample, using fallback:", audioError)
        const sampleRate = audioContextRef.current.sampleRate
        const duration = 2
        const buffer = audioContextRef.current.createBuffer(1, sampleRate * duration, sampleRate)
        const data = buffer.getChannelData(0)
        for (let i = 0; i < data.length; i++) {
          data[i] = Math.sin((2 * Math.PI * 440 * i) / sampleRate) * 0.1
        }
        audioBufferRef.current = buffer
      }

      try {
        const reverbResponse = await fetch(
          "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/reverb-OkQQ8iqL5OAhhMOQOXryBDa6TDHb1a.wav",
        )
        if (reverbResponse.ok) {
          const reverbArrayBuffer = await reverbResponse.arrayBuffer()
          reverbBufferRef.current = await audioContextRef.current.decodeAudioData(reverbArrayBuffer)
          reverbNodeRef.current.buffer = reverbBufferRef.current
        }
      } catch (reverbError) {
        console.warn("Could not load reverb sample:", reverbError)
      }

      initializeKeyMap()
      initializeSourceNodes()

      setTimeout(() => setIsLoaded(true), 2500)
    } catch (error) {
      console.error("Error initializing audio:", error)
      setTimeout(() => setIsLoaded(true), 2500)
    }
  }, [volume])

  const initializeKeyMap = useCallback(() => {
    const middleC = 60
    const rootKey = 62
    const startKey = middleC - 124 + (rootKey - middleC)

    for (let i = 0; i < 128; i++) {
      baseKeyMap.current[i] = startKey + i
      keyMap.current[i] = baseKeyMap.current[i] + transpose
    }
  }, [transpose])

  const stopAllVoices = useCallback(() => {
    if (!sourceNodesRef.current || !sourceNodeStateRef.current) return

    for (let i = 0; i < sourceNodesRef.current.length; i++) {
      const node = sourceNodesRef.current[i]
      if (node && sourceNodeStateRef.current[i] === 1) {
        try {
          node.stop(0)
        } catch (e) {}
        sourceNodeStateRef.current[i] = 0
      }
    }
  }, [])

  // Helper function to create or reset a source node for a specific index
  const setSourceNode = useCallback(
    (index: number) => {
      if (!audioContextRef.current || !audioBufferRef.current || !gainNodeRef.current) {
        return
      }

      // If there's a playing node, stop it before resetting
      if (sourceNodesRef.current[index] && sourceNodeStateRef.current[index] === 1) {
        try {
          sourceNodesRef.current[index]?.stop(0)
        } catch (e) {}
        sourceNodeStateRef.current[index] = 0 // Mark as stopped
      }

      const src = audioContextRef.current.createBufferSource()
      src.buffer = audioBufferRef.current
      src.loop = true
      src.loopStart = 0.5
      src.loopEnd = 7.5

      // Apply detune for this key
      if (keyMap.current[index] !== 0) {
        src.detune.value = keyMap.current[index] * 100
      }

      // Route through gain (reverb routing handled centrally via useEffect)
      src.connect(gainNodeRef.current)

      sourceNodesRef.current[index] = src
    },
    [keyMap],
  ) // Include keyMap as it's used internally

  const initializeSourceNodes = useCallback(() => {
    if (!audioContextRef.current || !audioBufferRef.current) return

    // Ensure any playing voices are stopped before resetting
    stopAllVoices()

    sourceNodesRef.current = new Array(128).fill(null)
    sourceNodeStateRef.current = new Array(128).fill(0)

    for (let i = 0; i < 128; i++) {
      setSourceNode(i)
    }
  }, [stopAllVoices, setSourceNode])

  const noteOn = useCallback(
    (note: number) => {
      const index = note + octaveMap[currentOctave]
      if (index < sourceNodesRef.current.length && sourceNodeStateRef.current[index] === 0) {
        sourceNodesRef.current[index]?.start(0)
        sourceNodeStateRef.current[index] = 1
      }

      for (let c = 1; c <= additionalReeds; c++) {
        const additionalIndex = note + octaveMap[currentOctave + c]
        if (additionalIndex < sourceNodesRef.current.length && sourceNodeStateRef.current[additionalIndex] === 0) {
          sourceNodesRef.current[additionalIndex]?.start(0)
          sourceNodeStateRef.current[additionalIndex] = 1
        }
      }
    },
    [currentOctave, additionalReeds],
  )

  const noteOff = useCallback(
    (note: number) => {
      const index = note + octaveMap[currentOctave]
      if (index < sourceNodesRef.current.length) {
        setSourceNode(index)
      }

      for (let c = 1; c <= additionalReeds; c++) {
        const additionalIndex = note + octaveMap[currentOctave + c]
        if (additionalIndex < sourceNodesRef.current.length) {
          setSourceNode(additionalIndex)
        }
      }
    },
    [currentOctave, additionalReeds, setSourceNode],
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.repeat || !isLoaded) return

      const key = event.key
      const ctrlKey = event.ctrlKey
      const altKey = event.altKey

      // Control shortcuts - NEW SHORTCUTS
      if (altKey && !ctrlKey) {
        event.preventDefault()
        switch (key.toLowerCase()) {
          case "arrowup":
            setVolume((prev) => Math.min(100, prev + 5))
            return
          case "arrowdown":
            setVolume((prev) => Math.max(0, prev - 5))
            return
        }
      }

      if (ctrlKey && altKey) {
        event.preventDefault()
        switch (key.toLowerCase()) {
          case "arrowup":
            setCurrentOctave((prev) => Math.min(6, prev + 1))
            return
          case "arrowdown":
            setCurrentOctave((prev) => Math.max(0, prev - 1))
            return
          case "r":
            setUseReverb((prev) => !prev)
            return
          case "arrowleft":
            setTranspose((prev) => Math.max(-11, prev - 1))
            return
          case "arrowright":
            setTranspose((prev) => Math.min(11, prev + 1))
            return
          case "=":
          case "+":
            setAdditionalReeds((prev) => Math.min(6 - currentOctave, prev + 1))
            return
          case "-":
            setAdditionalReeds((prev) => Math.max(0, prev - 1))
            return
        }
      }

      // Musical keys
      if (keyboardMap[key] !== undefined) {
        noteOn(keyboardMap[key])
      }
    },
    [isLoaded, noteOn, currentOctave],
  )

  const handleKeyUp = useCallback(
    (event: KeyboardEvent) => {
      if (!isLoaded) return

      const key = event.key
      if (keyboardMap[key] !== undefined) {
        noteOff(keyboardMap[key])
      }
    },
    [isLoaded, noteOff],
  )

  const initializeMIDI = useCallback(async () => {
    if (typeof navigator === "undefined" || typeof navigator.requestMIDIAccess !== "function") {
      setMidiSupported(false)
      return
    }

    try {
      const midiAccess = await navigator.requestMIDIAccess({ sysex: false })
      setMidiSupported(true)

      const devices: any[] = []
      for (const input of midiAccess.inputs.values()) {
        devices.push({
          id: input.id,
          name: input.name,
          manufacturer: input.manufacturer,
        })

        input.onmidimessage = (message: any) => {
          if (selectedMidiDevice === input.id || selectedMidiDevice === "") {
            const [command, note, velocity = 0] = message.data
            if (command === 144 && velocity > 0) noteOn(note)
            else if (command === 128 || (command === 144 && velocity === 0)) noteOff(note)
          }
        }
      }
      setMidiDevices(devices)
    } catch (err) {
      console.warn("WebMIDI disabled:", err)
      setMidiSupported(false)
    }
  }, [selectedMidiDevice, noteOn, noteOff])

  useEffect(() => {
    initializeAudio()
    initializeMIDI()
  }, [initializeAudio, initializeMIDI])

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown)
    window.addEventListener("keyup", handleKeyUp)

    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      window.removeEventListener("keyup", handleKeyUp)
    }
  }, [handleKeyDown, handleKeyUp])

  useEffect(() => {
    if (gainNodeRef.current) {
      gainNodeRef.current.gain.value = volume / 100
    }
  }, [volume])

  useEffect(() => {
    initializeKeyMap()
    initializeSourceNodes()
  }, [transpose, initializeKeyMap, initializeSourceNodes])

  useEffect(() => {
    if (gainNodeRef.current && reverbNodeRef.current) {
      if (useReverb) {
        try {
          gainNodeRef.current.connect(reverbNodeRef.current)
        } catch (e) {}
      } else {
        try {
          gainNodeRef.current.disconnect(reverbNodeRef.current)
        } catch (e) {}
      }
    }
  }, [useReverb])

  // New effect to stop all voices on parameter change that could cause stuck notes
  useEffect(() => {
    if (!audioContextRef.current) return
    stopAllVoices()
    initializeSourceNodes()
  }, [volume, useReverb, transpose, currentOctave, additionalReeds, stopAllVoices, initializeSourceNodes])

  // Stop all voices when the window loses focus
  useEffect(() => {
    const onBlur = () => stopAllVoices()
    window.addEventListener("blur", onBlur)
    return () => {
      window.removeEventListener("blur", onBlur)
    }
  }, [stopAllVoices])

  const getRootNoteName = () => {
    return baseKeyNames[transpose >= 0 ? transpose % 12 : transpose + 12]
  }

  const HarmoniumKeys = () => {
    const keys = [
      { key: "1", type: "black", note: "Ṗ" },
      { key: "q", type: "white", note: "Ḍ", keyName: "D" },
      { key: "2", type: "black", note: "Ḍ" },
      { key: "w", type: "white", note: "Ṇ", keyName: "E" },
      { key: "e", type: "white", note: "Ṇ", keyName: "F" },
      { key: "4", type: "black", note: "S" },
      { key: "r", type: "white", note: "R", keyName: "G" },
      { key: "5", type: "black", note: "R" },
      { key: "t", type: "white", note: "G", keyName: "A" },
      { key: "y", type: "white", note: "G", keyName: "B" },
      { key: "7", type: "black", note: "M" },
      { key: "u", type: "white", note: "M", keyName: "C" },
      { key: "8", type: "black", note: "P" },
      { key: "i", type: "white", note: "D", keyName: "D" },
      { key: "9", type: "black", note: "D" },
      { key: "o", type: "white", note: "N", keyName: "E" },
      { key: "p", type: "white", note: "N", keyName: "F" },
      { key: "-", type: "black", note: "Ṡ" },
      { key: "[", type: "white", note: "Ṙ", keyName: "G" },
      { key: "=", type: "black", note: "Ṙ" },
      { key: "]", type: "white", note: "Ġ", keyName: "A" },
      { key: "\\", type: "white", note: "Ġ", keyName: "B" },
    ]

    const handlePointerDown = (keyboardKey: string) => {
      const note = keyboardMap[keyboardKey]
      if (note !== undefined) {
        noteOn(note)
      }
    }

    const handlePointerUp = (keyboardKey: string) => {
      const note = keyboardMap[keyboardKey]
      if (note !== undefined) {
        noteOff(note)
      }
    }

    return (
      <div className="mb-6 flex justify-center sm:mb-8">
        <div className="w-full max-w-6xl px-2 sm:px-0">
          <div className="glass-card glass-card-hover overflow-hidden rounded-3xl border-2 p-4 sm:p-6">
            <div className="relative overflow-x-auto rounded-xl border-2 border-gray-700 bg-gradient-to-b from-gray-800 via-gray-900 to-black p-3 shadow-inner sm:p-4">
              <div className="flex justify-center overflow-auto">
                <div className="relative flex min-h-40 min-w-max">
                  {keys.map((keyData) => {
                    const isWhite = keyData.type === "white"
                    const k = keyData.key
                    return (
                      <div
                        key={k}
                        className={`relative ${isWhite ? "z-10" : "z-20"}`}
                        style={{
                          marginLeft: isWhite ? "0" : "-12px",
                          marginRight: isWhite ? "0" : "-12px",
                        }}
                      >
                        <div
                          role="button"
                          tabIndex={0}
                          onMouseDown={() => handlePointerDown(k)}
                          onMouseUp={() => handlePointerUp(k)}
                          onMouseLeave={() => handlePointerUp(k)}
                          onTouchStart={(e) => {
                            e.preventDefault()
                            handlePointerDown(k)
                          }}
                          onTouchEnd={(e) => {
                            e.preventDefault()
                            handlePointerUp(k)
                          }}
                          onTouchCancel={(e) => {
                            e.preventDefault()
                            handlePointerUp(k)
                          }}
                          className={` ${isWhite ? "h-28 w-10 sm:h-32 sm:w-12" : "h-18 w-7 sm:h-20 sm:w-8"} ${
                            isWhite
                              ? "border border-gray-300 bg-gradient-to-b from-white via-gray-50 to-gray-100 shadow-md hover:shadow-lg hover:shadow-blue-200"
                              : "border border-gray-600 bg-gradient-to-b from-gray-800 via-gray-900 to-black shadow-lg hover:shadow-xl hover:shadow-purple-400"
                          } flex cursor-pointer select-none flex-col justify-between rounded-md p-1 transition-all duration-150 hover:scale-105 sm:p-2`}
                        >
                          <div className="text-center">
                            <div
                              className={`rounded px-1 py-0.5 text-xs font-bold ${
                                isWhite ? "bg-gray-800 text-white" : "bg-white/20 text-gray-200"
                              } `}
                            >
                              {keyData.key}
                            </div>
                          </div>

                          <div className="flex flex-1 flex-col justify-center text-center">
                            <div
                              className={`text-sm font-bold sm:text-base ${
                                isWhite ? "text-blue-600" : "text-cyan-300"
                              }`}
                            >
                              {keyData.note}
                            </div>
                          </div>

                          {isWhite && (
                            <div className="text-center">
                              <div className="rounded bg-green-100 px-1 py-0.5 text-xs font-bold text-green-700">
                                {keyData.keyName}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Keyboard Shortcuts Dialog
  const ShortcutsDialog = () => (
    <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
      <DialogContent className="glass-card m-auto mx-2 max-h-[90vh] max-w-[95vw] overflow-y-auto border-2 border-blue-200 dark:border-blue-700 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-center text-2xl font-bold text-transparent sm:text-3xl">
            ⌨️ Keyboard Shortcuts
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="glass-card rounded-xl border border-blue-200 p-6 dark:border-blue-700">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-blue-800 dark:text-blue-200">
              <FaVolumeHigh className="h-5 w-5" />
              Volume Control
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-blue-50 p-3 dark:bg-blue-900/30">
                <span>Increase Volume</span>
                <Badge className="bg-blue-500 text-white">Alt + ↑</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-blue-50 p-3 dark:bg-blue-900/30">
                <span>Decrease Volume</span>
                <Badge className="bg-blue-500 text-white">Alt + ↓</Badge>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-green-200 p-6 dark:border-green-700">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-green-800 dark:text-green-200">
              <FaGear className="h-5 w-5" />
              Reverb Toggle
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-green-50 p-3 dark:bg-green-900/30">
                <span>Toggle Reverb</span>
                <Badge className="bg-green-500 text-white">Ctrl + Alt + R</Badge>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-purple-200 p-6 dark:border-purple-700">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-purple-800 dark:text-purple-200">
              <FaMusic className="h-5 w-5" />
              Transpose
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-purple-50 p-3 dark:bg-purple-900/30">
                <span>Transpose Up</span>
                <Badge className="bg-purple-500 text-white">Ctrl + Alt + →</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-purple-50 p-3 dark:bg-purple-900/30">
                <span>Transpose Down</span>
                <Badge className="bg-purple-500 text-white">Ctrl + Alt + ←</Badge>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-orange-200 p-6 dark:border-orange-700">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-orange-800 dark:text-orange-200">
              <FaArrowUp className="h-5 w-5" />
              Octave Control
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-orange-50 p-3 dark:bg-orange-900/30">
                <span>Octave Up</span>
                <Badge className="bg-orange-500 text-white">Ctrl + Alt + ↑</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-orange-50 p-3 dark:bg-orange-900/30">
                <span>Octave Down</span>
                <Badge className="bg-orange-500 text-white">Ctrl + Alt + ↓</Badge>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-red-200 p-6 dark:border-red-700">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-red-800 dark:text-red-200">
              <FaPlus className="h-5 w-5" />
              Additional Reeds
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded-md bg-red-50 p-3 dark:bg-red-900/30">
                <span>Add Reed</span>
                <Badge className="bg-red-500 text-white">Ctrl + Alt + +</Badge>
              </div>
              <div className="flex items-center justify-between rounded-md bg-red-50 p-3 dark:bg-red-900/30">
                <span>Remove Reed</span>
                <Badge className="bg-red-500 text-white">Ctrl + Alt + -</Badge>
              </div>
            </div>
          </div>

          <div className="glass-card rounded-xl border border-teal-200 p-6 dark:border-teal-700">
            <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-teal-800 dark:text-teal-200">
              <FaKeyboard className="h-5 w-5" />
              Musical Keys
            </h3>
            <div className="space-y-2 text-sm">
              <div className="rounded-md bg-teal-50 p-3 dark:bg-teal-900/30">
                <div className="mb-1 font-semibold">White Keys:</div>
                <div className="font-mono text-xs">` q w e r t y u i o p [ ] \</div>
              </div>
              <div className="rounded-md bg-teal-50 p-3 dark:bg-teal-900/30">
                <div className="mb-1 font-semibold">Black Keys:</div>
                <div className="font-mono text-xs">1 2 4 5 7 8 9 - =</div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Button
            onClick={() => setShowShortcuts(false)}
            className="rounded-xl bg-gradient-to-r from-blue-500 to-purple-500 px-8 py-3 text-lg font-semibold text-white shadow-lg hover:from-blue-600 hover:to-purple-600"
          >
            Got it! 🎹
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  // Enhanced Guide Dialog with more information
  const GuideDialog = () => (
    <Dialog open={showGuide} onOpenChange={setShowGuide}>
      <DialogContent className="glass-card m-auto mx-2 max-h-[90vh] max-w-[95vw] overflow-y-auto border-2 border-amber-200 dark:border-amber-700 sm:max-w-4xl">
        <DialogHeader>
          <DialogTitle className="mb-4 bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-center text-2xl font-bold text-transparent sm:text-3xl">
            🎹 Complete Harmonium Guide
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          {/* Keyboard Controls */}
          <div className="glass-card glass-card-hover rounded-2xl border border-blue-200 p-4 dark:border-blue-700 sm:p-6">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <div className="rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 p-2 shadow-lg sm:p-3">
                <FaKeyboard className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg font-bold text-blue-800 dark:text-blue-200 sm:text-xl">Keyboard Layout</h3>
            </div>
            <div className="space-y-2 text-gray-700 dark:text-gray-300 sm:space-y-3">
              <p className="text-xs font-medium sm:text-sm">
                <span className="font-bold text-blue-600 dark:text-blue-400">White Keys:</span>
                <br />` q w e r t y u i o p [ ] \
              </p>
              <p className="text-xs font-medium sm:text-sm">
                <span className="font-bold text-cyan-600 dark:text-cyan-400">Black Keys:</span>
                <br />1 2 4 5 7 8 9 - =
              </p>
              <div className="glass-card rounded-xl border border-blue-200 p-2 dark:border-blue-700 sm:p-3">
                <p className="text-xs italic text-blue-700 dark:text-blue-300">
                  Each key displays keyboard shortcut, Sargam notation, and Western notes for easy learning
                </p>
              </div>
            </div>
          </div>

          {/* Sargam System */}
          <div className="glass-card glass-card-hover rounded-2xl border border-purple-200 p-4 dark:border-purple-700 sm:p-6">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-2 shadow-lg sm:p-3">
                <FaMusic className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg font-bold text-purple-800 dark:text-purple-200 sm:text-xl">Sargam System</h3>
            </div>
            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300 sm:text-sm">
              <div className="grid grid-cols-1 gap-1">
                <p>
                  <span className="font-bold text-red-600">Sa (S)</span> - Tonic, foundation note (Do)
                </p>
                <p>
                  <span className="font-bold text-orange-600">Re (R)</span> - Second, melodic movement (Re)
                </p>
                <p>
                  <span className="font-bold text-yellow-600">Ga (G)</span> - Third, harmonic color (Mi)
                </p>
                <p>
                  <span className="font-bold text-green-600">Ma (M)</span> - Fourth, perfect interval (Fa)
                </p>
                <p>
                  <span className="font-bold text-blue-600">Pa (P)</span> - Fifth, dominant stable (Sol)
                </p>
                <p>
                  <span className="font-bold text-indigo-600">Dha (D)</span> - Sixth, subdominant (La)
                </p>
                <p>
                  <span className="font-bold text-purple-600">Ni (N)</span> - Seventh, leading tone (Ti)
                </p>
              </div>
            </div>
          </div>

          {/* Playing Techniques */}
          <div className="glass-card glass-card-hover rounded-2xl border border-orange-200 p-4 dark:border-orange-700 sm:p-6">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <div className="rounded-xl bg-gradient-to-br from-orange-500 to-red-500 p-2 shadow-lg sm:p-3">
                <FaGear className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg font-bold text-orange-800 dark:text-orange-200 sm:text-xl">Playing Techniques</h3>
            </div>
            <ul className="list-none space-y-2 text-xs text-gray-700 dark:text-gray-300 sm:text-sm">
              <li className="flex items-start gap-2">
                <span className="font-bold text-red-500">•</span>
                <div>
                  <strong>Meend:</strong> Smooth gliding between notes for emotional expression
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-orange-500">•</span>
                <div>
                  <strong>Gamak:</strong> Rapid oscillation between adjacent notes
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-yellow-500">•</span>
                <div>
                  <strong>Kan:</strong> Quick grace notes for ornamentation
                </div>
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold text-green-500">•</span>
                <div>
                  <strong>Andolan:</strong> Gentle vibrato for expression
                </div>
              </li>
            </ul>
          </div>

          {/* Technical Specifications */}
          <div className="glass-card glass-card-hover rounded-2xl border border-teal-200 p-4 dark:border-teal-700 sm:p-6">
            <div className="mb-3 flex items-center gap-2 sm:mb-4 sm:gap-3">
              <div className="rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 p-2 shadow-lg sm:p-3">
                <FaInfo className="h-4 w-4 text-white sm:h-6 sm:w-6" />
              </div>
              <h3 className="text-lg font-bold text-teal-800 dark:text-teal-200 sm:text-xl">Technical Details</h3>
            </div>
            <div className="space-y-2 text-xs text-gray-700 dark:text-gray-300 sm:text-sm">
              <p>
                <strong>Reed System:</strong> Free reeds made of brass or steel
              </p>
              <p>
                <strong>Keyboard:</strong> Usually 3-4 octaves (36-48 keys)
              </p>
              <p>
                <strong>Bellows:</strong> Hand-operated air supply system
              </p>
              <p>
                <strong>Tuning:</strong> Fixed tuning, usually in C major
              </p>
              <p>
                <strong>Stops:</strong> Multiple reed sets for different timbres
              </p>
            </div>
          </div>
        </div>

        <div className="mt-4 text-center sm:mt-6">
          <Button
            onClick={() => setShowGuide(false)}
            className="w-full rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-2 text-base font-semibold text-white shadow-lg hover:from-amber-600 hover:to-orange-600 sm:w-auto sm:px-8 sm:py-3 sm:text-lg"
          >
            Start Playing! 🎵
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )

  if (!isLoaded) {
    return (
      <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-purple-100 via-pink-100 to-orange-100 dark:from-gray-900 dark:via-purple-900/20 dark:to-pink-900/20">
        <div className="glass-card z-10 mx-4 max-w-md rounded-3xl border-2 p-12 text-center shadow-2xl">
          <div className="relative mb-8">
            <div className="relative mx-auto h-24 w-24">
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-purple-400/40"></div>
              <div
                className="absolute inset-2 animate-spin rounded-full border-4 border-pink-600/60"
                style={{
                  animationDirection: "reverse",
                  animationDuration: "1.5s",
                }}
              ></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <FaMusic className="h-10 w-10 animate-pulse text-purple-600" />
              </div>
            </div>
          </div>

          <h2 className="mb-4 animate-pulse bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent">
            🎵 Loading Harmonium
          </h2>
          <p className="mb-6 text-lg text-purple-700 dark:text-purple-300">Preparing authentic sounds...</p>

          <div className="mb-4 h-2 w-full rounded-full bg-purple-200/30">
            <div
              className="h-2 animate-pulse rounded-full bg-gradient-to-r from-purple-400 to-pink-400"
              style={{ width: "70%" }}
            ></div>
          </div>

          <div className="space-y-2 text-sm text-purple-600 dark:text-purple-400">
            <div className="flex animate-pulse items-center justify-center gap-2">
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              <span>Audio engine initialization</span>
            </div>
            <div className="flex animate-pulse items-center justify-center gap-2" style={{ animationDelay: "0.5s" }}>
              <div className="h-2 w-2 rounded-full bg-pink-500"></div>
              <span>Loading harmonium samples</span>
            </div>
            <div className="flex animate-pulse items-center justify-center gap-2" style={{ animationDelay: "1s" }}>
              <div className="h-2 w-2 rounded-full bg-purple-500"></div>
              <span>MIDI device detection</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 transition-all duration-500 dark:from-gray-900 dark:via-purple-900/10 dark:to-pink-900/10">
      <div className="container relative z-10 mx-auto px-2 py-2 sm:px-4 sm:py-4">
        {/* Enhanced Colorful Header */}
        <header className="glass-card-hover mb-6 flex flex-col items-center justify-between rounded-2xl border-2 p-3 shadow-2xl sm:mb-8 sm:p-4 sm:flex-row">
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="absolute inset-0 animate-pulse rounded-full bg-gradient-to-r from-purple-500 to-pink-500 opacity-50 blur-lg"></div>
              <div className="relative rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500 p-3 shadow-lg">
                <FaMusic className="h-8 w-8 text-white" />
              </div>
            </div>
            <div>
              <h1 className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-2xl font-bold text-transparent dark:from-purple-400 dark:via-pink-400 dark:to-orange-400 md:text-3xl">
                Web Harmonium
              </h1>
              <p className="hidden text-sm text-purple-700 dark:text-purple-300 sm:block">
               Bringing Notes to Life in Your Browser
              </p>
            </div>
          </div>

          <div className="hidden gap-2 md:flex">
            <Badge className="border-0 bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md">
              Key: {getRootNoteName()}
            </Badge>
            <Badge className="border-0 bg-gradient-to-r from-pink-500 to-orange-500 text-white shadow-md">
              Oct: {currentOctave}
            </Badge>
            <Badge className="border-0 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-md">
              Vol: {volume}%
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <Dialog open={showGuide} onOpenChange={setShowGuide}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="hover-lift border-0 bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg hover:from-blue-600 hover:to-cyan-600"
                >
                  <FaQuestion className="h-4 w-4" />
                  <span className="hidden sm:inline">Guide</span>
                </Button>
              </DialogTrigger>
              <GuideDialog />
            </Dialog>

            <Dialog open={showShortcuts} onOpenChange={setShowShortcuts}>
              <DialogTrigger asChild>
                <Button
                  size="sm"
                  className="hover-lift border-0 bg-gradient-to-r from-green-500 to-teal-500 text-white shadow-lg hover:from-green-600 hover:to-teal-600"
                >
                  <FaKeyboard className="h-4 w-4" />
                  <span className="hidden sm:inline">Shortcuts</span>
                </Button>
              </DialogTrigger>
              <ShortcutsDialog />
            </Dialog>

            <Button
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              size="sm"
              className="hover-lift border-0 bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg hover:from-orange-600 hover:to-red-600"
            >
              {theme === "light" ? <FaMoon className="h-4 w-4" /> : <FaSun className="h-4 w-4" />}
              <span className="ml-2 hidden sm:inline">{theme === "light" ? "Dark" : "Light"}</span>
            </Button>
          </div>
        </header>

        {/* Harmonium Keys */}
        <HarmoniumKeys />

        {/* Colorful Control Cards */}
        <div className="mb-8 grid grid-cols-2 gap-3 sm:mb-12 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
          {/* Volume Control */}
          <Card className="glass-card glass-card-hover hover-lift border-2 border-blue-200/60 shadow-2xl transition-all duration-300 hover:shadow-2xl dark:border-blue-700/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 p-2 shadow-lg">
                  <FaVolumeHigh className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-blue-800 dark:text-blue-200">Volume</div>
                  <div className="text-xs text-blue-600 dark:text-blue-400">Alt+↑↓</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">{volume}%</div>
                </div>
                <Slider
                  value={[volume]}
                  onValueChange={(value) => setVolume(value[0])}
                  max={100}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="text-center text-xs text-blue-600 dark:text-blue-400">
                  {volume === 0 ? "Muted" : volume > 75 ? "High" : volume > 25 ? "Medium" : "Low"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reverb Control */}
          <Card className="glass-card glass-card-hover hover-lift border-2 border-green-200/60 shadow-2xl transition-all duration-300 hover:shadow-2xl dark:border-green-700/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 p-2 shadow-lg">
                  <FaGear className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-green-800 dark:text-green-200">Reverb</div>
                  <div className="text-xs text-green-600 dark:text-green-400">Ctrl+Alt+R</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-lg font-bold text-green-600 dark:text-green-400">{useReverb ? "ON" : "OFF"}</div>
                </div>
                <div className="flex items-center justify-center">
                  <Switch checked={useReverb} onCheckedChange={setUseReverb} />
                </div>
                <div className="text-center text-xs text-green-600 dark:text-green-400">
                  {useReverb ? "Spatial" : "Direct"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* MIDI Control */}
          <Card className="glass-card glass-card-hover hover-lift border-2 border-purple-200/60 shadow-2xl transition-all duration-300 hover:shadow-2xl dark:border-purple-700/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-gradient-to-br from-purple-500 to-pink-600 p-2 shadow-lg">
                  <FaKeyboard className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-purple-800 dark:text-purple-200">MIDI</div>
                  <div className="text-xs text-purple-600 dark:text-purple-400">External</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <Badge
                    variant={midiSupported ? "secondary" : "destructive"}
                    className="border border-purple-300 bg-purple-100 px-2 py-1 text-xs text-purple-800 dark:border-purple-700 dark:bg-purple-900/30 dark:text-purple-200"
                  >
                    {midiSupported ? "✓" : "✗"}
                  </Badge>
                </div>
                {midiDevices.length > 0 && (
                  <Select value={selectedMidiDevice} onValueChange={setSelectedMidiDevice}>
                    <SelectTrigger className="glass-card h-8 border-purple-200 text-xs dark:border-purple-700">
                      <SelectValue placeholder="Device" />
                    </SelectTrigger>
                    <SelectContent>
                      {midiDevices.map((device) => (
                        <SelectItem key={device.id} value={device.id} className="text-xs">
                          {device.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
                <div className="text-center text-xs text-purple-600 dark:text-purple-400">
                  {midiDevices.length} Device
                  {midiDevices.length !== 1 ? "s" : ""}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Transpose Control */}
          <Card className="glass-card glass-card-hover hover-lift border-2 border-orange-200/60 shadow-2xl transition-all duration-300 hover:shadow-2xl dark:border-orange-700/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-gradient-to-br from-orange-500 to-red-600 p-2 shadow-lg">
                  <FaMusic className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-orange-800 dark:text-orange-200">Transpose</div>
                  <div className="text-xs text-orange-600 dark:text-orange-400">Ctrl+Alt+←→</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">{getRootNoteName()}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTranspose(Math.max(-11, transpose - 1))}
                    disabled={transpose <= -11}
                    className="glass-card hover-lift h-8 w-8 border-orange-200 p-0 text-sm dark:border-orange-700"
                  >
                    -
                  </Button>
                  <div className="text-center">
                    <div className="font-mono text-sm font-bold text-orange-700 dark:text-orange-300">
                      {transpose > 0 ? `+${transpose}` : transpose}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setTranspose(Math.min(11, transpose + 1))}
                    disabled={transpose >= 11}
                    className="glass-card hover-lift h-8 w-8 border-orange-200 p-0 text-sm dark:border-orange-700"
                  >
                    +
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Octave Control */}
          <Card className="glass-card glass-card-hover hover-lift border-2 border-pink-200/60 shadow-2xl transition-all duration-300 hover:shadow-2xl dark:border-pink-700/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-gradient-to-br from-pink-500 to-rose-600 p-2 shadow-lg">
                  <FaArrowUp className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-pink-800 dark:text-pink-200">Octave</div>
                  <div className="text-xs text-pink-600 dark:text-pink-400">Ctrl+Alt+↑↓</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-pink-600 dark:text-pink-400">{currentOctave}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentOctave(Math.max(0, currentOctave - 1))}
                    disabled={currentOctave <= 0}
                    className="glass-card hover-lift h-8 w-8 border-pink-200 p-0 text-sm dark:border-pink-700"
                  >
                    -
                  </Button>
                  <div className="text-center">
                    <div className="text-xs text-pink-600 dark:text-pink-400">0-6</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setCurrentOctave(Math.min(6, currentOctave + 1))}
                    disabled={currentOctave >= 6}
                    className="glass-card hover-lift h-8 w-8 border-pink-200 p-0 text-sm dark:border-pink-700"
                  >
                    +
                  </Button>
                </div>
                <div className="text-center text-xs text-pink-600 dark:text-pink-400">
                  {currentOctave <= 2 ? "Lower" : currentOctave >= 5 ? "Higher" : "Middle"}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Additional Reeds Control */}
          <Card className="glass-card glass-card-hover hover-lif border-2 border-red-200/60 shadow-2xl transition-all duration-300 hover:shadow-2xl dark:border-red-700/60">
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm">
                <div className="rounded-lg bg-gradient-to-br from-red-500 to-pink-600 p-2 shadow-lg">
                  <FaPlus className="h-4 w-4 text-white" />
                </div>
                <div>
                  <div className="text-sm font-bold text-red-800 dark:text-red-200">Reeds</div>
                  <div className="text-xs text-red-600 dark:text-red-400">Ctrl+Alt+±</div>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-3xl font-bold text-red-600 dark:text-red-400">{additionalReeds}</div>
                </div>
                <div className="flex items-center justify-between gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAdditionalReeds(Math.max(0, additionalReeds - 1))}
                    disabled={additionalReeds <= 0}
                    className="glass-card hover-lift h-8 w-8 border-red-200 p-0 text-sm dark:border-red-700"
                  >
                    -
                  </Button>
                  <div className="text-center">
                    <div className="text-xs text-red-600 dark:text-red-400">Layers</div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setAdditionalReeds(Math.min(6 - currentOctave, additionalReeds + 1))}
                    disabled={currentOctave + additionalReeds >= 6}
                    className="glass-card hover-lift h-8 w-8 border-red-200 p-0 text-sm dark:border-red-700"
                  >
                    +
                  </Button>
                </div>
                <div className="text-center text-xs text-red-600 dark:text-red-400">
                  {additionalReeds === 0 ? "Pure" : additionalReeds <= 2 ? "Rich" : "Complex"}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Harmonium Information Section */}
        <section className="mb-8 sm:mb-12">
          <div className="glass-card glass-card-hover rounded-3xl p-6 sm:rounded-3xl sm:p-8">
            <div className="mb-8 text-center">
              <h2 className="mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-3xl font-bold text-transparent sm:text-4xl">
                About the Harmonium
              </h2>
              <p className="mx-auto max-w-3xl text-lg text-purple-700 dark:text-purple-300">
                The harmonium is a free-reed organ that generates sound as air flows past vibrating reeds, essential in
                Indian classical and devotional music.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
              <div className="glass-card glass-card-hover hover-lift rounded-xl border-2 border-blue-200/60 p-6 dark:border-blue-700/60">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 shadow-lg">
                    <FaBookOpen className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-blue-800 dark:text-blue-200">History & Origin</h3>
                </div>
                <p className="text-center text-sm text-blue-700 dark:text-blue-300">
                  The harmonium was invented in France around 1840 by Alexandre Debain. It was brought to India during
                  British rule and quickly integrated into Indian music. Despite early criticism, it became a key
                  instrument in classical and devotional genres.
                </p>
              </div>

              <div className="glass-card glass-card-hover hover-lift rounded-xl border-2 border-green-200/60 p-6 dark:border-green-700/60">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-green-500 to-emerald-500 shadow-lg">
                    <FaGear className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-green-800 dark:text-green-200">Mechanism</h3>
                </div>
                <p className="text-center text-sm text-green-700 dark:text-green-300">
                  Air is pumped through bellows and flows past metal reeds of different lengths, creating distinct
                  pitches. The keyboard controls which reeds vibrate to produce harmonious sounds.
                </p>
              </div>

              <div className="glass-card glass-card-hover hover-lift rounded-xl border-2 border-purple-200/60 p-6 dark:border-purple-700/60">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-pink-500 shadow-lg">
                    <FaUsers className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-purple-800 dark:text-purple-200">Usage</h3>
                </div>
                <p className="text-center text-sm text-purple-700 dark:text-purple-300">
                  Essential in Indian classical music, bhajans, qawwali, and folk music. One hand operates bellows while
                  the other plays melodies on the keyboard for authentic performances.
                </p>
              </div>

              <div className="glass-card glass-card-hover hover-lift rounded-xl border-2 border-orange-200/60 p-6 dark:border-orange-700/60">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-orange-500 to-red-500 shadow-lg">
                    <FaAward className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-orange-800 dark:text-orange-200">Cultural Impact</h3>
                </div>
                <p className="text-center text-sm text-orange-700 dark:text-orange-300">
                  Revolutionized Indian music by providing a portable, versatile accompaniment instrument. Now integral
                  to classical concerts, devotional music, and modern fusion performances.
                </p>
              </div>
            </div>

            {/* Additional Information Cards */}
            <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-3">
              <div className="glass-card glass-card-hover hover-lift rounded-xl border-2 border-pink-200/60 p-6 dark:border-pink-700/60">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-pink-500 to-rose-500 shadow-lg">
                    <FaInfo className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-pink-800 dark:text-pink-200">Technical Specs</h4>
                </div>
                <ul className="space-y-1 text-sm text-pink-700 dark:text-pink-300">
                  <li>• 3-4 octave keyboard range</li>
                  <li>• Free reed sound production</li>
                  <li>• Hand-operated bellows system</li>
                  <li>• Multiple stop combinations</li>
                  <li>• Portable wooden construction</li>
                </ul>
              </div>

              <div className="glass-card glass-card-hover hover-lift rounded-xl border-2 border-teal-200/60 p-6 dark:border-teal-700/60">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg">
                    <FaHeadphones className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-teal-800 dark:text-teal-200">Playing Tips</h4>
                </div>
                <ul className="space-y-1 text-sm text-teal-700 dark:text-teal-300">
                  <li>• Use headphones for best experience</li>
                  <li>• Practice with both hands coordination</li>
                  <li>• Start with simple melodies</li>
                  <li>• Learn basic ragas first</li>
                  <li>• Use MIDI keyboard for advanced play</li>
                </ul>
              </div>

              <div className="glass-card glass-card-hover hover-lift rounded-xl border-2 border-indigo-200/60 p-6 dark:border-indigo-700/60">
                <div className="mb-4 text-center">
                  <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg">
                    <FaArrowRotateLeft className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="text-lg font-bold text-indigo-800 dark:text-indigo-200">Learning Path</h4>
                </div>
                <ul className="space-y-1 text-sm text-indigo-700 dark:text-indigo-300">
                  <li>• Master basic Sargam notes</li>
                  <li>• Practice scale exercises daily</li>
                  <li>• Learn popular bhajans</li>
                  <li>• Study classical ragas</li>
                  <li>• Develop improvisation skills</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        {/* Enhanced Social Media Footer */}
        <footer className="glass-card glass-card-hover rounded-2xl border-2 p-6 sm:rounded-3xl sm:p-8">
          <div className="grid grid-cols-1 gap-6 sm:gap-8 lg:grid-cols-3">
            {/* Website Info */}
            <div className="text-center lg:text-left">
              <div className="mb-4 flex items-center justify-center gap-3 lg:justify-start">
                <div className="rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 p-3 shadow-lg">
                  <FaMusic className="h-6 w-6 text-white" />
                </div>
                <h3 className="bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-2xl font-bold text-transparent">
                  Web Harmonium
                </h3>
              </div>
            
              <div className="text-grey-600 dark:text-grey-400 text-xs">© 2026 Lokith. All rights reserved.</div>
            </div>

            {/* Enhanced Social Links */}
            <div className="text-center">
              <h4 className="mb-4 text-lg font-bold text-purple-800 dark:text-purple-200">Connect with Developer</h4>
              <div className="grid grid-cols-4 gap-3">
                {[
                  {
                    href: "https://github.com/Lo-kith",
                    icon: FaGithub,
                    label: "GitHub",
                    color: "from-gray-600 to-gray-800",
                  },
                  {
                    href: "https://www.linkedin.com/in/lokith-m-801099250/",
                    icon: FaLinkedin,
                    label: "LinkedIn",
                    color: "from-blue-600 to-blue-800",
                  },
                  {
                    href: "https://www.instagram.com/l_o_k.i.t.h_?igsh=MXFpaDVuNm12cWNjeA==",
                    icon: FaInstagram,
                    label: "Instagram",
                    color: "from-pink-500 to-rose-600",
                  },
                
                
              
                  {
                    href: "mailto:lokithmlokith@gmail.com",
                    icon: FaEnvelope,
                    label: "Email",
                    color: "from-red-500 to-orange-600",
                  },
                ].map((social, i) => (
                  <a
                    key={i}
                    href={social.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`group relative overflow-hidden bg-gradient-to-br ${social.color} hover-lift rounded-2xl border border-white/20 p-4 text-center text-white shadow-lg backdrop-blur-xl transition-all hover:scale-110 hover:shadow-2xl`}
                    title={social.label}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent transition-all duration-500 group-hover:from-white/30"></div>
                    <div className="relative z-10">
                      <social.icon className="mx-auto h-6 w-6 transform transition-transform duration-300 group-hover:scale-110" />
                      <div className="mt-2 text-xs font-semibold opacity-90">{social.label}</div>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Tech Stack */}
            <div className="text-center lg:text-right">
              <h4 className="mb-4 text-lg font-bold text-purple-800 dark:text-purple-200">Built With</h4>
              <div className="flex flex-wrap justify-center gap-2 lg:justify-end">
                {[
                  { name: "Next.js 15", color: "from-black to-gray-800" },
                  { name: "TypeScript", color: "from-blue-500 to-blue-700" },
                  { name: "Tailwind CSS", color: "from-cyan-500 to-blue-500" },
                  {
                    name: "Web Audio API",
                    color: "from-green-500 to-emerald-600",
                  },
                  {
                    name: "WebMIDI API",
                    color: "from-purple-500 to-indigo-600",
                  },
                ].map((tech, i) => (
                  <Badge
                    key={i}
                    className={`bg-gradient-to-r ${tech.color} border-0 p-2 px-3 text-sm text-white shadow-md transition-all hover:scale-105 hover:shadow-lg`}
                  >
                    {tech.name}
                  </Badge>
                ))}
              </div>
              <div className="text-grey-600 dark:text-grey-400 mt-4 text-xs">
                Crafted with  by <span className="font-semibold">Lokith</span>
                <br />
                Full Stack Developer & Music Technology Enthusiast
              </div>
            </div>
          </div>
        </footer>
      </div>
    </div>
  )
}
