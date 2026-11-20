/* =====================================================================
   SITE CONTENT
   Everything visitors read lives in this one file.
   - Edit it by hand, or open the site with ?edit at the end of the
     address, make changes on the page, then click "Export content.js"
     and replace this file with the downloaded one.
   - Text in [square brackets] is placeholder: replace before sharing.
   - Dates: "YYYY-MM" or "YYYY-MM-DD".
   - Images: a path like "images/fed-meeting.jpg" (put the file in the
     images folder), or an image uploaded through edit mode.
   ===================================================================== */
window.SITE = {
  "settings": {
    "siteName": "[Your Name] — Macroeconomic Equity Research",
    "author": "[Your Name]",
    "email": "[you@university.edu]",
    "linkedin": "",
    "footerNote": "Independent research. Not investment advice."
  },

  "home": {
    "eyebrow": "Macroeconomic Equity Research",
    "title": "Tracking how the macro cycle moves equity markets.",
    "lede": "A running record of macroeconomic analysis applied to listed equities — indicators, sector positioning and price behaviour tracked month by month, developed with fellow students and reviewed with faculty.",
    "about": "[Write two or three short paragraphs about yourself and the project: your programme and year, why you started tracking these markets, and the method you follow.]\n\n[For example: each report begins with a macro release (CPI, payrolls, a central bank decision), states a view on the sectors most exposed to it, and then tracks those equities over the following months against that view. Results — right or wrong — are recorded as they come in.]",
    "focus": [
      { "title": "Monetary policy and rates", "text": "Policy-rate decisions, yield-curve shape and how rate expectations pass through to financials, real estate and long-duration growth equities." },
      { "title": "Inflation and the labour market", "text": "CPI, PCE and payroll releases read against margins and pricing power in consumer and industrial names." },
      { "title": "Sector rotation", "text": "Relative performance across sectors through the cycle, tracked against a written thesis and revisited at each review point." }
    ]
  },

  "research": {
    "title": "Research Reports",
    "lede": "Macroeconomic tracing records. Each report states a thesis, the indicators behind it, and how the covered equities moved over the tracking period."
  },

  "reports": [
    {
      "id": "rates-and-financials",
      "date": "2026-09",
      "title": "[Sample] Policy Rate Path and U.S. Financial Sector Equities",
      "period": "Jan 2026 – Sep 2026",
      "coverage": "[Tickers / index, e.g. XLF, KRE]",
      "tags": ["Monetary policy", "Financials"],
      "authors": "[Your Name], [Student Name]",
      "reviewer": "[Professor Name]",
      "summary": "[One-paragraph summary: the macro view, the equities it applies to, and the conclusion at the end of the tracking period.]",
      "chart": {
        "title": "Tracked series, indexed (start = 100)",
        "note": "Placeholder series for layout only — replace with your tracked data.",
        "series": [
          { "name": "Sector index", "points": [["2026-01",100],["2026-02",102.1],["2026-03",99.4],["2026-04",101.8],["2026-05",104.6],["2026-06",103.2],["2026-07",106.9],["2026-08",108.1],["2026-09",107.4]] },
          { "name": "Broad market", "points": [["2026-01",100],["2026-02",101.2],["2026-03",100.1],["2026-04",101.0],["2026-05",102.3],["2026-06",102.9],["2026-07",103.8],["2026-08",104.0],["2026-09",104.9]] }
        ]
      },
      "indicators": [
        { "name": "[Policy rate]", "value": "[x.xx%]", "change": "[−0.25 pp]", "note": "[Source and date]" },
        { "name": "[10Y–2Y spread]", "value": "[x bp]", "change": "[+x bp]", "note": "[Source and date]" },
        { "name": "[Core CPI, y/y]", "value": "[x.x%]", "change": "[−0.x pp]", "note": "[Source and date]" }
      ],
      "sections": [
        { "heading": "Thesis", "body": "[State the macro view and why it should matter for these equities.]" },
        { "heading": "Method", "body": "[Describe the data, the tracking frequency and the benchmark used for comparison.]" },
        { "heading": "Findings", "body": "[What happened over the tracking period, month by month where useful.]\n\n[Where the thesis held, and where it did not.]" },
        { "heading": "Review and next steps", "body": "[Notes from faculty review and what will be tracked next.]" }
      ],
      "images": [
        { "src": "", "caption": "[Working session — add photo]" },
        { "src": "", "caption": "[Data workbook screenshot]" },
        { "src": "", "caption": "[Review with Professor Name]" }
      ],
      "link": { "label": "", "url": "" }
    },
    {
      "id": "inflation-consumer",
      "date": "2026-05",
      "title": "[Sample] Inflation Persistence and Consumer Discretionary Margins",
      "period": "Nov 2025 – May 2026",
      "coverage": "[Tickers / index]",
      "tags": ["Inflation", "Consumer"],
      "authors": "[Your Name]",
      "reviewer": "[Professor Name]",
      "summary": "[One-paragraph summary.]",
      "chart": {
        "title": "Tracked series, indexed (start = 100)",
        "note": "Placeholder series for layout only — replace with your tracked data.",
        "series": [
          { "name": "Sector index", "points": [["2025-11",100],["2025-12",98.7],["2026-01",97.2],["2026-02",98.9],["2026-03",96.4],["2026-04",95.8],["2026-05",97.6]] }
        ]
      },
      "indicators": [
        { "name": "[Headline CPI, y/y]", "value": "[x.x%]", "change": "[+0.x pp]", "note": "[Source and date]" }
      ],
      "sections": [
        { "heading": "Thesis", "body": "[State the macro view.]" },
        { "heading": "Findings", "body": "[Results over the period.]" }
      ],
      "images": [
        { "src": "", "caption": "[Add photo]" }
      ],
      "link": { "label": "", "url": "" }
    },
    {
      "id": "curve-and-real-estate",
      "date": "2025-12",
      "title": "[Sample] Yield-Curve Normalisation and Listed Real Estate",
      "period": "Jun 2025 – Dec 2025",
      "coverage": "[Tickers / index]",
      "tags": ["Monetary policy", "Real estate"],
      "authors": "[Your Name], [Student Name], [Student Name]",
      "reviewer": "",
      "summary": "[One-paragraph summary.]",
      "chart": {
        "title": "Tracked series, indexed (start = 100)",
        "note": "Placeholder series for layout only — replace with your tracked data.",
        "series": [
          { "name": "Sector index", "points": [["2025-06",100],["2025-07",101.5],["2025-08",103.0],["2025-09",102.2],["2025-10",104.4],["2025-11",105.1],["2025-12",106.3]] }
        ]
      },
      "indicators": [],
      "sections": [
        { "heading": "Thesis", "body": "[State the macro view.]" }
      ],
      "images": [],
      "link": { "label": "", "url": "" }
    }
  ],

  "timeline": {
    "title": "Timeline",
    "lede": "How the research developed — reports, working sessions with fellow students, and reviews with faculty.",
    "events": [
      { "date": "2026-09-20", "type": "Report", "title": "[Sample] Published: Policy Rate Path and Financial Sector Equities", "text": "[One or two sentences on what was concluded.]", "report": "rates-and-financials", "images": [] },
      { "date": "2026-07-14", "type": "Faculty review", "title": "[Sample] Mid-period review with [Professor Name]", "text": "[What was discussed and what changed as a result.]", "report": "", "images": [ { "src": "", "caption": "[Photo of the review]" } ] },
      { "date": "2026-05-30", "type": "Report", "title": "[Sample] Published: Inflation Persistence and Consumer Margins", "text": "[Summary.]", "report": "inflation-consumer", "images": [] },
      { "date": "2026-02-10", "type": "Collaboration", "title": "[Sample] Working group formed with [Student Names]", "text": "[How the group splits the tracking work.]", "report": "", "images": [ { "src": "", "caption": "[Group photo]" }, { "src": "", "caption": "[Shared tracking sheet]" } ] },
      { "date": "2025-12-18", "type": "Report", "title": "[Sample] Published: Yield-Curve Normalisation and Listed Real Estate", "text": "[Summary.]", "report": "curve-and-real-estate", "images": [] },
      { "date": "2025-06-01", "type": "Start", "title": "[Sample] Tracking record begins", "text": "[Why and how the project started.]", "report": "", "images": [] }
    ]
  },

  "people": {
    "title": "Collaborators",
    "lede": "The faculty who reviewed this work and the students who tracked it alongside me.",
    "faculty": [
      { "name": "[Professor Name]", "role": "[Professor of Economics, University]", "note": "[How they contributed — e.g. reviewed methodology for the rates reports.]", "photo": "" },
      { "name": "[Professor Name]", "role": "[Associate Professor of Finance, University]", "note": "[Contribution.]", "photo": "" }
    ],
    "students": [
      { "name": "[Student Name]", "role": "[Programme, year]", "note": "[Area covered.]", "photo": "" },
      { "name": "[Student Name]", "role": "[Programme, year]", "note": "[Area covered.]", "photo": "" },
      { "name": "[Student Name]", "role": "[Programme, year]", "note": "[Area covered.]", "photo": "" }
    ]
  }
};
