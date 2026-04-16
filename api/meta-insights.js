// /api/meta-insights.js
// Vercel Serverless Function — Meta Marketing API proxy
// Requiere env vars en Vercel:
//   META_ACCESS_TOKEN   -> token de acceso de larga duración
//   META_AD_ACCOUNT_ID  -> ej: "act_1234567890"

const GRAPH_VERSION = "v19.0";
const BASE = `https://graph.facebook.com/${GRAPH_VERSION}`;

async function callMeta(path, params, token) {
  const url = new URL(`${BASE}${path}`);
  Object.entries(params || {}).forEach(([k, v]) => {
    if (v !== undefined && v !== null) url.searchParams.set(k, v);
  });
  url.searchParams.set("access_token", token);
  const r = await fetch(url.toString());
  const data = await r.json();
  if (!r.ok || data.error) {
    const msg = data.error ? data.error.message : `HTTP ${r.status}`;
    throw new Error(msg);
  }
  return data;
}

export default async function handler(req, res) {
  // CORS (same origin normalmente, pero por si acaso)
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=60, stale-while-revalidate=120");

  const TOKEN = process.env.META_ACCESS_TOKEN;
  const ACCOUNT = process.env.META_AD_ACCOUNT_ID;

  if (!TOKEN || !ACCOUNT) {
    return res.status(200).json({
      ok: false,
      configured: false,
      message:
        "Faltan env vars META_ACCESS_TOKEN y/o META_AD_ACCOUNT_ID en Vercel.",
    });
  }

  const endpoint = (req.query.endpoint || "overview").toString();
  const datePreset = (req.query.date_preset || "today").toString();

  try {
    let payload;

    if (endpoint === "overview") {
      const insights = await callMeta(
        `/${ACCOUNT}/insights`,
        {
          level: "account",
          date_preset: datePreset,
          fields:
            "spend,impressions,clicks,ctr,cpc,cpm,reach,frequency,actions,action_values,purchase_roas",
        },
        TOKEN
      );
      payload = { insights: insights.data || [] };
    } else if (endpoint === "campaigns") {
      const camps = await callMeta(
        `/${ACCOUNT}/insights`,
        {
          level: "campaign",
          date_preset: datePreset,
          limit: 50,
          fields:
            "campaign_id,campaign_name,spend,impressions,clicks,ctr,cpc,reach,actions,purchase_roas,objective",
        },
        TOKEN
      );
      payload = { campaigns: camps.data || [] };
    } else if (endpoint === "creatives") {
      const ads = await callMeta(
        `/${ACCOUNT}/insights`,
        {
          level: "ad",
          date_preset: datePreset,
          limit: 50,
          fields:
            "ad_id,ad_name,adset_name,campaign_name,spend,impressions,clicks,ctr,cpm,actions,purchase_roas",
        },
        TOKEN
      );
      payload = { creatives: ads.data || [] };
    } else if (endpoint === "audiences_age_gender") {
      const breakdown = await callMeta(
        `/${ACCOUNT}/insights`,
        {
          level: "account",
          date_preset: datePreset,
          breakdowns: "age,gender",
          fields: "spend,impressions,clicks,ctr,actions,purchase_roas",
        },
        TOKEN
      );
      payload = { age_gender: breakdown.data || [] };
    } else if (endpoint === "audiences_country") {
      const breakdown = await callMeta(
        `/${ACCOUNT}/insights`,
        {
          level: "account",
          date_preset: datePreset,
          breakdowns: "country",
          fields: "spend,impressions,clicks,ctr,actions,purchase_roas",
          limit: 30,
        },
        TOKEN
      );
      payload = { country: breakdown.data || [] };
    } else if (endpoint === "audiences_device") {
      const breakdown = await callMeta(
        `/${ACCOUNT}/insights`,
        {
          level: "account",
          date_preset: datePreset,
          breakdowns: "device_platform",
          fields: "spend,impressions,clicks,ctr,actions,purchase_roas",
        },
        TOKEN
      );
      payload = { device: breakdown.data || [] };
    } else if (endpoint === "placements") {
      const breakdown = await callMeta(
        `/${ACCOUNT}/insights`,
        {
          level: "account",
          date_preset: datePreset,
          breakdowns: "publisher_platform,platform_position",
          fields: "spend,impressions,clicks,ctr,actions,purchase_roas",
        },
        TOKEN
      );
      payload = { placements: breakdown.data || [] };
    } else if (endpoint === "daily") {
      const daily = await callMeta(
        `/${ACCOUNT}/insights`,
        {
          level: "account",
          date_preset: datePreset === "today" ? "last_30d" : datePreset,
          time_increment: 1,
          fields:
            "spend,impressions,clicks,ctr,actions,purchase_roas,date_start",
        },
        TOKEN
      );
      payload = { daily: daily.data || [] };
    } else {
      return res
        .status(400)
        .json({ ok: false, message: `Endpoint desconocido: ${endpoint}` });
    }

    return res
      .status(200)
      .json({ ok: true, configured: true, endpoint, date_preset: datePreset, ...payload });
  } catch (err) {
    return res
      .status(200)
      .json({ ok: false, configured: true, message: err.message || String(err) });
  }
}
