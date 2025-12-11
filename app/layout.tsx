import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AuthProvider } from "@/components/AuthProvider";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://rainbow-talk.vercel.app';
const ogImageUrl = `${siteUrl}/og-image.png`;

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "무지개톡 - Rainbow Talk",
  description: "그곳에서 온 편지, 다시 나누는 이야기. 펫로스 증후군 치유를 위한 AI 채팅 & 디지털 추모 웹앱",
  keywords: ["펫로스", "반려동물", "AI 채팅", "디지털 추모", "무지개톡", "Rainbow Talk"],
  authors: [{ name: "무지개톡" }],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "무지개톡",
  },
  icons: {
    icon: [
      { url: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  openGraph: {
    title: "무지개톡 - Rainbow Talk",
    description: "그곳에서 온 편지, 다시 나누는 이야기. 펫로스 증후군 치유를 위한 AI 채팅 & 디지털 추모 웹앱",
    type: "website",
    locale: "ko_KR",
    siteName: "무지개톡",
    url: siteUrl,
    images: [
      {
        url: ogImageUrl, // 절대 URL 사용
        width: 1200,
        height: 630,
        alt: "무지개톡 - 그곳에서 온 편지, 다시 나누는 이야기",
        type: "image/png",
        secureUrl: ogImageUrl, // 카카오톡을 위한 secure URL
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "무지개톡 - Rainbow Talk",
    description: "그곳에서 온 편지, 다시 나누는 이야기. 펫로스 증후군 치유를 위한 AI 채팅 & 디지털 추모 웹앱",
    images: [ogImageUrl], // 절대 URL 사용
  },
  other: {
    "apple-mobile-web-app-capable": "yes",
    "apple-mobile-web-app-status-bar-style": "default",
    "apple-mobile-web-app-title": "무지개톡",
    "mobile-web-app-capable": "yes",
    "theme-color": "#8B5CF6",
    // 카카오톡 인앱 브라우저 최적화
    "format-detection": "telephone=no",
    "X-UA-Compatible": "IE=edge",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover", // iOS Safari notch 지원
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="antialiased">
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}

