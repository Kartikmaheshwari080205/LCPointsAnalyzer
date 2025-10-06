#  LeetCode Points Analytics Extension

A beautiful Chrome extension that tracks, categorizes, and visualizes your LeetCode points with interactive charts and detailed analytics.

![Extension Preview](https://img.shields.io/badge/Chrome-Extension-green?logo=googlechrome)
![Version](https://img.shields.io/badge/Version-1.0.0-blue)
![License](https://img.shields.io/badge/License-MIT-yellow)

##  Features

###  **Smart Analytics**
- **Automatic Categorization**: Daily Challenges, Contests, Login Rewards, Monthly Challenges, Contributions, Surveys, and Others
- **Beautiful Visualizations**: Interactive pie charts with modern gradient design
- **Detailed Breakdown**: Points, percentages, and counts for each category
- **Real-time Updates**: Fetches latest data from LeetCode API automatically

###  **Modern Interface**
- Clean, professional design with gradient themes
- Responsive layout with smooth animations and hover effects
- Easy-to-read tables with categorized data
- Card-based statistics display with total points and entries

###  **Privacy Focused**
- All data stored locally in your browser using Chrome Storage API
- No external servers or data transmission
- Complete control over your data with export functionality
- No personal information collected beyond LeetCode points

##  Installation & Usage

### **Method 1: Load Unpacked (Developer Mode)**
1. Clone or download this repository
2. Open Chrome and go to `chrome://extensions/`
3. Enable "Developer mode" (toggle in top right)
4. Click "Load unpacked" and select the extension folder
5. Login to LeetCode in your browser
6. Click the extension icon to view your analytics

### **Method 2: Manual Installation**
1. Download the latest release ZIP file
2. Extract to a folder
3. Follow steps 2-6 from Method 1

##  Categories Explained

| Category | Description |
|----------|-------------|
| **Daily Challenge** | Daily coding problems and submissions |
| **Login** | Daily check-in rewards and login bonuses |
| **Contest** | Weekly/biweekly contest participation rewards |
| **Monthly Challenge** | Monthly challenge completion bonuses |
| **Contribution** | Code contributions, reviews, and community activities |
| **Survey** | Feedback surveys and questionnaires |
| **Spent/Penalty** | Time travel tickets, redemptions, penalties, and negative points |
| **Others** | Profile updates, streaks, referrals, and miscellaneous points |

##  Technical Details

### **Built With:**
- **Manifest V3** - Modern Chrome extension standards
- **Pure JavaScript** - No external dependencies
- **HTML5 Canvas** - Interactive chart rendering
- **Chrome APIs** - Storage, scripting, and background services

### **Permissions Required:**
- `storage` - Save your points data locally
- `scripting` - Run content scripts on LeetCode pages
- `leetcode.com` - Access your points data via API
- `cookies` - Maintain login session for authenticated requests
- `alarms` - Schedule periodic background updates

### **Architecture:**
```
├── manifest.json       # Extension configuration
├── background.js       # Service worker for API calls
├── content.js         # Content script for DOM interaction
├── popup.html         # Extension popup UI
├── popup.js           # Popup logic and chart rendering
└── PRIVACY_POLICY.md  # Privacy policy
```

##  Development

### **Setup:**
```bash
git clone https://github.com/Kartikmaheshwari080205/LCPointsAnalyzer.git
cd LCPointsAnalyzer
# Load unpacked extension in Chrome Developer mode
```

### **Features:**
- API-first approach with DOM scraping fallback
- Intelligent categorization with pattern matching
- Automatic retry mechanism for failed requests
- Background updates every 15 minutes
- Export/import functionality for data portability

##  Troubleshooting

**Extension not showing data?**
- Make sure you're logged into LeetCode
- Visit your LeetCode points page at least once
- Click the refresh button in the extension popup

**API requests failing?**
- The extension falls back to DOM scraping automatically
- Ensure you have an active LeetCode session
- Check browser console for detailed error messages

##  Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

##  Acknowledgments

- LeetCode for providing the platform and data
- Chrome Extensions team for excellent documentation
- Community feedback and feature suggestions

---

##  Support & Contact

- **GitHub Issues**: [Report bugs or request features](https://github.com/Kartikmaheshwari080205/LCPointsAnalyzer/issues)
- **Developer**: Kartik Maheshwari

---
