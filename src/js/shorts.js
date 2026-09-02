/**
 * Map a calendar date to an On This Day YouTube Short.
 *
 * Key format: "M-D" (August 22 → "8-22").
 * New daily shorts are also pulled live from the YouTube feed and overlaid on this list.
 */
export const SHORTS = {
  "2-23": { id: "IR3VQsFX_Kk", title: "The Alamo kicks off" },
  "3-30": { id: "uLlav-PiJFM", title: "Longshanks at Berwick, Nuremberg raid" },
  "4-9": { id: "H2BnvEUAvSU", title: "Lee surrenders at Appomattox" },
  "4-20": { id: "Q9RjEPqGlUY", title: "Cromwell shuts Parliament" },
  "6-4": { id: "30oVQx89fHk", title: "We shall fight on the beaches" },
  "6-6": { id: "g2X5MubKN4s", title: "D-Day Special, Part 1" },
  "6-18": { id: "Qd2rql_TklE", title: "Waterloo Special, 1815" },
  "8-14": { id: "vAFnDVo9GFs", title: "Macbeth, the Falklands, the Atlantic Charter" },
  "8-15": { id: "dSoB0MoSFoA", title: "Operation Pedestal saves Malta" },
  "8-17": { id: "SSAfX6j8m2U", title: "Schweinfurt–Regensburg" },
  "8-18": { id: "aGIFslAT77g", title: "The Hardest Day — Battle of Britain" },
  "8-19": { id: "ylB-ziqDN94", title: "The Dieppe raid" },
  "8-20": { id: "Q7oAtITmxRY", title: "The Few, and Trotsky" },
  "8-21": { id: "Xm-sqr-FMoY", title: "August 21st. On this day in history." },
  "8-23": { id: "O39QCdw1MCU", title: "August 23rd. Stalingrad begins. William Wallace. Molotov Ribbentrop pact" },
  "8-24": { id: "M9ddkar7mxI", title: "August 24th. The fight for Paris." },
  "8-25": { id: "h90g7G3cZ8Q", title: "Paris Liberated! On this day in history August 25th." },
  "8-26": { id: "zFcjtvHXpxM", title: "August 26th. Charles De Gaulle claims victory is his." },
  "8-28": { id: "QRRpEtD7yH0", title: "August 28th." },
  "8-29": { id: "3Gw-YXvbJUE", title: "August 29th. Soviet test atom bomb." },
  "8-30": { id: "_Xz22LxnjkU", title: "August 30th. Henry VIII excommunicated. Washington to Moscow hotline." },
  "8-31": { id: "RaTBIIrHNB8", title: "August 31st. The day before WW2. Gleiwitz radio station false flag." },
  "9-1": { id: "71mcgqu8uzU", title: "WW2 Starts on this day in history September 1st 1939. Germany invades Poland" },
};

const live = {};

export function shortKey(month, day) {
  return `${Number(month)}-${Number(day)}`;
}

export function hydrateShorts(map) {
  for (const key of Object.keys(live)) delete live[key];
  if (!map || typeof map !== "object") return;
  for (const [rawKey, value] of Object.entries(map)) {
    if (!value?.id) continue;
    const [month, day] = String(rawKey).split("-").map(Number);
    if (!month || !day) continue;
    live[shortKey(month, day)] = {
      id: value.id,
      title: value.title || "",
    };
  }
}

export function shortFor(month, day) {
  const key = shortKey(month, day);
  return live[key] || SHORTS[key] || SHORTS[`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`] || null;
}

export function hasShort(month, day) {
  return Boolean(shortFor(month, day));
}
