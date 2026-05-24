const TBA_KEY = import.meta.env.VITE_TBA_KEY;
const BASE = "https://www.thebluealliance.com/api/v3";

async function tbaFetch(path) {
  const res = await fetch(`${BASE}${path}`, {
    headers: { "X-TBA-Auth-Key": TBA_KEY }
  });
  if (!res.ok) throw new Error(`TBA API ${res.status}: ${path}`);
  return res.json();
}

export const TEAM = "frc7645";

export const getTeamAllAwards = () => tbaFetch(`/team/${TEAM}/awards`);
export const getTeamYearAwards = (year) => tbaFetch(`/team/${TEAM}/awards/${year}`);
export const getTeamYearEvents = (year) => tbaFetch(`/team/${TEAM}/events/${year}/simple`);
export const getTeamEventStatus = (eventKey) => tbaFetch(`/team/${TEAM}/event/${eventKey}/status`);
export const getTeamYearsParticipated = () => tbaFetch(`/team/${TEAM}/years_participated`);

// Award type → display name map (common FRC awards)
export const AWARD_NAMES = {
  0: "Chairman's Award",
  1: "Regional Winners",
  2: "Regional Finalists",
  3: "Woodie Flowers Finalist Award",
  9: "Rookie Inspiration Award",
  10: "Rookie All Star Award",
  14: "Highest Rookie Seed",
  20: "Engineering Inspiration Award",
  21: "Excellence in Engineering Award",
  22: "Entrepreneurship Award",
  27: "Imagery Award in honor of Jack Kamen",
  29: "Innovation in Control Award",
  30: "Quality Award",
  31: "Safety Award",
  35: "Industrial Design Award",
};

// event_type → is competition (not offseason)
export const isCompetitionEvent = (eventType) => eventType <= 6;

// FRC season game names
export const FRC_GAMES = {
  2019: "Destination: Deep Space",
  2020: "INFINITE RECHARGE",
  2021: "INFINITE RECHARGE At Home",
  2022: "RAPID REACT",
  2023: "CHARGED UP",
  2024: "CRESCENDO",
  2025: "REEFSCAPE",
};
