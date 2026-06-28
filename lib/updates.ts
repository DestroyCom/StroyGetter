export type UpdateSection = {
  heading: string;
  body: string;
};

export type UpdateEntry = {
  slug: string;
  title: string;
  date: string;
  description: string;
  sections: UpdateSection[];
  keywords?: string[];
};

export const updates: UpdateEntry[] = [
  {
    slug: "stroygetter-native-app",
    title: "StroyGetter Native is here — a desktop app for Windows, macOS and Linux",
    date: "2026-06-28",
    description:
      "StroyGetter Native brings the full downloader to your desktop. YouTube, TikTok, Twitch, Library Ready — all running locally, no server required. ~20 MB, no dependencies.",
    keywords: [
      "stroygetter native app",
      "stroygetter desktop",
      "youtube downloader desktop app",
      "youtube downloader offline",
      "tiktok downloader app windows",
      "library ready mp3 desktop",
      "téléchargeur youtube application bureau",
      "descargar youtube app escritorio",
    ],
    sections: [
      {
        heading: "Everything you know, running on your machine",
        body: "StroyGetter Native is a desktop client for the tool you already use at stroygetter.fr. It ships with the same interface, the same formats, and the same logic — except nothing goes through a server. yt-dlp and FFmpeg are bundled inside the installer. You paste a link, pick a format, and the file lands on your drive. The web server being up or down is no longer your problem.",
      },
      {
        heading: "YouTube, TikTok, Twitch — and Library Ready",
        body: "YouTube downloads come with the full quality picker: every resolution yt-dlp finds is listed, plus an audio-only MP3 option. TikTok gives you video with watermark, video without watermark, and audio. Twitch supports public clips. The Library Ready mode — the feature that embeds title, artist, high-resolution artwork from iTunes, and synchronised lyrics from LRClib directly into the MP3 — is fully available in the desktop app. Drop the file into Apple Music, Plexamp, or Poweramp and everything is already filled in.",
      },
      {
        heading: "Windows, macOS (Apple Silicon + Intel), and Linux",
        body: "The first release ships four builds: Windows x64, macOS Apple Silicon, macOS Intel, and Linux x64. Android support is in progress and will arrive in a future release. Each binary is a single self-contained file — no runtime to install, no PATH to configure, no Python or Node.js required. On macOS, because the app is not signed with an Apple Developer certificate, you may need to right-click and choose Open on the first launch, or run xattr -d com.apple.quarantine /Applications/StroyGetter.app from the terminal.",
      },
      {
        heading: "20 MB, not 300 MB",
        body: "StroyGetter Native is built with Tauri v2. Tauri uses the operating system's own WebView rather than shipping a full Chromium browser, which is what most desktop apps built with Electron do. The result is an installer around 20 MB. Memory usage at runtime is similarly lightweight — the download engine runs in Rust and processes files without touching the UI thread.",
      },
      {
        heading: "Verified binaries — four ways to check",
        body: "Every release includes a SHA256SUMS file you can verify with shasum -a 256 -c. GitHub Attestations (SLSA level 2) prove that each binary was built from the exact commit in CI — verifiable with the gh CLI. Releases are also signed with GPG key 6C1D622641F44493, importable from github.com/DestroyCom.gpg. Finally, every binary is submitted to VirusTotal before release and the scan link is posted in the release description. Full verification instructions are in SECURITY.md in the repository.",
      },
      {
        heading: "Download and source",
        body: "Binaries are on GitHub Releases at github.com/DestroyCom/Stroygetter-Native/releases/latest. The full source — Rust backend, React frontend, Tauri config, and CI workflows — is MIT licensed and available in the same repository. Bug reports and contributions are welcome.",
      },
    ],
  },
  {
    slug: "v3-14-0-twitch-downloader",
    title: "Download Twitch clips — free, no app required",
    date: "2026-05-29",
    description:
      "StroyGetter now supports Twitch clips. Paste any clip URL and download it as MP4 or extract the audio as MP3 — same interface you already know.",
    keywords: [
      "twitch clip downloader",
      "download twitch clip",
      "twitch to mp4",
      "twitch clip download online",
      "stroygetter twitch",
      "télécharger clip twitch",
      "descargar clip twitch",
      "baixar clip twitch",
    ],
    sections: [
      {
        heading: "Paste a Twitch clip URL. Get the file.",
        body: "StroyGetter now accepts Twitch clip URLs alongside YouTube and TikTok links. Paste any public clip URL (clips.twitch.tv/... or twitch.tv/channel/clip/...) and you'll see the available resolutions and an audio option. No app to install, no account to create — same interface as always. Note: only clips are supported; full VOD downloads are not available.",
      },
      {
        heading: "Source quality, 720p60 — your choice",
        body: "Clips are available at multiple resolutions. The quality picker shows every option yt-dlp can find for that clip: source quality, 720p60, and lower resolutions when available. Pick the one that fits your storage or bandwidth.",
      },
      {
        heading: "Audio-only MP3 from Twitch clips",
        body: "The Audio MP3 option strips the video track and exports just the audio at 192 kbps. Useful for highlights, talk segments, or music clips you want to carry around without the video.",
      },
      {
        heading: "A dedicated Twitch page",
        body: "We added /twitch as a standalone landing page for anyone searching for a Twitch clip downloader. It covers how the tool works, which formats are available, and answers the most common questions — including what clips are, and how many quality options to expect.",
      },
    ],
  },
  {
    slug: "v3-11-0-tiktok-downloader",
    title: "Download TikTok videos — no watermark, no app required",
    date: "2026-05-27",
    description:
      "StroyGetter now supports TikTok. Download videos without the watermark, keep the original with branding, or extract the audio as MP3 — same interface you already know.",
    keywords: [
      "tiktok downloader no watermark",
      "download tiktok video",
      "tiktok to mp3",
      "tiktok video download online",
      "remove tiktok watermark",
      "stroygetter tiktok",
      "télécharger tiktok sans filigrane",
      "descargar tiktok sin marca de agua",
    ],
    sections: [
      {
        heading: "Paste a TikTok link. Get a clean MP4.",
        body: "StroyGetter now accepts TikTok URLs alongside YouTube links. Paste any public TikTok video URL and you'll see three download options: No watermark, Watermark, and Audio. No app to install, no account to create, no browser extension — it works the same way the YouTube downloader has always worked.",
      },
      {
        heading: "No-watermark download explained",
        body: "TikTok overlays its logo on the video at the display layer, but the original stream uploaded by the creator doesn't carry it. StroyGetter uses yt-dlp to fetch that original H264 stream directly. The result is a clean MP4 with full resolution and no TikTok branding anywhere in the frame.",
      },
      {
        heading: "Three formats, one click",
        body: "No watermark gives you the creator's original video. Watermark delivers the standard TikTok version with the overlaid logo — useful if you want to keep the original presentation. Audio strips the video entirely and exports a plain MP3 at 192 kbps, handy for saving sound clips, voiceovers, or music you want to carry around without the video.",
      },
      {
        heading: "A dedicated TikTok page",
        body: "We added /tiktok as a standalone landing page for anyone searching specifically for a TikTok downloader. It covers how the tool works, which formats are available, and answers the questions we see most often — including why no-watermark download is possible and why there's no quality picker (TikTok publishes a single resolution per clip).",
      },
    ],
  },
  {
    slug: "v3-8-0-multilingual",
    title: "StroyGetter says hello to the world — now in 4 languages",
    date: "2026-05-21",
    description:
      "StroyGetter is now fully available in English, French, Spanish, and Portuguese. Same tool, same speed, your language.",
    keywords: [
      "stroygetter multilingual",
      "youtube downloader french",
      "youtube downloader spanish",
      "youtube downloader portuguese",
      "télécharger youtube en français",
      "descargar youtube en español",
      "baixar youtube em português",
      "stroygetter update",
    ],
    sections: [
      {
        heading: "Bonjour. Hola. Olá.",
        body: "StroyGetter now speaks your language — literally. The entire interface is available in English, French, Spanish (Latin America), and Brazilian Portuguese. Every label, button, error message, and FAQ entry has been translated. If you've been sharing StroyGetter with friends or family who prefer to browse in their own language, now it just works.",
      },
      {
        heading: "Switch in one click",
        body: "A compact language switcher sits in the top corner of every page. Tap EN, FR, ES, or PT and the whole site updates instantly — no reload, no account, no setting to dig through. Your choice is preserved as you navigate between pages.",
      },
      {
        heading: "Built to grow",
        body: "The new internationalisation system was designed from the ground up to make adding future languages and regional variants straightforward. Adding Canadian French or European Portuguese in the future is a four-step operation. The infrastructure is in place — the world is the limit.",
      },
    ],
  },
  {
    slug: "v3-5-0-redesign-2026",
    title: "StroyGetter gets a fresh look — and your music gets even better",
    date: "2026-05-11",
    description:
      "A brand-new interface, album artwork in your MP3s, and a smoother experience on every screen. StroyGetter v3.5 is here.",
    keywords: [
      "stroygetter update",
      "youtube downloader redesign",
      "mp3 with album art",
      "youtube to mp3 cover art",
    ],
    sections: [
      {
        heading: "A design built for 2026",
        body: "We gave StroyGetter a full visual overhaul. The interface is cleaner, more modern, and easier to navigate — whether you're on a laptop or tapping away on your phone. The new layout adapts to any screen size, with a crisp dark theme and a refined colour palette that makes every action obvious at a glance.",
      },
      {
        heading: "Your MP3s now carry the full picture",
        body: "When you download a track, StroyGetter now looks up the official album artwork and embeds it directly into the file. Open it in your music player and the cover is already there — no manual editing, no missing thumbnails. Even unusual image formats from streaming services are handled automatically.",
      },
      {
        heading: "Smoother from start to finish",
        body: "The download flow got a thorough polish. The progress bar now jumps to 100% the moment your file is ready, a clear 'Saving to your device…' message appears while the browser writes the file, and if anything goes wrong a Retry button shows up immediately. Small details that make a real difference when you're in a hurry.",
      },
      {
        heading: "New pages to answer your questions",
        body: "We added a complete guide on how to download YouTube videos, a detailed FAQ, and a full legal section so you know exactly what StroyGetter does and doesn't do with your data. Everything you need, in one place.",
      },
    ],
  },
  {
    slug: "v3-5-0-library-ready-lyrics",
    title: "Library Ready — your music, perfectly tagged and ready to play",
    date: "2026-05-03",
    description:
      "Download MP3s with synced lyrics, cover art, and full music metadata pre-filled. One click and your track is library-perfect.",
    keywords: [
      "youtube to mp3 with lyrics",
      "mp3 with synced lyrics",
      "download youtube music with tags",
      "library ready mp3",
      "youtube mp3 metadata",
    ],
    sections: [
      {
        heading: "Introducing Library Ready",
        body: "StroyGetter now offers a new download mode called Library Ready. Choose it and your MP3 arrives complete — the song title, artist name, album artwork, and even the synced lyrics are already embedded in the file. Drop it into any music player and everything shows up exactly as it should. No extra steps, no manual tagging.",
      },
      {
        heading: "Lyrics that follow the music",
        body: "Library Ready fetches synchronised lyrics from open music databases. That means the words scroll in time with the track — the same experience you get on streaming platforms, but in a file you actually own. Can't find lyrics for a specific song? You'll still get all the other tags and artwork, so the file is never incomplete.",
      },
      {
        heading: "Tougher downloads, fewer surprises",
        body: "We also hardened the download engine under the hood. Long videos, slow connections, and large files are handled much more gracefully now — timeouts are smarter, errors are caught early, and temporary files are always cleaned up properly. Downloads that used to hang now either complete or fail fast with a clear message.",
      },
    ],
  },
  {
    slug: "v3-4-0-rebuilt-2026",
    title:
      "StroyGetter is rebuilt from the ground up — faster and more reliable",
    date: "2026-05-01",
    description:
      "A complete rebuild of StroyGetter for 2026. Faster downloads, better handling of high-resolution videos, and a lighter, more reliable server.",
    keywords: [
      "stroygetter 2026",
      "youtube downloader faster",
      "youtube 4k download reliable",
      "stroygetter update",
    ],
    sections: [
      {
        heading: "A fresh foundation",
        body: "Under the hood, StroyGetter has been completely rebuilt for 2026. Every component — from the way we talk to YouTube to the way we send files to your browser — has been rewritten and modernised. The result is a noticeably faster and more stable experience, especially for long videos and high-resolution downloads.",
      },
      {
        heading: "Better with high-res and long videos",
        body: "4K videos and hour-long podcasts now download with far fewer hiccups. The new engine handles large files more efficiently, so you spend less time waiting and more time watching. The quality dropdown on the download page also shows only the resolutions that are actually available — no more picking 1080p and ending up with 720p.",
      },
      {
        heading: "A lighter, faster server",
        body: "We moved to a much lighter server setup that starts faster and consumes fewer resources. For you that means quicker response times when you paste a URL and less time staring at the loading spinner before your download begins.",
      },
      {
        heading: "Smarter caching",
        body: "If you download the same video twice, StroyGetter now recognises it immediately and serves the cached file in seconds. No re-downloading from YouTube, no waiting — just instant delivery.",
      },
    ],
  },
  {
    slug: "v1-0-0-launch",
    title: "StroyGetter is live — download any YouTube video, free and instant",
    date: "2023-09-24",
    description:
      "StroyGetter launches today. Download any public YouTube video as MP4 or MP3, straight from your browser — no account, no install, no fuss.",
    keywords: [
      "stroygetter launch",
      "free youtube downloader",
      "youtube to mp4 no install",
      "youtube to mp3 browser",
      "download youtube video free",
    ],
    sections: [
      {
        heading: "Hello, world",
        body: "StroyGetter is now live. It started as a personal tool to save YouTube videos without dealing with shady ad-covered sites, and we decided to open it up for everyone. The idea is simple: paste a YouTube link, pick your format, and download. That's it.",
      },
      {
        heading: "MP4 or MP3 — your choice",
        body: "You can download any public YouTube video as an MP4 to keep the picture, or as an MP3 if you only need the audio. The MP4 comes in the best resolution YouTube has available — up to 4K for videos that support it. The MP3 is encoded at a high bitrate, perfect for listening on the go.",
      },
      {
        heading: "No account, no install, no nonsense",
        body: "There's nothing to sign up for and nothing to install. Open StroyGetter in your browser, paste the URL, and you're done. It works on Chrome, Firefox, Safari, and any modern mobile browser — the same experience everywhere.",
      },
      {
        heading: "Open source and here to stay",
        body: "StroyGetter is fully open source. You can read the code, report issues, or contribute on GitHub. We're committed to keeping it free, clean, and ad-free. This is just the beginning.",
      },
    ],
  },
];
