import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const Input = z.object({ projectId: z.string().uuid() });
const TranscriptInput = z.object({
  projectId: z.string().uuid(),
  segments: z
    .array(
      z.object({
        start: z.number().min(0),
        dur: z.number().min(0).max(60).default(2),
        text: z.string().min(1).max(1000),
      }),
    )
    .min(20)
    .max(10000),
});

type Segment = { start: number; dur: number; text: string };

const STEPS = [
  "Downloading Video",
  "Extracting Audio",
  "Generating Transcript",
  "Analyzing Transcript",
  "Detecting Viral Moments",
  "Removing Silences",
  "Generating Captions",
  "Cropping Video",
  "Face Tracking",
  "Rendering Shorts",
  "Creating Titles",
  "Generating Hashtags",
  "Preparing Downloads",
];

function extractYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/);
  return m?.[1] ?? null;
}

function decodeXml(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/<[^>]+>/g, "")
    .trim();
}

type CaptionTrack = { baseUrl: string; languageCode: string; kind?: string; name?: string };

function extractBalancedJson(source: string, marker: string): any | null {
  const markerIndex = source.indexOf(marker);
  if (markerIndex === -1) return null;

  const start = source.indexOf("{", markerIndex);
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < source.length; i++) {
    const ch = source[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (ch === "\\") {
        escaped = true;
      } else if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
    } else if (ch === "{") {
      depth++;
    } else if (ch === "}") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(source.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }

  return null;
}

async function listCaptionTracksFromWatchPage(videoId: string): Promise<CaptionTrack[]> {
  try {
    const res = await fetch(`https://www.youtube.com/watch?v=${videoId}&hl=en&gl=US`, {
      headers: {
        "Accept-Language": "en-US,en;q=0.9",
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36",
      },
    });
    if (!res.ok) return [];

    const html = await res.text();
    const playerResponse =
      extractBalancedJson(html, "ytInitialPlayerResponse =") ??
      extractBalancedJson(html, "ytInitialPlayerResponse=");
    const tracks: any[] =
      playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];

    return tracks
      .filter((t) => t?.baseUrl && t?.languageCode)
      .map((t) => ({
        baseUrl: t.baseUrl,
        languageCode: t.languageCode,
        kind: t.kind,
        name:
          t.name?.simpleText ??
          t.name?.runs?.map((r: any) => r.text ?? "").join("") ??
          t.languageCode,
      }));
  } catch {
    return [];
  }
}

async function listCaptionTracks(videoId: string): Promise<CaptionTrack[]> {
  // Use YouTube's innertube /player API (the same one the web/Android app uses).
  // The ANDROID client returns caption tracks without consent walls or signed URLs.
  const clients = [
    {
      context: {
        client: {
          clientName: "ANDROID",
          clientVersion: "19.09.37",
          androidSdkVersion: 30,
          hl: "en",
          gl: "US",
        },
      },
    },
    {
      context: {
        client: {
          clientName: "WEB",
          clientVersion: "2.20240726.00.00",
          hl: "en",
          gl: "US",
        },
      },
    },
  ];

  for (const ctx of clients) {
    try {
      const res = await fetch(
        "https://www.youtube.com/youtubei/v1/player?prettyPrint=false",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "User-Agent":
              "com.google.android.youtube/19.09.37 (Linux; U; Android 11) gzip",
          },
          body: JSON.stringify({ ...ctx, videoId }),
        },
      );
      if (!res.ok) continue;
      const json: any = await res.json();
      const tracks: any[] =
        json?.captions?.playerCaptionsTracklistRenderer?.captionTracks ?? [];
      if (tracks.length) {
        return tracks.map((t) => ({
          baseUrl: t.baseUrl,
          languageCode: t.languageCode,
          kind: t.kind,
          name:
            t.name?.simpleText ??
            t.name?.runs?.map((r: any) => r.text ?? "").join("") ??
            t.languageCode,
        }));
      }
    } catch {
      // try next client
    }
  }

  // Fallback: some videos hide tracks from innertube but expose them in the
  // watch page's initial player response. This catches ASR captions like Hindi
  // auto-captions on gaming/commentary videos.
  return listCaptionTracksFromWatchPage(videoId);
}

