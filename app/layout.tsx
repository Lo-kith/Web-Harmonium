import type React from "react";
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
    metadataBase: new URL("http://localhost:3000"),
  title: "Web Harmonium – Modern UI Component Library by Lokith",
  description:
    "Harmonium is an open-source, accessible, and modern UI component library built with Tailwind CSS and designed for React and Next.js. Fast, elegant, and easy to use. developed by Lokith.",
  keywords: [
    "Harmonium UI",
    "React component library",
    "Next.js UI components",
    "Tailwind CSS components",
    "Modern UI design",
    "Open source UI kit",
    "UI framework for Next.js",
    "React design system",
    "Accessible components",
    "Web components library",
    "React UI system",
    "Next.js frontend library",
    "Lokith UI",
    "Figma to React UI",
    "Beautiful UI components",
    "React Tailwind components",
    "Frontend development tools",
    "Developer UI tools",
    "Fast UI components",
    "Component-based design system",
    "Lokith",
  ],
  authors: [{ name: "Lokith", }],
  creator: "Lokith",
  openGraph: {
    
    title: "Web Harmonium – Modern UI Component Library by Lokith",
    description:
      "Harmonium is a fast, modern, and accessible component library for Next.js, built with Tailwind CSS by Lokith.",
    siteName: "Web Harmonium",
    url: "",
    images: [
      {
        url: "/Harmonium.png",
        width: 512,
        height: 512,
        alt: "Harmonium Logo",
      },
    ],
    locale: "en_US",
    type: "website",
  },

  icons: {
    icon: "/Harmonium.png",
    shortcut: "/Harmonium.png",
    apple: "/Harmonium.png",
  }
};
const musicalNotes = ["♪", "♫", "♬", "♩", "♭", "♯", "𝄞", "𝄢"];

// Enhanced animated background with more colors
const AnimatedBackground = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
    {/* Colorful floating musical notes */}
    {Array.from({ length: 20 }).map((_, i) => (
      <div
        key={`note-${i}`}
        className="absolute text-2xl md:text-4xl opacity-15 dark:opacity-25 animate-float font-bold"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          animationDelay: `${Math.random() * 10}s`,
          animationDuration: `${8 + Math.random() * 12}s`,
          color: `hsl(${Math.random() * 360}, 80%, 60%)`,
          textShadow: "2px 2px 4px rgba(0,0,0,0.3)",
        }}
      >
        {musicalNotes[Math.floor(Math.random() * musicalNotes.length)]}
      </div>
    ))}

    {/* Colorful gradient orbs */}
    {Array.from({ length: 8 }).map((_, i) => (
      <div
        key={`orb-${i}`}
        className="absolute rounded-full opacity-10 dark:opacity-20 animate-pulse"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${80 + Math.random() * 120}px`,
          height: `${80 + Math.random() * 120}px`,
          background: `radial-gradient(circle, hsl(${
            Math.random() * 360
          }, 70%, 60%) 0%, transparent 70%)`,
          animationDelay: `${Math.random() * 3}s`,
          animationDuration: `${3 + Math.random() * 4}s`,
        }}
      />
    ))}
  </div>
);

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="M71tdDiU-O499RIu-uqiDLBLkJAVh67t9e107tz2UVk"
        />
        <meta name="msvalidate.01" content="231D77D496F630213E38C67872F5028B" />
      </head>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <AnimatedBackground />
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
