# 🚀 Shop Platform - Public Server Hosting & Mobile App Guide
## പബ്ലിക് സർവർ ഹോസ്റ്റിംഗും മൊബൈൽ ആപ്പ് കണക്റ്റിവിറ്റിയും

ഈ ഗൈഡിൽ ഷോപ്പ് പ്ലാറ്റ്‌ഫോം (Web & API Backend) ഒരു പബ്ലിക് സർവറിൽ എങ്ങനെ ഹോസ്റ്റ് ചെയ്യാമെന്നും, ആൻഡ്രോയിഡ് - ഐഫോൺ ആപ്പുകളെ ആ പബ്ലിക് സർവറിലേക്ക് എങ്ങനെ കണക്ട് ചെയ്യാമെന്നും വിശദീകരിക്കുന്നു.

---

## ⚡ വേഗത്തിലുള്ള 3 വഴികൾ (Overview of Deployment Options)

| ഓപ്ഷൻ | തരം | ചെലവ് | സവിശേഷതകൾ |
| :--- | :--- | :--- | :--- |
| **Quick Test (Cloudflare Tunnel)** | Instant Live HTTPS | സൗജന്യം | അക്കൗണ്ടോ ഹോസ്റ്റിംഗോ ഇല്ലാതെ ഇപ്പോൾ തന്നെ യഥാർത്ഥ ഫോണിൽ ടെസ്റ്റ് ചെയ്യാം |
| **Option 1 (Render.com)** | Free Cloud Web Service | സൗജന്യം | Git Push ചെയ്താൽ ഓട്ടോമാറ്റിക് ഡിപ്ലോയ്, സൗജന്യ SSL (`https://`) |
| **Option 2 (Docker / Linux VPS)** | Dedicated VPS (Ubuntu) | ₹300-₹500/mo | സമ്പൂർണ്ണ നിയന്ത്രണം, DigitalOcean, AWS, Hetzner |

---

## 🎯 1. Instant Free HTTPS Testing (ഇപ്പോൾ തന്നെ ഫോണിൽ ടെസ്റ്റ് ചെയ്യാൻ)

നിങ്ങളുടെ കമ്പ്യൂട്ടറിൽ റൺ ചെയ്യുന്ന സെർവറിനെ ക്ലൗഡ്ഫെയർ വഴി സുരക്ഷിതമായ ഒരു ലൈവ് പബ്ലിക് HTTPS ലിങ്ക് ആക്കി മാറ്റാം:

1. ടെർമിനലിൽ ഈ കമാൻഡ് റൺ ചെയ്യുക:
   ```bash
   npx cloudflared tunnel --url http://localhost:3001
   ```
2. ടെർമിനലിൽ ഇതുപോലെ ഒരു പബ്ലിക് ലിങ്ക് ലഭിക്കും:
   ```
   https://random-subdomain.trycloudflare.com
   ```
3. ഇപ്പോൾ ഈ ലിങ്ക് ലോകത്തെവിടെയുമുള്ള ഏത് മൊബൈൽ ഫോണിൽ നിന്നും ഇന്റർനെറ്റിലൂടെ ആക്‌സസ് ചെയ്യാം!

---

## ☁️ 2. Option 1: Render.com സൗജന്യ ക്ലൗഡ് ഹോസ്റ്റിംഗ് (Recommended)

Render.com-ൽ നിങ്ങൾക്ക് ക്രെഡിറ്റ് കാർഡ് ഇല്ലാതെ തന്നെ ലൈവ് വെബ്‌സൈറ്റും ബാക്കെൻഡും സൗജന്യമായി ഹോസ്റ്റ് ചെയ്യാം:

### ഘട്ടം 1: കോഡ് GitHub-ലേക്ക് അപ്‌ലോഡ് ചെയ്യുക
```bash
cd /Users/nikhilkilivayil/.gemini/antigravity/scratch/shop_platform
git init
git add .
git commit -m "Deploy Shop Platform"
git branch -M main
git remote add origin https://github.com/<your-username>/shop-platform.git
git push -u origin main
```

