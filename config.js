// Site settings. Edit this file, commit, and Vercel redeploys automatically.
window.IBC_CONFIG = {
  // Paste the Google Apps Script web app URL here (ends in /exec).
  // While it's empty, the site runs in preview mode: suggestions are NOT saved.
  API_URL: "",

  // Used only if the Google Sheet can't be reached (or API_URL is empty).
  // The live list comes from the "Speakers" tab of the Google Sheet.
  FALLBACK_SPEAKERS: [
    { name: "Ayya Santini", photo: "speakers/ayya-santini.jpg" },
    { name: "Ajahn Visalo", photo: "" },
    { name: "Metta Wijaya", photo: "" },
    { name: "Bhante Atthadhiro", photo: "" },
    { name: "Bhante Santacitto", photo: "" },
    { name: "Bhante Adhiratano", photo: "" }
  ]
};
