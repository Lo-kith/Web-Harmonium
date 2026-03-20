"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { FaMusic, FaArrowLeft, FaWandMagicSparkles, FaStar, FaBolt } from "react-icons/fa6"
import { FaHome, FaSearch} from "react-icons/fa"
import Link from "next/link"

export default function NotFound() {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Musical notes for background animation
  const musicalNotes = ["♪", "♫", "♬", "♩", "♭", "♯", "𝄞", "𝄢"]

  // Animated background
  const AnimatedBackground = () => (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {/* Colorful floating musical notes */}
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={`note-${i}`}
          className="absolute text-3xl md:text-5xl opacity-10 dark:opacity-20 animate-float font-bold"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 20}s`,
            animationDuration: `${12 + Math.random() * 18}s`,
            color: `hsl(${Math.random() * 360}, 70%, 60%)`,
            textShadow: "3px 3px 10px rgba(0,0,0,0.3)",
          }}
        >
          {musicalNotes[Math.floor(Math.random() * musicalNotes.length)]}
        </div>
      ))}

      {/* Colorful gradient orbs */}
      {Array.from({ length: 15 }).map((_, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full opacity-5 dark:opacity-15 animate-pulse"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            width: `${120 + Math.random() * 250}px`,
            height: `${120 + Math.random() * 250}px`,
            background: `radial-gradient(circle, hsl(${Math.random() * 360}, 60%, 50%) 0%, transparent 70%)`,
            animationDelay: `${Math.random() * 6}s`,
            animationDuration: `${5 + Math.random() * 8}s`,
          }}
        />
      ))}
    </div>
  )

  if (!mounted) {
    return null
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50/90 via-pink-50/90 to-orange-50/90 dark:from-gray-900/95 dark:via-purple-900/20 dark:to-pink-900/20 flex items-center justify-center relative overflow-hidden">
      <AnimatedBackground />

      <div className="container mx-auto px-4 py-8 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          {/* Main 404 Card */}
          <Card className="glass-card rounded-[40px] p-12 sm:p-16 border-4 border-purple-300/60 dark:border-purple-600/60 shadow-2xl hover-grow mb-8">
            {/* Animated 404 Display */}
            <div className="relative mb-12">
              <div className="text-8xl sm:text-9xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 bg-clip-text text-transparent mb-6 animate-pulse">
                404
              </div>

              {/* Floating musical icons around 404 */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative w-full h-full">
                  {[FaMusic, FaStar, FaWandMagicSparkles, FaBolt].map((Icon, i) => (
                    <div
                      key={i}
                      className="absolute animate-bounce"
                      style={{
                        left: `${20 + i * 20}%`,
                        top: `${30 + (i % 2) * 40}%`,
                        animationDelay: `${i * 0.5}s`,
                        animationDuration: `${2 + i * 0.3}s`,
                      }}
                    >
                      <div className="p-3 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[15px] shadow-xl opacity-80">
                        <Icon className="h-6 w-6 text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Error Message */}
            <div className="mb-12">
              <h1 className="text-4xl sm:text-6xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-6">
                Oops! Page Not Found
              </h1>
              <p className="text-xl sm:text-2xl text-purple-700 dark:text-purple-300 mb-6 font-medium leading-relaxed">
                Looks like this harmonium key doesn't exist! 🎹
              </p>
              <p className="text-lg text-purple-600 dark:text-purple-400 max-w-2xl mx-auto leading-relaxed">
                The page you're looking for might have been moved, deleted, or perhaps you played the wrong note. Let's
                get you back to making beautiful music!
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-12">
              <Link href="/">
                <Button
                  size="lg"
                  className="bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600 text-white border-0 shadow-2xl rounded-[25px] px-10 py-4 text-xl font-bold hover-grow"
                >
                  <FaHome className="h-6 w-6 mr-3" />
                  Back to Harmonium
                </Button>
              </Link>

              <a
                href="mailto:lokithmlokith@gmail.com"
                className="inline-flex items-center justify-center rounded-xl border border-purple-300 bg-white px-5 py-2.5 text-purple-700 shadow-sm transition-all hover:bg-purple-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-purple-400"
              >
                Contact support
              </a>
            </div>

          </Card>

          {/* Additional Help Card */}
          <Card className="glass-card rounded-[30px] p-8 border-3 border-blue-300/50 dark:border-blue-600/50 hover-grow">
            <h3 className="text-2xl font-bold text-blue-800 dark:text-blue-200 mb-6 flex items-center justify-center gap-3">
              <div className="p-3 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-[15px] shadow-lg">
                <FaSearch className="h-8 w-8 text-white" />
              </div>
              Need Help?
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-green-500 to-emerald-500 rounded-[20px] w-16 h-16 mx-auto mb-4 shadow-xl">
                  <FaMusic className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-lg text-green-800 dark:text-green-200 mb-2">Play Harmonium</h4>
                <p className="text-sm text-green-700 dark:text-green-300">
                  Experience authentic Indian classical music with our digital harmonium
                </p>
              </div>

              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-purple-500 to-pink-500 rounded-[20px] w-16 h-16 mx-auto mb-4 shadow-xl">
                  <FaWandMagicSparkles className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-lg text-purple-800 dark:text-purple-200 mb-2">Learn Music</h4>
                <p className="text-sm text-purple-700 dark:text-purple-300">
                  Discover Sargam notation, ragas, and traditional playing techniques
                </p>
              </div>

              <div className="text-center">
                <div className="p-4 bg-gradient-to-br from-orange-500 to-red-500 rounded-[20px] w-16 h-16 mx-auto mb-4 shadow-xl">
                  <FaBolt className="h-8 w-8 text-white" />
                </div>
                <h4 className="font-bold text-lg text-orange-800 dark:text-orange-200 mb-2">Advanced Features</h4>
                <p className="text-sm text-orange-700 dark:text-orange-300">
                  MIDI support, keyboard shortcuts, and professional audio controls
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  )
}
