/**
 * Map a calendar date to an On This Day YouTube Short.
 *
 * Key format: "M-D" (August 22 → "8-22"). Leading zeros are optional.
 * `id` is the 11-character YouTube ID from youtube.com/shorts/ID or watch?v=ID.
 *
 * Add a line here whenever a new daily short goes up:
 *   "9-15": { id: "xxxxxxxxxxx", title: "Battle of Britain Day" },
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
};

export function shortKey(month, day) {
  return `${Number(month)}-${Number(day)}`;
}

export function shortFor(month, day) {
  const key = shortKey(month, day);
  return SHORTS[key] || SHORTS[`${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`] || null;
}

export function hasShort(month, day) {
  return Boolean(shortFor(month, day));
}