### ഘട്ടം 2: Render.com-ൽ Web Service തുടങ്ങുക
1. [Render Dashboard](https://dashboard.render.com) സന്ദർശിച്ച് സൈൻ ഇൻ ചെയ്യുക.
2. **New +** ക്ലിക്ക് ചെയ്ത് **Web Service** തിരഞ്ഞെടുക്കുക.
3. നിങ്ങളുടെ GitHub റിപ്പോസിറ്ററി സെലക്ട് ചെയ്യുക.
4. താഴെ പറയുന്ന വിവരങ്ങൾ നൽകുക:
   - **Name**: `my-shop-platform`
   - **Runtime**: `Node`
   - **Build Command**: `echo 'Ready'`
   - **Start Command**: `node server.js`
   - **Instance Type**: `Free`
5. **Environment Variables** ചേർക്കുക:
   - `NODE_VERSION` = `22.0.0`
   - `PORT` = `10000`
   - `HOST` = `0.0.0.0`
6. **Create Web Service** ക്ലിക്ക് ചെയ്യുക.
7. ഏതാനും സെക്കൻഡുകൾക്കുള്ളിൽ നിങ്ങളുടെ ലൈവ് ലിങ്ക് തയ്യാറാകും (ഉദാ: `https://my-shop-platform.onrender.com`).

---

## 🐳 3. Option 2: Linux VPS / Docker വഴി ഹോസ്റ്റ് ചെയ്യാൻ (Self-Hosted)

നിങ്ങൾക്ക് സ്വന്തമായി ഒരു Ubuntu VPS (DigitalOcean / AWS EC2 / Hetzner) ഉണ്ടെങ്കിൽ:

1. സെർവറിലേക്ക് കോഡ് കോപ്പി ചെയ്യുക:
   ```bash
   rsync -avz --exclude 'node_modules' --exclude '.git' . user@your-server-ip:/opt/shop_platform
   ```
2. സെർവറിൽ Docker Compose റൺ ചെയ്യുക:
   ```bash
   cd /opt/shop_platform
   docker compose up -d --build
   ```
3. Nginx റിവേഴ്സ് പ്രോക്സിയും സൗജന്യ Let's Encrypt SSL-ഉം നൽകുക:
   ```nginx
   server {
       server_name shop.yourdomain.com;

       location / {
           proxy_pass http://127.0.0.1:3000;
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
       }
   }
   ```
4. SSL ഇൻസ്റ്റാൾ ചെയ്യുക:
   ```bash
   certbot --nginx -d shop.yourdomain.com
   ```

---

## 📱 4. മൊബൈൽ ആപ്പുകൾ പബ്ലിക് സർവറുമായി കണക്ട് ചെയ്യുന്ന വിധം

നിങ്ങളുടെ പബ്ലിക് സർവർ ലിങ്ക് ലഭിച്ചുകഴിഞ്ഞാൽ (ഉദാ: `https://my-shop-platform.onrender.com` അല്ലെങ്കിൽ Cloudflare Tunnel URL):

### 🍎 iOS (iPhone App):
1. iPhone-ലോ Simulator-ലോ ആപ്പ് തുറക്കുക.
2. താഴെയുള്ള ടാബ് ബാറിൽ നിന്ന് **Profile** (പ്രൊഫൈൽ) ടാബിലേക്ക് പോകുക.
3. **⚙️ API Endpoint URL** എന്ന കാർഡിൽ നിങ്ങളുടെ പബ്ലിക് സെർവർ അഡ്രസ്സ് നൽകുക:
   ```
   https://my-shop-platform.onrender.com/api
   ```
4. **Save Server URL** ബട്ടൺ അമർത്തുക.
5. ആപ്പ് ഉടൻ തന്നെ ലൈവ് പബ്ലിക് സർവറുമായി കണക്ട് ആകുകയും, ഉൽപ്പന്നങ്ങളും ഓർഡറുകളും ലോഡ് ചെയ്യുകയും ചെയ്യും.

> [!TIP]
> വീണ്ടും ലോക്കൽ സർവറിലേക്ക് മാറണമെങ്കിൽ **Default** ബട്ടൺ അമർത്തിയാൽ മതി.

---

### 🤖 Android App:
1. Android ഫോണിലോ എമുലേറ്ററിലോ ആപ്പ് തുറക്കുക.
2. താഴെയുള്ള ടാബ് ബാറിൽ നിന്ന് **Profile** (പ്രൊഫൈൽ) സ്ക്രീനിലേക്ക് പോകുക.
3. **⚙️ API Endpoint URL** എന്ന ബോക്സിൽ നിങ്ങളുടെ പബ്ലിക് സർവർ ലിങ്ക് നൽകുക:
   ```
   https://my-shop-platform.onrender.com/api
   ```
4. മാറ്റങ്ങൾ ഓട്ടോമാറ്റിക്കായി സേവ് ആകും. ഹോം സ്ക്രീനിലേക്ക് പോയാൽ ലൈവ് ഉൽപ്പന്നങ്ങൾ കാണാം!

---

## 🔒 5. Persistent Database (SQLite Data Safety)
- കണ്ടെയ്‌നറുകളിലും ക്ലൗഡിലും നിങ്ങളുടെ ഡാറ്റാബേസ് സുരക്ഷിതമായിരിക്കാൻ `DATABASE_PATH` എൻവയോൺമെന്റ് വേരിയബിൾ സപ്പോർട്ട് ചെയ്തിട്ടുണ്ട്.
- Docker-ൽ `shop_data` എന്ന വോളിയം `/data/shop.db`-ലേക്ക് മൗണ്ട് ചെയ്തിരിക്കുന്നതിനാൽ സെർവർ റീസ്റ്റാർട്ട് ചെയ്താലും പ്രോഡക്റ്റുകളും ഓർഡറുകളും നഷ്‌ടപ്പെടില്ല.