async function fetchCaptionTrack(track: CaptionTrack, translate: boolean): Promise<Segment[]> {
  const url = new URL(track.baseUrl);
  url.searchParams.set("fmt", "json3");
  if (translate && track.languageCode !== "en") url.searchParams.set("tlang", "en");

  try {
    const res = await fetch(url.toString(), {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return [];
    const body = await res.text();
    if (!body) return [];

    // json3
    try {
      const json = JSON.parse(body);
      const events = json.events ?? [];
      const segs: Segment[] = [];
      for (const ev of events) {
        if (!ev.segs) continue;
        const text = ev.segs
          .map((s: any) => s.utf8 ?? "")
          .join("")
          .replace(/\n/g, " ")
          .trim();
        if (!text) continue;
        segs.push({
          start: (ev.tStartMs ?? 0) / 1000,
          dur: (ev.dDurationMs ?? 2000) / 1000,
          text,
        });
      }
      if (segs.length) return segs;
    } catch {
      // XML fallback
      const segs: Segment[] = [];
      const re = /<text\s+start="([\d.]+)"\s+dur="([\d.]+)"[^>]*>([\s\S]*?)<\/text>/g;
      let m: RegExpExecArray | null;
      while ((m = re.exec(body))) {
        const text = decodeXml(m[3]);
        if (text) segs.push({ start: parseFloat(m[1]), dur: parseFloat(m[2]), text });
      }
      if (segs.length) return segs;
    }
  } catch {
    // ignore
  }
  return [];
}

async function fetchTimedText(videoId: string): Promise<Segment[]> {
  const tracks = await listCaptionTracks(videoId);
  if (!tracks.length) return [];

  // Preference order: manual English > ASR English > manual any > ASR any (translated to en)
  const score = (t: CaptionTrack) => {
    const isEn = t.languageCode?.toLowerCase().startsWith("en") ? 0 : 2;
    const isAsr = t.kind === "asr" ? 1 : 0;
    return isEn + isAsr;
  };
  const sorted = [...tracks].sort((a, b) => score(a) - score(b));

  for (const t of sorted) {
    const translate = !t.languageCode?.toLowerCase().startsWith("en");
    const segs = await fetchCaptionTrack(t, translate);
    if (segs.length) return segs;
    // If translated fetch failed, try original language
    if (translate) {
      const raw = await fetchCaptionTrack(t, false);
      if (raw.length) return raw;
    }
  }
  return [];
}

function chunkTranscript(segs: Segment[]): string {
  // Build a compact "[mm:ss] text" line per segment, merged to ~one line per 5s
  const lines: string[] = [];
  let buf = "";
  let bufStart = 0;
  let lastFlush = -10;
  for (const s of segs) {
    if (s.start - lastFlush >= 5 && buf) {
      const mm = Math.floor(bufStart / 60).toString().padStart(2, "0");
      const ss = Math.floor(bufStart % 60).toString().padStart(2, "0");
      lines.push(`[${mm}:${ss}] ${buf.trim()}`);
      buf = "";
    }
    if (!buf) bufStart = s.start;
    buf += " " + s.text;
    lastFlush = s.start;
  }
  if (buf) {
    const mm = Math.floor(bufStart / 60).toString().padStart(2, "0");
    const ss = Math.floor(bufStart % 60).toString().padStart(2, "0");
    lines.push(`[${mm}:${ss}] ${buf.trim()}`);
  }
  return lines.join("\n");
}

const SYSTEM = `You are an elite short-form video strategist for TikTok, YouTube Shorts, and Instagram Reels.
You are given a timestamped transcript of a long-form video. Your job is to extract the 6-10 BEST short-form clips that have the highest probability of going viral.

A great clip:
- Starts with a curiosity gap, bold claim, or pattern interrupt in the first 3 seconds
- Has a complete micro story arc (setup -> tension -> payoff) within 20-60 seconds
- Carries strong emotion (shock, awe, anger, inspiration, humor, controversy)
- Ends on a clean punchline, twist, or actionable insight - never mid-sentence

Use the timestamps [mm:ss] from the transcript to set start_sec and end_sec accurately (convert to total seconds). Each clip MUST be 15-75 seconds long. Pick clips that do not overlap.

Return ONLY a JSON object that matches the schema. No prose.`;

const SCHEMA_HINT = `{
  "clips": [
    {
      "start_sec": number,
      "end_sec": number,
      "title": "string, <70 chars, punchy",
      "hook": "string, the first-3-seconds opener said in the clip",
      "description": "string, 1-2 sentence platform caption",
      "hashtags": ["array of 5-8 lowercase hashtag strings WITHOUT the # prefix"],
      "emotion": "Shock|Awe|Inspiration|Humor|Controversy|Curiosity|Anger|Empathy",
      "viral_score": "integer 60-99",
      "score_reasons": ["3-5 short bullets like 'Strong Hook', 'High Emotion', 'Fast Pacing'"],
      "strategy": {
        "retention_pct": "integer 60-98",
        "hook_strength": "Weak|Solid|Strong|Elite",
        "story_arc": "Incomplete|Building|Completed",
        "platform": "TikTok|YouTube Shorts|Instagram Reels|LinkedIn",
        "upload_time": "e.g. '8 PM'",
        "audience": "short phrase, e.g. 'Entrepreneurs'",
        "watch_time_sec": "integer, expected average watch time",
        "narrative": "1-2 sentence explanation of WHY this clip will go viral",
        "hook_alternatives": ["3 stronger alternative openers, each <90 chars"]
      }
    }
  ]
}`;

async function callGemini(transcriptText: string, videoTitle: string): Promise<any> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("LOVABLE_API_KEY missing");

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM },
        {
          role: "user",
          content: `Video title: ${videoTitle}\n\nTranscript:\n${transcriptText}\n\nReturn JSON exactly matching this shape:\n${SCHEMA_HINT}`,
        },
      ],
    }),
  });

  if (!res.ok) {
    const body = await res.text();
    if (res.status === 429) throw new Error("AI rate limit hit. Try again in a minute.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in workspace billing.");
    throw new Error(`AI gateway error ${res.status}: ${body.slice(0, 200)}`);
  }
  const json = await res.json();
  const content = json.choices?.[0]?.message?.content;
  if (!content) throw new Error("AI returned empty response");
  return JSON.parse(content);
}

