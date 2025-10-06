const CATEGORIES = ["Daily Challenge", "Login", "Contest", "Monthly Challenge", "Contribution", "Survey", "Spent/Penalty", "Others"];
const COLORS = ["#4caf50", "#2196f3", "#ff9800", "#9c27b0", "#f44336", "#607d8b", "#e91e63", "#795548"];
function categorize(desc, points) {
  if (!desc) return "Others";
  
  console.log(`Categorizing: "${desc}" with ${points} points`);
  
  desc = desc.toLowerCase();
  
  if (points < 0) {
    console.log(`  → SPENT/PENALTY (negative points): ${points}`);
    return "Spent/Penalty";
  }
  if (desc.includes("time travel ticket") || desc.includes("time travel") || desc.includes("travel ticket") || 
      desc.includes("redeem") || desc.includes("redeemed") || desc.includes("redemption") ||
      desc.includes("you have redeemed a time travel ticket")) {
    console.log(`  → SPENT/PENALTY (keywords): ${desc}`);
    return "Spent/Penalty";
  }
  if (desc.includes("spent") || desc.includes("penalty") || desc.includes("deducted") || desc.includes("used")) {
    console.log(`  → SPENT/PENALTY (spending words): ${desc}`);
    return "Spent/Penalty";
  }
  if (desc.includes("purchase") || desc.includes("bought") || desc.includes("cost") || desc.includes("pay")) {
    console.log(`  → SPENT/PENALTY (purchase words): ${desc}`);
    return "Spent/Penalty";
  }
  
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
function aggregate(points) {
  const totals = {};
  const counts = {};
  for (const cat of CATEGORIES) {
    totals[cat] = 0;
    counts[cat] = 0;
  }
  points.forEach((item, index) => {
    const desc = item.desc || item.description || "";
    const pts = Number(item.pts || item.points || item.score || 0);
    const cat = item.category || categorize(desc, pts);
    
    if (desc.toLowerCase().includes("travel") || desc.toLowerCase().includes("ticket") || pts < 0) {
      console.log(`DEBUG Point ${index}:`, {
        description: desc,
        points: pts,
        category: cat,
        originalCategory: item.category
      });
    }
    
    totals[cat] = (totals[cat] || 0) + pts;
    counts[cat] = (counts[cat] || 0) + 1;
  });
  
  console.log("Final category totals:", totals);
  console.log("Final category counts:", counts);
  
  return { totals, counts };
}
function drawPie(totals) {
  const canvas = document.getElementById("chart");
  const legendContainer = document.getElementById("legend");
  const entries = CATEGORIES.map(cat => [cat, totals[cat] || 0]).filter(([k, v]) => v > 0);
  const totalPositive = entries.reduce((sum, [k, v]) => sum + v, 0);
  if (totalPositive === 0) {
    canvas.width = 200;
    canvas.height = 200;
    const ctx = canvas.getContext("2d");
    ctx.clearRect(0, 0, 200, 200);
    ctx.fillStyle = "#ccc";
    ctx.font = "16px Arial";
    ctx.textAlign = "center";
    ctx.fillText("No data", 100, 100);
    legendContainer.innerHTML = "";
    return;
  }
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext("2d");
  const centerX = 100;
  const centerY = 100;
  const radius = 80;
  ctx.clearRect(0, 0, 200, 200);
  let currentAngle = -Math.PI / 2;
  const legendHTML = entries.map(([category, points], index) => {
    const sliceAngle = (points / totalPositive) * 2 * Math.PI;
    ctx.beginPath();
    ctx.moveTo(centerX, centerY);
    ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
    ctx.closePath();
    ctx.fillStyle = COLORS[index % COLORS.length];
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();
    currentAngle += sliceAngle;
    const percentage = ((points / totalPositive) * 100).toFixed(1);
    return `
      <div class="legend-item">
        <div class="legend-color" style="background-color: ${COLORS[index % COLORS.length]}"></div>
        <div class="legend-text">${category}: ${points} pts</div>
      </div>
    `;
  }).join("");
  legendContainer.innerHTML = legendHTML;
}
async function refreshDisplay() {
  const res = await chrome.storage.local.get(["leetPoints"]);
  let points = res.leetPoints || [];
  
  points = points.map(item => {
    const newItem = { ...item };
    delete newItem.category;
    return newItem;
  });
  if (!points || points.length === 0) {
    document.getElementById("totalPoints").textContent = "0";
    document.getElementById("totalEntries").textContent = "0";
    document.getElementById("tableWrap").innerHTML = '<p style="text-align: center; color: #666; margin: 20px 0;">No data available. Refresh to fetch from LeetCode.</p>';
    document.getElementById("legend").innerHTML = "";
    return;
  }
  const { totals, counts } = aggregate(points);
  const totalPoints = Object.values(totals).reduce((sum, val) => sum + val, 0);
  const totalPositivePoints = Object.values(totals).reduce((sum, val) => sum + (val > 0 ? val : 0), 0);
  const totalEntries = points.length;
  document.getElementById("totalPoints").textContent = totalPoints.toLocaleString();
  document.getElementById("totalEntries").textContent = totalEntries.toLocaleString();
  let tableHTML = '<table><thead><tr><th>Category</th><th>Points</th><th>%</th><th>Count</th></tr></thead><tbody>';
  let hasData = false;
  for (const cat of CATEGORIES) {
    const catPoints = totals[cat] || 0;
    const catCount = counts[cat] || 0;
    if (catPoints !== 0) {
      hasData = true;
      const percentage = ((catPoints / totalPositivePoints) * 100).toFixed(1);
      tableHTML += `
        <tr>
          <td class="category-cell">${cat}</td>
          <td class="points-cell">${catPoints.toLocaleString()}</td>
          <td class="percentage-cell">${percentage}%</td>
          <td class="count-cell">${catCount}</td>
        </tr>
      `;
    }
  }
  if (hasData) {
    tableHTML += `
      <tr style="border-top: 2px solid #667eea; font-weight: bold; background: linear-gradient(135deg, #f8f9ff 0%, #e3f2fd 100%);">
        <td class="category-cell">Total</td>
        <td class="points-cell">${totalPoints.toLocaleString()}</td>
        <td class="percentage-cell">100%</td>
        <td class="count-cell">${totalEntries}</td>
      </tr>
    `;
  } else {
    tableHTML += '<tr><td colspan="4" style="text-align: center; color: #666; padding: 20px;">No categorized data found</td></tr>';
  }
  tableHTML += '</tbody></table>';
  document.getElementById("tableWrap").innerHTML = tableHTML;
  drawPie(totals);
  document.getElementById("message").textContent = "";
}
document.addEventListener("DOMContentLoaded", () => {
  console.log("=== TESTING CATEGORIZATION ===");
  const testCase1 = categorize("You have redeemed a Time Travel Ticket", -70);
  const testCase2 = categorize("Completed a daily check-in mission", 1);
  console.log(`Test 1 - Time Travel Ticket: "${testCase1}" (should be "Spent/Penalty")`);
  console.log(`Test 2 - Daily Check-in: "${testCase2}" (should be "Login")`);
  console.log("=== END TESTING ===");
  
  refreshDisplay();
  document.getElementById("btnForceUpdate").addEventListener("click", async () => {
    document.getElementById("message").innerHTML = "🔄 Fetching latest data...";
    chrome.runtime.sendMessage({ type: "forceUpdate" }, (response) => {
      setTimeout(() => {
        refreshDisplay();
        document.getElementById("message").innerHTML = "✅ Data refreshed successfully!";
        setTimeout(() => {
          document.getElementById("message").textContent = "";
        }, 2000);
      }, 1000);
    });
  });
  document.getElementById("btnDebugClear").addEventListener("click", async () => {
    console.log("Clearing all cached data...");
    await chrome.storage.local.clear();
    document.getElementById("message").innerHTML = "🔧 Cache cleared! Click Refresh to fetch fresh data.";
    refreshDisplay();
    setTimeout(() => document.getElementById("message").textContent = "", 3000);
  });
  
  document.getElementById("btnExport").addEventListener("click", async () => {
    const { leetPoints } = await chrome.storage.local.get("leetPoints");
    const data = leetPoints || [];
    if (data.length === 0) {
      document.getElementById("message").innerHTML = "⚠️ No data to export";
      setTimeout(() => document.getElementById("message").textContent = "", 2000);
      return;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `leetcode-points-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    document.getElementById("message").innerHTML = `📊 Exported ${data.length} entries`;
    setTimeout(() => document.getElementById("message").textContent = "", 2000);
  });
});
