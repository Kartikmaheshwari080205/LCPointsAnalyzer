(function () {
  let retryCount = 0;
  const MAX_RETRIES = 3;
  const RETRY_DELAY = 2000;
  const POINTS_API = "https://leetcode.com/points/api/";
  const POINTS_TOTAL_API = "https://leetcode.com/points/api/total/";
  
  function parseTableRows() {
    const rows = [];
    const tableSelectors = [
      "table tbody tr",
      "[data-testid*='table'] tbody tr", 
      ".table tbody tr",
      "table tr:not(:first-child)",
      "[class*='table'] tr"
    ];
    let tableRows = [];
    for (const selector of tableSelectors) {
      tableRows = document.querySelectorAll(selector);
      if (tableRows.length > 0) {
        console.log("LeetPoints: Found table with selector:", selector, "rows:", tableRows.length);
        break;
      }
    }
    if (tableRows && tableRows.length) {
      tableRows.forEach(row => {
        const cols = row.querySelectorAll("td, th");
        if (cols.length >= 2) {
          let date = "", desc = "", pts = 0;
          if (cols.length >= 3) {
            date = cols[0].innerText.trim();
            desc = cols[1].innerText.trim();
            const ptsText = cols[2].innerText.trim();
            pts = parseInt(ptsText.replace(/[+,]/g, "")) || 0;
          } else if (cols.length === 2) {
            desc = cols[0].innerText.trim();
            const ptsText = cols[1].innerText.trim();
            pts = parseInt(ptsText.replace(/[+,]/g, "")) || 0;
          }
          if (desc && pts > 0) {
            rows.push({ date, desc, pts });
          }
        }
      });
    }
    return rows;
  }
  function parseGenericRows() {
    const rows = [];
    const selectors = [
      "li, .point-item, .points-row, .history-row, tr",
      "[class*='point'], [class*='score'], [class*='history']",
      "[data-testid*='point'], [data-testid*='score']",
      ".ant-table tbody tr, .ant-list-item",
      "[class*='List'] > div, [class*='Item']",
      "[role='row'], [role='cell'], .MuiTableRow-root",
      "div, span, p"
    ];
    let candidates = [];
    for (const selector of selectors) {
      try {
        if (selector === "*") {
          candidates = Array.from(document.querySelectorAll("*")).filter(el => {
            const text = el.innerText || "";
            return text.match(/\d+\s*pts?/i) || text.match(/\d+\s*points?/i);
          });
        } else {
          candidates = document.querySelectorAll(selector);
        }
        if (candidates.length > 0) {
          console.log("LeetPoints: Found candidates with selector:", selector, "count:", candidates.length);
          break;
        }
      } catch (e) {
      }
    }
    candidates.forEach(el => {
      const text = el.innerText || "";
      const matchPts = text.match(/([+-]?\d+)\s*pts?/i) || 
                      text.match(/([+-]?\d+)\s*points?/i) || 
                      text.match(/score[:\s]+([+-]?\d+)/i) ||
                      text.match(/\+([1-9]\d*)/g) ||
                      text.match(/\b([1-9]\d*)\b/g);
      if (!matchPts) return;
      let pts = 0;
      if (Array.isArray(matchPts)) {
        for (const match of matchPts) {
          const num = parseInt(match.replace(/[+,]/g, "")) || 0;
          if (num > 0 && num <= 1000) {
            pts = num;
            break;
          }
        }
      } else {
        pts = parseInt(matchPts[1].replace(/[+,]/g, "")) || 0;
      }
      if (pts === 0 || pts > 1000) return;
      const dateMatch = text.match(/\b(\w{3,9}\s+\d{1,2},\s*\d{4})\b/) || 
                       text.match(/\b(\d{4}-\d{2}-\d{2})\b/) ||
                       text.match(/\b(\d{1,2}\/\d{1,2}\/\d{4})\b/) ||
                       text.match(/(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2})/);
      const date = dateMatch ? dateMatch[1] : "";
      let desc = text.replace(matchPts[0], "").replace(date, "").trim();
      desc = desc.split("\n")[0].trim().slice(0, 200);
      if (desc || pts > 0) {
        rows.push({ date, desc, pts });
      }
    });
    return rows;
  }
  async function fetchPointsFromAPI() {
    try {
      console.log("LeetPoints: Attempting to fetch from API:", POINTS_API);
      const response = await fetch(POINTS_API, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }
      const data = await response.json();
      console.log("LeetPoints: API response:", data);
      let pointsArray = [];
      if (data.scores && Array.isArray(data.scores)) {
        pointsArray = data.scores;
      } else if (data.points && Array.isArray(data.points)) {
        pointsArray = data.points;
      } else if (data.data && Array.isArray(data.data)) {
        pointsArray = data.data;
      } else if (Array.isArray(data)) {
        pointsArray = data;
      }
      console.log("LeetPoints: Found", pointsArray.length, "point entries from API");
      return pointsArray;
    } catch (error) {
      console.warn("LeetPoints: API fetch failed:", error.message);
      return null;
    }
  }
  async function fetchTotalPointsFromAPI() {
    try {
      const response = await fetch(POINTS_TOTAL_API, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      if (response.ok) {
        const data = await response.json();
        console.log("LeetPoints: Total points API response:", data);
        return data;
      }
    } catch (error) {
      console.warn("LeetPoints: Total points API failed:", error.message);
    }
    return null;
  }
  function categorize(desc) {
    if (!desc) return "Others";
    desc = desc.toLowerCase();
    if (desc.includes("completed a daily challenge")) return "Daily Challenge";
    if (desc.includes("daily") && (desc.includes("question") || desc.includes("problem")) && !desc.includes("completed") && !desc.includes("entire")) return "Daily Challenge";
    if (desc.includes("solve") || desc.includes("solved") || desc.includes("submission")) return "Daily Challenge";
    if (desc.includes("daily check-in mission") || desc.includes("check-in") || desc.includes("checkin") || desc.includes("sign in") || desc.includes("login")) return "Login";
    if (desc.includes("participated in") && desc.includes("contest")) return "Contest";
    if (desc.includes("participated in the contest:")) return "Contest";
    if (desc.includes("contest") && (desc.includes("participated") || desc.includes("rank"))) return "Contest";
    if (desc.includes("collected") && desc.includes("leetcoins from contest")) return "Contest";
    if (desc.includes("completed 25 challenges for")) return "Monthly Challenge";
    if (desc.includes("completed the entire") && desc.includes("challenge")) return "Monthly Challenge";
    if (desc.includes("monthly") && desc.includes("challenge")) return "Monthly Challenge";
    if (desc.includes("contribution") || desc.includes("contribute") || desc.includes("review") || desc.includes("edit")) return "Contribution";
    if (desc.includes("posted your first solution")) return "Contribution";
    if (desc.includes("survey") || desc.includes("feedback") || desc.includes("questionnaire") || desc.includes("satisfaction survey")) return "Survey";
    if (desc.includes("streak") && desc.includes("reward")) return "Others";
    if (desc.includes("profile field") || desc.includes("uploaded an avatar") || desc.includes("connected a social account")) return "Others";
    if (desc.includes("confirmed your email") || desc.includes("explore card") || desc.includes("time travel ticket")) return "Others";
    if (desc.includes("referral") || desc.includes("bonus")) return "Others";
    return "Others";
  }
  function normalizeRows(rawRows) {
    return rawRows.map(r => {
      const desc = (r.desc || "").trim();
      return {
        date: (r.date || "").trim(),
        desc,
        pts: Number(r.pts || r.points || 0),
        category: categorize(desc)
      };
    });
  }
  async function tryParseData() {
    console.log(`LeetPoints: Attempt ${retryCount + 1}/${MAX_RETRIES} - URL:`, window.location.href);
    console.log("LeetPoints: Page title:", document.title);
    console.log("LeetPoints: DOM ready state:", document.readyState);
    let parsed = [];
    let dataSource = "none";
    const apiData = await fetchPointsFromAPI();
    if (apiData && apiData.length > 0) {
      console.log("LeetPoints: Successfully fetched", apiData.length, "entries from API");
      parsed = apiData.map(item => {
        const description = item.description || item.desc || item.event || "";
        const pts = Number(item.score || item.pts || item.points || 0);
        const date = item.date || item.createdAt || item.created_at || "";
        return {
          date: date,
          desc: description,
          pts: pts,
          category: categorize(description)
        };
      });
      dataSource = "api";
      console.log("LeetPoints: Using API data");
    } else {
      console.log("LeetPoints: API fetch failed or returned no data, falling back to DOM scraping");
      const loadingIndicators = document.querySelectorAll('[class*="loading"], [class*="spinner"], .ant-spin');
      console.log("LeetPoints: Loading indicators found:", loadingIndicators.length);
      const tableParsed = parseTableRows();
      const genericParsed = parseGenericRows();
      console.log("LeetPoints: Table parsed:", tableParsed.length, "rows");
      console.log("LeetPoints: Generic parsed:", genericParsed.length, "rows");
      if (tableParsed.length) {
        parsed = normalizeRows(tableParsed);
        dataSource = "scrape-table";
        console.log("LeetPoints: Using table data");
      } else if (genericParsed.length) {
        parsed = normalizeRows(genericParsed);
        dataSource = "scrape-generic";
        console.log("LeetPoints: Using generic data");
      } else {
        if (retryCount < MAX_RETRIES && (document.readyState !== "complete" || loadingIndicators.length > 0)) {
          retryCount++;
          console.log(`LeetPoints: No data found, retrying in ${RETRY_DELAY}ms (attempt ${retryCount}/${MAX_RETRIES})`);
          setTimeout(tryParseData, RETRY_DELAY);
          return;
        }
        console.log("LeetPoints: No data found - page structure may have changed or API unavailable");
        dataSource = "failed";
      }
    }
    const totalData = await fetchTotalPointsFromAPI();
    chrome.storage.local.set({
      leetPoints: parsed,
      leetPoints_lastUpdated: new Date().toISOString(),
      leetPoints_source: dataSource,
      leetPoints_totalData: totalData
    }, () => {
      console.log(`LeetPoints content.js: saved ${parsed.length} rows (source: ${dataSource})`);
      if (parsed.length === 0) {
        console.warn("LeetPoints: No points data found. Try manually importing data using the extension popup.");
      }
    });
  }
  let hasTriedAfterMutation = false;
  const observer = new MutationObserver((mutations) => {
    let significantChange = false;
    mutations.forEach(mutation => {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        mutation.addedNodes.forEach(node => {
          if (node.nodeType === 1) {
            const hasTableContent = node.querySelector && (
              node.querySelector('table') || 
              node.querySelector('[class*="table"]') ||
              node.querySelector('.ant-table') ||
              node.textContent.includes('pts') ||
              node.textContent.includes('points')
            );
            if (hasTableContent) {
              significantChange = true;
            }
          }
        });
      }
    });
    if (significantChange && !hasTriedAfterMutation) {
      hasTriedAfterMutation = true;
      console.log("LeetPoints: Detected content change, retrying parse...");
      setTimeout(tryParseData, 500);
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true
  });
  setTimeout(() => observer.disconnect(), 30000);
  if (document.readyState === "complete") {
    tryParseData();
  } else {
    window.addEventListener("load", () => {
      setTimeout(tryParseData, 1000);
    });
  }
})();