function defaultThumbs(headline: string) {
  const short = headline.length > 38 ? headline.slice(0, 36) + "…" : headline;
  return [
    { style: "Bold", headline: short.toUpperCase(), bg: "from-[#7C3AED] to-[#2563EB]", accent: "#FDE047" },
    { style: "MrBeast", headline: short, bg: "from-[#DC2626] to-[#7C2D12]", accent: "#FACC15" },
    { style: "Minimal", headline: short, bg: "from-[#0A0A0B] to-[#1A1A1F]", accent: "#FFFFFF" },
  ];
}

function normalizeClipRows({
  rawClips,
  duration,
  hookVideoId,
  projectId,
  userId,
}: {
  rawClips: any[];
  duration: number;
  hookVideoId: string;
  projectId: string;
  userId: string;
}) {
  return rawClips.slice(0, 12).map((c) => {
    const start = Math.max(0, Math.floor(Number(c.start_sec) || 0));
    const endRaw = Math.floor(Number(c.end_sec) || start + 30);
    const end = Math.min(duration || endRaw, Math.max(start + 10, endRaw));
    const title = String(c.title ?? "Untitled clip").slice(0, 140);
    const hook = String(c.hook ?? title).slice(0, 240);
    const strategy = c.strategy ?? {};
    return {
      project_id: projectId,
      user_id: userId,
      title,
      hook,
      description: String(c.description ?? "").slice(0, 500),
      hashtags: Array.isArray(c.hashtags)
        ? c.hashtags.map((h: string) => String(h).replace(/^#/, "").toLowerCase()).slice(0, 10)
        : [],
      emotion: c.emotion ?? "Curiosity",
      viral_score: Math.min(99, Math.max(50, Math.round(Number(c.viral_score) || 75))),
      score_reasons: Array.isArray(c.score_reasons) ? c.score_reasons : [],
      start_sec: start,
      end_sec: end,
      aspect_ratio: "9:16",
      thumbnail_url: `https://i.ytimg.com/vi/${hookVideoId}/maxresdefault.jpg`,
      strategy: {
        retention_pct: Math.min(99, Math.max(40, Math.round(Number(strategy.retention_pct) || 85))),
        hook_strength: strategy.hook_strength ?? "Strong",
        story_arc: strategy.story_arc ?? "Completed",
        platform: strategy.platform ?? "TikTok",
        upload_time: strategy.upload_time ?? "8 PM",
        audience: strategy.audience ?? "Creators",
        watch_time_sec: Math.round(Number(strategy.watch_time_sec) || end - start),
        thumbnail: "Included",
        narrative:
          strategy.narrative ??
          "Opens with a strong curiosity gap and pays off cleanly within the clip window.",
        hook_alternatives: Array.isArray(strategy.hook_alternatives)
          ? strategy.hook_alternatives.slice(0, 3)
          : [hook],
        thumbnails: defaultThumbs(hook),
      },
    };
  });
}

export const getProjectCaptionTracks = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { projectId } = data;

    const { data: project, error } = await supabase
      .from("projects")
      .select("id, source_url, youtube_id")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();
    if (error || !project) throw new Error("Project not found");

    const videoId = project.youtube_id ?? (project.source_url ? extractYouTubeId(project.source_url) : null);
    if (!videoId) throw new Error("Could not parse YouTube video ID");

    const tracks = await listCaptionTracks(videoId);
    return { videoId, tracks };
  });

