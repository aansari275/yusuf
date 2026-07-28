import type { Metadata, Viewport } from "next";
import "./globals.css";

const TITLE = "Yusuf Ansari | The Silliest Kid Ever! 🤪";
// Deliberately no age here — metadata is baked in at build time, and a
// hardcoded age would be wrong the moment he has a birthday.
const DESCRIPTION =
  "Hi! I'm Yusuf Ansari from Bhadohi, living in Noida. I love dinosaurs, fast cars, white chocolate and playing games. Come and play! 🍫🎮";

export const metadata: Metadata = {
  metadataBase: new URL("https://mdyusuf.com"),
  title: TITLE,
  description: DESCRIPTION,
  keywords: ["Yusuf Ansari", "Shiv Nadar School", "Noida", "Bhadohi", "kids games"],
  authors: [{ name: "Yusuf Ansari" }],
  openGraph: {
    title: TITLE,
    description: DESCRIPTION,
    type: "website",
    url: "https://mdyusuf.com",
    siteName: "mdyusuf.com",
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#fff6e9",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-rounded antialiased">{children}</body>
    </html>
  );
}
