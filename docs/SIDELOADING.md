# Putting Wisp on an iPhone for free (sideloading)

How to install Wisp on a real iPhone **without paying the $99/year Apple
Developer fee**, using **SideStore** and a free Apple Account.

This is install/ops tooling — **there is nothing to implement inside the app**.
SideStore re-signs the build on the device itself.

```
[ GitHub Actions: build unsigned .ipa ]  ->  [ Linux + iLoader: install SideStore ]  ->  [ SideStore: install Wisp, auto-refresh ]
        (this repo, free, no Mac)                   (one-time, ~30–45 min)                    (wireless, every <7 days)
```

> Sideloading tooling moves fast. These steps were checked against the
> [SideStore docs](https://docs.sidestore.io/) in July 2026 — re-verify before a
> fresh setup.

---

## Step A — Build the unsigned `.ipa` (GitHub Actions, free, no Mac)

The workflow is [`.github/workflows/ios-unsigned-ipa.yml`](../.github/workflows/ios-unsigned-ipa.yml).
It runs on a GitHub-hosted **macOS** runner, so no Mac is needed locally.

1. GitHub → **Actions** → **"iOS unsigned IPA (sideload)"** → **Run workflow**.
   (It is `workflow_dispatch` — manual only, never on push.)
2. Wait ~15–30 min, open the finished run → **Artifacts** → download
   `wisp-unsigned-ipa` → unzip → **`Wisp-unsigned.ipa`**.

What it does: selects a stable Xcode → `npm ci` → `expo prebuild -p ios`
(the app is managed; `ios/` is gitignored) → `pod install` → `xcodebuild build`
in Release with **signing disabled** (`CODE_SIGNING_ALLOWED=NO`) → zips the
resulting `.app` into `Payload/` (an `.ipa` is just that zip).

> The IPA is **unsigned on purpose** — SideStore signs it on the device. Don't
> try to install it directly with Finder or Apple Configurator.

**CI minutes:** macOS runners bill at 10×. One build (~20 min) fits comfortably
in the free monthly allowance. Run it only when the app actually changes.

---

## Step B — One-time SideStore setup

Done from a computer once; after this the phone refreshes itself over Wi-Fi.
**iLoader** is the current desktop tool (it replaced the old AltServer dance),
it has a Linux build, and it both generates the pairing file and installs
SideStore.

**On the computer (Linux/Windows/macOS):**

1. Install `usbmuxd` — `sudo apt install usbmuxd` on Debian/Ubuntu/Pop!\_OS
   (often already present).
2. Download **iLoader** (DEB / AppImage) from <https://iloader.site/>.
3. Plug the iPhone in over **USB**; on the phone tap **Trust** and enter the
   passcode.
4. Open iLoader → **sign in with an Apple Account**. With two-factor on, it asks
   for the **6-digit code** shown on your own trusted device — there is no
   app-specific password step.
5. Select the device → generate the **pairing file** → **Install SideStore
   (Stable)**.

> **Whose Apple Account?** It does **not** have to be the one signed into that
> iPhone — the SideStore docs say so explicitly, and using your own on someone
> else's phone is a supported, ordinary setup. See
> [Which account to use](#which-apple-account-to-use) below before you decide.

**On the iPhone:**

6. **Settings → Privacy & Security → Developer Mode → on.** The phone restarts
   and asks you to confirm. **Required on iOS 16 and later**, and the toggle
   only appears once a development tool has talked to the device — i.e. after
   step 5, not before.
7. Install **LocalDevVPN** (from the App Store) and **connect** it; approve the
   VPN profile when iOS asks. This is what lets SideStore refresh itself
   **wirelessly**, with no computer, from now on.
8. **Settings → General → VPN & Device Management** → find the developer entry
   under the Apple Account name → **Trust**.
9. Open **SideStore**, import the pairing file if prompted, and confirm the
   Apple Account.

---

## Step C — Install Wisp, and how refresh works

1. Get `Wisp-unsigned.ipa` onto the phone — USB transfer, a cloud link, or
   email it and open it from Files. (AirDrop isn't an option from Linux.)
2. In **SideStore** → **+** / **My Apps** → pick the `.ipa`. It signs and
   installs it. Wisp now opens like any normal app.
3. **Refresh:** the free certificate lasts **7 days**, and SideStore renews it in
   the background over the VPN — no computer, ever again. If a refresh does lapse
   (phone off for a week, VPN disconnected), Wisp simply stops launching until
   it is refreshed. **No data is lost** — everything is stored on the device —
   and opening SideStore on Wi-Fi and tapping **Refresh** fixes it.

**Travelling:** open SideStore and hit **Refresh** right before a trip. Even if
it lapses mid-trip, nothing is lost; any Wi-Fi will do.

**Free-account limits:** **3 sideloaded apps per device** (SideStore is one of
them, so Wisp is the second), **10 app-IDs per 7 days** per account, and the
**7-day** certificate above.

---

## Which Apple Account to use

Any free Apple Account works, including your own. What matters is where the
credentials end up.

The sign-in in **step 4 happens on your computer**, not on the phone. But
SideStore also holds the account **on the device**, because that is what it uses
to re-sign every 7 days. So if you set up someone else's phone with your
account, your credential lives on their phone.

That is usually fine, and worth knowing precisely:

- Signing into SideStore is **not** signing the phone into your iCloud. No
  photos, messages, contacts or purchases. It can only mint development signing
  certificates.
- **Two-factor still protects you.** The stored credential cannot be used to log
  in anywhere new without a code on your trusted device.
- **Try an app-specific password** in SideStore's own sign-in (generate one at
  [appleid.apple.com](https://appleid.apple.com) → Sign-In and Security).
  SideStore is an AltStore fork and AltStore accepts them; the docs don't confirm
  it, so fall back to the real password if it is rejected. The win is that it is
  **independently revocable** and your real password never leaves your machine.
- **To cut access at any time:** revoke that app-specific password (or change
  your Apple Account password). SideStore can no longer re-sign; the app's data
  on the phone is untouched.

A dedicated throwaway account is the tidiest option, but Apple wants a phone
number for a new one, and reusing yours to dodge that is more friction than the
tidiness is worth.

---

## Troubleshooting

- **The build failed — find out _which_ step.** Open the failed run and look for
  the red step; its name is the stage (prebuild / pods / build / package). Every
  shell step runs with `set -x`, and on failure the workflow uploads an
  **`xcodebuild-log`** artifact with the full compiler output. Read its last ~30
  lines — that is the real error. (`exit code 66` from `xcodebuild` usually means
  it couldn't find the scheme or workspace; the build step prints `xcodebuild
-list` so you can see the real names.)
- **`xcodebuild` fails on an Xcode/SDK mismatch** — the workflow pins
  `latest-stable`; if Apple ships a breaking Xcode, pin a known-good version in
  `setup-xcode` (e.g. `xcode-version: '16.2'`).
- **`pod install` can't resolve a pod** — re-run; if it persists, change the step
  to `pod install --repo-update` (slower, refreshes the CocoaPods index).
- **iLoader can't see the device on Linux** — check `usbmuxd` is running, that the
  phone showed the **Trust** prompt, and try another cable or port.
- **Developer Mode isn't in Settings** — it only appears after a development tool
  has connected. Do step 5 first.
- **SideStore says "maximum number of apps"** — free accounts allow 3 per device.
  Remove an unused sideloaded app. If that isn't it, you hit the 10-app-IDs-per-7-
  days quota; wait out the week.
- **The app stopped opening** — the certificate expired. Open SideStore → Refresh.

---

## The paid path (open, not taken yet)

Paying the **$99/year Apple Developer** fee removes all of the above — no
SideStore, no VPN, no weekly refresh, no IPA juggling:

- `eas build -p ios --profile preview`, then **TestFlight**.
- Builds last **90 days** per upload, the certificate a full year, and testers
  install from the TestFlight app. Up to 100 internal testers.

Tracked as release prep. Left open on purpose.
