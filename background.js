async function fetchLeetCodePoints() {
  try {
    console.log("LeetPoints Background: Fetching points from API...");
    const response = await fetch("https://leetcode.com/points/api/", {
      credentials: "include",
      headers: {
        'Accept': 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
      }
    });
    if (!response.ok) throw new Error(`API request failed: ${response.status}`);
    const data = await response.json();
    console.log("LeetPoints Background: API response:", data);
    let pointsArray = [];
    if (data.scores && Array.isArray(data.scores)) {
      pointsArray = data.scores;
    } else if (data.points && Array.isArray(data.points)) {
      pointsArray = data.points;
    } else if (Array.isArray(data)) {
      pointsArray = data;
    }
    if (pointsArray.length === 0) {
      console.warn("LeetPoints Background: No points data in API response");
      return;
    }
    const normalized = pointsArray.map(item => {
        const description = item.description || item.desc || item.event || "";
        const pts = Number(item.score || item.pts || item.points || 0);
        const date = item.date || item.createdAt || item.created_at || "";
        return {
          date: date,
          desc: description,
          pts: pts,
          category: categorize(description, pts)
        };
      });    
    const totalPoints = normalized.reduce((sum, item) => sum + item.pts, 0);
    await chrome.storage.local.set({
      leetPoints: normalized,
      leetPoints_lastUpdated: new Date().toISOString(),
      leetPoints_source: "background-api",
      totalPoints: totalPoints
    });
    chrome.action.setBadgeText({ text: String(totalPoints) });
    console.log("LeetPoints Background: Stored", normalized.length, "points, total:", totalPoints);
  } catch (err) {
    console.error("LeetPoints Background: Fetch failed:", err);
  }
}
function categorize(desc, points) {
  if (!desc) return "Others";
  desc = desc.toLowerCase();
  
  if (points < 0) return "Spent/Penalty";
  if (desc.includes("time travel ticket") || desc.includes("time travel") || desc.includes("travel ticket") || 
      desc.includes("redeem") || desc.includes("redeemed") || desc.includes("redemption") ||
      desc.includes("you have redeemed a time travel ticket")) return "Spent/Penalty";
  if (desc.includes("spent") || desc.includes("penalty") || desc.includes("deducted") || desc.includes("used")) return "Spent/Penalty";
  if (desc.includes("purchase") || desc.includes("bought") || desc.includes("cost") || desc.includes("pay")) return "Spent/Penalty";
  
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
  if (desc.includes("confirmed your email") || desc.includes("explore card")) return "Others";
  if (desc.includes("referral") || desc.includes("bonus")) return "Others";
  
  return "Others";
}
function categorizePoints(scores) {
  const categories = {
    login: 0,
    daily: 0,
    streak: 0,
    challenge: 0,
    contests: 0,
    others: 0
  };
  for (const s of scores) {
    const desc = (s.description || s.desc || "").toLowerCase();
    if (desc.includes("check-in")) categories.daily += (s.score || s.pts || 0);
    else if (desc.includes("streak")) categories.streak += (s.score || s.pts || 0);
    else if (desc.includes("challenge")) categories.challenge += (s.score || s.pts || 0);
    else if (desc.includes("contest")) categories.contests += (s.score || s.pts || 0);
    else if (desc.includes("login")) categories.login += (s.score || s.pts || 0);
    else categories.others += (s.score || s.pts || 0);
  }
  return categories;
}
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg && msg.type === "forceUpdate") {
    console.log("LeetPoints Background: Force update requested");
    fetchLeetCodePoints().then(() => {
      sendResponse({ ok: true });
    }).catch((error) => {
      console.error("LeetPoints Background: Force update failed:", error);
      sendResponse({ ok: false, error: error.message });
    });
    return true;
  }
});
chrome.runtime.onStartup.addListener(fetchLeetCodePoints);
chrome.runtime.onInstalled.addListener(fetchLeetCodePoints);
chrome.alarms.create("updatePoints", { periodInMinutes: 15 });
chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === "updatePoints") {
    fetchLeetCodePoints();
  }
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (tab && tab.url && tab.url.includes("leetcode.com") && changeInfo.status === "complete") {
    fetchLeetCodePoints();
  }
});