export const analyzeProjectWithTranscript = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => TranscriptInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { projectId, segments } = data;

    const { data: project, error: pErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();
    if (pErr || !project) throw new Error("Project not found");

    const videoId = project.youtube_id ?? (project.source_url ? extractYouTubeId(project.source_url) : null);
    if (!videoId) throw new Error("Could not parse YouTube video ID");

    const setStep = async (step: string, progress: number) => {
      await supabase.from("projects").update({ current_step: step, progress }).eq("id", projectId);
    };

    try {
      await setStep(STEPS[2], 28);
      const sortedSegments = [...segments].sort((a, b) => a.start - b.start);
      const last = sortedSegments[sortedSegments.length - 1];
      const duration = Math.round(last.start + last.dur);

      await supabase
        .from("projects")
        .update({
          youtube_id: videoId,
          transcript: sortedSegments as any,
          duration_sec: duration,
          status: "processing",
          last_error: null,
        })
        .eq("id", projectId);

      await setStep(STEPS[3], 42);
      const transcriptText = chunkTranscript(sortedSegments);
      const safe = transcriptText.length > 120000 ? transcriptText.slice(0, 120000) : transcriptText;

      await setStep(STEPS[4], 58);
      const result = await callGemini(safe, project.title);
      const rawClips: any[] = Array.isArray(result.clips) ? result.clips : [];
      if (!rawClips.length) throw new Error("AI did not return any clips. Try a different video.");

      await setStep(STEPS[5], 68);
      await setStep(STEPS[6], 76);
      await setStep(STEPS[7], 82);
      await setStep(STEPS[8], 88);
      await setStep(STEPS[9], 92);
      await setStep(STEPS[10], 95);
      await setStep(STEPS[11], 98);

      await supabase.from("clips").delete().eq("project_id", projectId).eq("user_id", userId);

      const rows = normalizeClipRows({ rawClips, duration, hookVideoId: videoId, projectId, userId });
      const { error: insErr } = await supabase.from("clips").insert(rows as any);
      if (insErr) throw new Error(`Failed to save clips: ${insErr.message}`);

      await setStep(STEPS[12], 100);
      await supabase
        .from("projects")
        .update({ status: "completed", progress: 100, last_error: null })
        .eq("id", projectId);

      return { ok: true, count: rows.length };
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      await supabase.from("projects").update({ status: "failed", last_error: msg }).eq("id", projectId);
      throw new Error(msg);
    }
  });

