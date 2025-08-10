// netlify/functions/flights.js
export default async (req, context) => {
  const { searchParams } = new URL(req.url);
  const airport = searchParams.get("airport") || "IAD";
  const type = (searchParams.get("type") || "arrivals").toLowerCase(); // "arrivals" | "departures"
  const key = process.env.AVIATIONSTACK_KEY;
  if (!key) {
    return new Response(
      JSON.stringify({ error: "Missing AVIATIONSTACK_KEY" }),
      { status: 500 }
    );
  }

  const dirParam =
    type === "arrivals" ? `arr_iata=${airport}` : `dep_iata=${airport}`;
  const url = `http://api.aviationstack.com/v1/flights?access_key=${key}&${dirParam}`;

  try {
    const res = await fetch(url);
    if (!res.ok)
      return new Response(JSON.stringify({ error: `Upstream ${res.status}` }), {
        status: 502,
      });
    const json = await res.json();

    const normalize = (r) => {
      const airline = (r.airline?.iata || r.airline?.name || "").toUpperCase();
      const number = (r.flight?.number || "").toUpperCase();
      const flight = (airline + number).slice(0, 8) || "-";

      const city =
        (type === "arrivals" ? r.departure?.airport : r.arrival?.airport) ||
        (type === "arrivals" ? r.departure?.iata : r.arrival?.iata) ||
        "-";

      const tObj = type === "arrivals" ? r.arrival : r.departure;
      const tIso = tObj?.scheduled;
      const d = tIso ? new Date(tIso) : null;
      const hhmm = d
        ? `${String(d.getHours()).padStart(2, "0")}:${String(
            d.getMinutes()
          ).padStart(2, "0")}`
        : "--:--";

      const gate = String(tObj?.gate || tObj?.terminal || "--").toUpperCase();
      const status = mapStatus(r.flight_status || "scheduled");

      return {
        flight,
        origin: String(city).toUpperCase().slice(0, 15),
        time: hhmm,
        gate: gate.slice(0, 5),
        status: status.slice(0, 10),
      };
    };

    const data = (json?.data || []).slice(0, 20).map(normalize);
    return Response.json({ data });
  } catch (e) {
    return new Response(JSON.stringify({ error: e.message }), { status: 500 });
  }
};

function mapStatus(s) {
  const t = (s || "").toLowerCase();
  if (t.includes("cancel")) return "CANCELED";
  if (t.includes("delay")) return "DELAYED";
  if (t.includes("land") || t.includes("arriv")) return "ARRIVED";
  if (t.includes("board")) return "BOARDING";
  return "ON TIME";
}
