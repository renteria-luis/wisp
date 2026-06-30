# Putting Wisp on an iPhone for free (sideloading)

This is the **open plan** for installing Wisp on a real iPhone (Tiffani's iPhone 13)
**without paying the $99/year Apple Developer fee**, using **SideStore** + a
free Apple ID. Everything here is install/ops tooling — **there is nothing to
implement inside the Wisp app**; SideStore re-signs the build on the device.

There are two paths. We're doing the **free** one for now; the **paid** one is
documented at the bottom and stays open for later.

```
[ GitHub Actions: build unsigned .ipa ]  ->  [ Linux + iLoader: install SideStore ]  ->  [ SideStore: install Wisp, auto-refresh ]
        (this repo, free, no Mac)                  (one-time, ~30–45 min)                    (wireless, every <7 days)
```

---

## TL;DR

1. **Build the IPA** — GitHub → **Actions** → **"iOS unsigned IPA (sideload)"** →
   **Run workflow**. Download the `wisp-unsigned-ipa` artifact, unzip → `Wisp-unsigned.ipa`.
2. **One-time setup** — on Luis's Linux PC install `usbmuxd` + **iLoader**, plug in
   the iPhone, generate a pairing file, sign in with a **free Apple ID**, install
   **SideStore**, then install/connect **LocalDevVPN** on the phone.
3. **Install Wisp** — open `Wisp-unsigned.ipa` in SideStore. It signs + installs it,
   and **auto-refreshes** the 7-day certificate wirelessly from then on.

Free Apple ID limits: **3 apps max** (SideStore counts as 1 → Wisp is the 2nd),
**10 app-IDs / 7 days**, **7-day** certificate (SideStore renews it for you).

---

## Step A — Build the unsigned `.ipa` (GitHub Actions, free, no Mac)

The workflow lives at [`.github/workflows/ios-unsigned-ipa.yml`](../.github/workflows/ios-unsigned-ipa.yml).
It runs on a GitHub-hosted **macOS** runner, so **no Mac is needed** locally.

**What it does, step by step:**
1. Checks out the repo and selects the latest stable **Xcode** (RN 0.81 needs Xcode 16+).
2. `npm ci` to install JS deps (Node 22, same as CI).
3. `npx expo prebuild --platform ios --no-install` — generates the native `ios/`
   project (Wisp is a *managed* Expo app; `/ios` is gitignored).
4. `pod install` (CocoaPods).
5. `xcodebuild ... build` in **Release** with **signing disabled**
   (`CODE_SIGNING_ALLOWED=NO`, etc.) → produces a bare `Wisp.app`. We use plain
   `build` (not `archive`) precisely because archive/export would demand signing.
6. Packages the `.app` into `Payload/` and zips it → `Wisp-unsigned.ipa`
   (an `.ipa` is just that zip).
7. Uploads it as the **`wisp-unsigned-ipa`** artifact (kept 30 days).

**To run it:**
- Push this repo to GitHub (private is fine).
- GitHub → **Actions** tab → pick **"iOS unsigned IPA (sideload)"** →
  **Run workflow** (it's `workflow_dispatch`, manual only, so it never runs on push).
- Wait ~15–30 min. Open the finished run → **Artifacts** → download
  `wisp-unsigned-ipa` → unzip → you get **`Wisp-unsigned.ipa`**.

> The IPA is **unsigned on purpose** — SideStore signs it with the free Apple ID
> when you install it. Don't try to install it directly via Finder/Apple Configurator.

**Free CI minutes note:** macOS runners cost 10× minutes. Public repos get free
minutes; private repos get a monthly free allowance (~2,000 min ÷ 10 ≈ ~200 macOS
min). One build (~20 min) is well within that. Run it only when you change the app.

---

## Step B — One-time SideStore setup (Linux, ~30–45 min)

The modern desktop tool is **iLoader** (it replaced the old AltServer/Jitterbug
dance) and it has a **Linux** build, works with a **free Apple ID**, and both
generates the pairing file and installs SideStore.

**On Luis's Linux PC:**
1. Install `usbmuxd`: `sudo apt install usbmuxd` (Pop!_OS/Ubuntu/Debian; often
   already present).
2. Download **iLoader** for Linux (DEB or AppImage) from <https://iloader.site/>
   (or its GitHub releases).
3. Plug Tiffani's iPhone 13 in via **USB**; on the phone tap **Trust** + passcode.
4. In iLoader: select the device → **Generate** the **pairing file** → sign in
   with a **free Apple ID** (a dedicated throwaway Apple ID is recommended so it
   isn't tied to her main account) → **Install SideStore (Stable)**.
   - *Pairing-file alternative:* the official `iDevicePair-*.AppImage` from the
     iDevice Pair GitHub can generate just the pairing file if iLoader's path fails.

**On the iPhone:**
5. Open **SideStore**; import the pairing file if asked; confirm the Apple ID.
6. Install the VPN helper **LocalDevVPN** (a.k.a. StosVPN) and **connect** it
   (approve the VPN profile in iOS Settings). This is what enables **untethered**
   wireless refresh — no computer needed afterwards.
7. iOS **Settings → General → VPN & Device Management** → **trust** the developer
   (the free Apple ID).

---

## Step C — Install Wisp + how refresh works

1. Get `Wisp-unsigned.ipa` onto the phone (AirDrop from a Mac isn't an option on
   Linux — use a **USB transfer**, a cloud link, or email it to her and open in Files).
2. In **SideStore** → **+** / **My Apps** → pick the `.ipa` → it **signs and
   installs** Wisp with the free Apple ID. Wisp now opens like any normal app.
3. **Refresh:** SideStore re-signs the 7-day certificate **in the background over
   the VPN**, so it keeps working without a computer. If a refresh ever lapses
   (phone off > 7 days, VPN disconnected, etc.), Wisp just **stops launching** until
   refreshed — **your data is safe** (everything is stored on-device) and she only
   needs to open SideStore on Wi-Fi and tap **Refresh** (still no computer).

**Travel:** Tiffani travels rarely (~once every couple of months). Best practice:
open SideStore and **Refresh right before a trip**. Even if it lapses mid-trip,
nothing is lost — reopen SideStore on any Wi-Fi to refresh.

---

## Troubleshooting

- **Workflow fails at `xcodebuild`** — usually an Xcode/SDK mismatch. The workflow
  already pins `latest-stable`; if Apple ships a breaking Xcode, pin a known-good
  version in `setup-xcode` (e.g. `xcode-version: '16.2'`).
- **`pod install` can't resolve a pod** — re-run; if it persists, change the step
  to `pod install --repo-update` (slower but refreshes the CocoaPods index).
- **Prebuild complains about a missing icon/asset** — harmless warnings are fine;
  a hard failure means an asset path in `app.config.ts` is wrong.
- **SideStore "Maximum number of apps" / can't install** — free Apple IDs allow
  **3 apps total**. Remove an unused sideloaded app, or the **10 app-IDs per 7
  days** quota was hit (wait out the week).
- **App won't open after a while** — the cert expired; open SideStore → Refresh.
- **iLoader can't see the device on Linux** — make sure `usbmuxd` is running and
  the phone shows **Trust** when plugged in; try a different USB cable/port.

---

## The paid path (OPEN — not doing this now)

When/if Luis pays the **$99/year Apple Developer** fee, this all gets much simpler
and SideStore is no longer needed:

- `eas build -p ios --profile preview` (internal distribution) **or** TestFlight.
- **TestFlight** is the cleanest: she installs from the TestFlight app, the build
  lasts **90 days** per upload (and the cert is a full year), **no weekly refresh,
  no VPN, no IPA juggling**. Up to 100 internal testers.
- This is tracked as Phase 8 release prep. Left open intentionally.

---

## Sources

- SideStore docs (prerequisites / install / pairing file / FAQ): <https://docs.sidestore.io/>
- iLoader: <https://iloader.site/>
- Building unsigned `.ipa`: the standard `CODE_SIGNING_ALLOWED=NO` + `Payload/` zip approach.

*(Sideloading tooling changes fast — re-verify the iLoader/SideStore/LocalDevVPN
steps against their current docs before a fresh setup.)*