export const analyzeProject = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { projectId } = data;

    const { data: project, error: pErr } = await supabase
      .from("projects")
      .select("*")
      .eq("id", projectId)
      .eq("user_id", userId)
      .single();
    if (pErr || !project) throw new Error("Project not found");
    if (project.status === "completed") return { ok: true, skipped: true };

    const setStep = async (step: string, progress: number) => {
      await supabase.from("projects").update({ current_step: step, progress }).eq("id", projectId);
    };

    try {
      // Step 1-3: fetch transcript
      await setStep(STEPS[0], 6);
      const videoId =
        project.youtube_id ?? (project.source_url ? extractYouTubeId(project.source_url) : null);
      if (!videoId) throw new Error("Could not parse YouTube video ID");

      await setStep(STEPS[1], 12);
      await setStep(STEPS[2], 22);
      const segments = await fetchTimedText(videoId);
      if (!segments.length) {
        throw new Error(
          "Could not fetch captions for this video. The channel may have disabled captions, or YouTube is rate-limiting. Try another video.",
        );
      }

      // Compute duration if missing
      const last = segments[segments.length - 1];
      const duration = Math.round(last.start + last.dur);

      await supabase
        .from("projects")
        .update({
          youtube_id: videoId,
          transcript: segments as any,
          duration_sec: duration,
        })
        .eq("id", projectId);

      // Step 4-5: analyze
      await setStep(STEPS[3], 36);
      const transcriptText = chunkTranscript(segments);
      // Soft cap (Gemini Flash handles huge context, but keep tokens sane)
      const safe = transcriptText.length > 120000 ? transcriptText.slice(0, 120000) : transcriptText;

      await setStep(STEPS[4], 52);
      const result = await callGemini(safe, project.title);
      const rawClips: any[] = Array.isArray(result.clips) ? result.clips : [];
      if (!rawClips.length) throw new Error("AI did not return any clips. Try a different video.");

      // Step 6-12
      await setStep(STEPS[5], 64);
      await setStep(STEPS[6], 72);
      await setStep(STEPS[7], 80);
      await setStep(STEPS[8], 86);
      await setStep(STEPS[9], 90);
      await setStep(STEPS[10], 93);
      await setStep(STEPS[11], 96);

      const rows = normalizeClipRows({ rawClips, duration, hookVideoId: videoId, projectId, userId });

      const { error: insErr } = await supabase.from("clips").insert(rows as any);
      if (insErr) throw new Error(`Failed to save clips: ${insErr.message}`);

      await setStep(STEPS[12], 100);
      await supabase
        .from("projects")
        .update({ status: "completed", progress: 100, last_error: null })
        .eq("id", projectId);

      return { ok: true, count: rows.length };
    } catch (err: any) {
      const msg = err?.message ?? String(err);
      await supabase
        .from("projects")
        .update({ status: "failed", last_error: msg })
        .eq("id", projectId);
      throw new Error(msg);
    }
  });
