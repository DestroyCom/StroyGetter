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
    title: "StroyGetter is rebuilt from the ground up — faster and more reliable",
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
