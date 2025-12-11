import type { Metadata } from "next";
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
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "무지개톡 - Rainbow Talk",
    description: "그곳에서 온 편지, 다시 나누는 이야기. 펫로스 증후군 치유를 위한 AI 채팅 & 디지털 추모 웹앱",
    images: [ogImageUrl], // 절대 URL 사용
  },
  viewport: "width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no",
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

