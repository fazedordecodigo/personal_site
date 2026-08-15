module.exports = {
  ci: {
    collect: {
      numberOfRuns: 3,
      startServerCommand: "node scripts/serve.mjs public 4173",
      url: ["http://127.0.0.1:4173/"],
      startServerReadyPattern: "Listening on http://127.0.0.1:4173",
      settings: {
        chromeFlags: "--headless",
      },
    },
    assert: {
      assertions: {
        "categories:performance": ["error", { minScore: 0.9 }],
        "categories:accessibility": ["error", { minScore: 1 }],
        "categories:best-practices": ["error", { minScore: 0.95 }],
        "categories:seo": ["error", { minScore: 1 }],
        "largest-contentful-paint": ["error", { maxNumericValue: 2500 }],
        "cumulative-layout-shift": ["error", { maxNumericValue: 0.1 }],
        "total-blocking-time": ["error", { maxNumericValue: 200 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: ".lighthouseci",
    },
  },
};
