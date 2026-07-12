import { type Href, usePathname, useRouter } from 'expo-router';
import { Gift } from 'phosphor-react-native';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  BackHandler,
  Keyboard,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Rect as SvgRect } from 'react-native-svg';

import { Button } from '@/components/ui/Button';
import { useSettings } from '@/store/useSettings';
import { useTutorial } from '@/store/useTutorial';
import { useTutorialSandbox } from '@/store/useTutorialSandbox';
import { useThemeColors } from '@/theme/useThemeColors';

import {
  MODAL_ROUTE,
  stepPath,
  TOUR_PATHS,
  TUTORIAL_STEP_COUNT,
  TUTORIAL_STEPS,
} from './steps';

const DIM = '#000000';
const DIM_OPACITY = 0.66;
const TUTORIAL_COINS = 20;
// Give up on any "wait for the screen to arrive" loop after this and carry on:
// a slow device should look sluggish, never stuck.
const SETTLE_TIMEOUT = 1500;
const wait = (ms: number): Promise<void> =>
  new Promise((r) => setTimeout(r, ms));

/** Renders a body string with **bold** spans as nested Text. */
function renderBody(body: string): React.ReactNode[] {
  return body.split(/\*\*(.+?)\*\*/g).map((part, i) =>
    i % 2 === 1 ? (
      <Text key={i} className="font-bold text-ink dark:text-neutral-50">
        {part}
      </Text>
    ) : (
      <Text key={i}>{part}</Text>
    ),
  );
}

/** Rounded-rect subpath (the spotlight hole cut out of the dim layer). */
function roundedRectPath(
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): string {
  return (
    `M${x + r} ${y} H${x + w - r} A${r} ${r} 0 0 1 ${x + w} ${y + r} ` +
    `V${y + h - r} A${r} ${r} 0 0 1 ${x + w - r} ${y + h} ` +
    `H${x + r} A${r} ${r} 0 0 1 ${x} ${y + h - r} ` +
    `V${y + r} A${r} ${r} 0 0 1 ${x + r} ${y} Z`
  );
}

/**
 * The guided-tour spotlight. One dim layer with a single rounded hole cut around
 * the current step's control (SVG even-odd path — no seams / mismatched ring).
 * Forced-tap steps leave the hole open so the user taps the real control; info
 * steps block everything and advance with "Next". Back/Skip are always there.
 * The whole tour runs on a throwaway sandbox, so nothing here touches real data.
 * One instance sits at the root; the Log modal mounts its own (`scope="log"`).
 */
export function TutorialOverlay({
  scope = 'root',
}: {
  scope?: 'root' | 'modal';
}) {
  const active = useTutorial((s) => s.active);
  const stepIndex = useTutorial((s) => s.stepIndex);
  const pendingAction = useTutorial((s) => s.pendingAction);
  const next = useTutorial((s) => s.next);
  const back = useTutorial((s) => s.back);
  const clearAction = useTutorial((s) => s.clearAction);
  const transitioning = useTutorial((s) => s.transitioning);
  const openModal = useTutorial((s) => s.openModal);
  const rect = useTutorial((s) => {
    const st = TUTORIAL_STEPS[s.stepIndex];
    return st?.target ? s.rects[st.target] : undefined;
  });
  const rect2 = useTutorial((s) => {
    const st = TUTORIAL_STEPS[s.stepIndex];
    return st?.alsoLit ? s.rects[st.alsoLit] : undefined;
  });
  const goTo = useTutorial((s) => s.goTo);
  const router = useRouter();
  const { t } = useTranslation();
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const c = useThemeColors();
  const currency = useSettings((s) => s.pricing.currency);

  // Lift a bottom tooltip above the keyboard while the user types (wish step).
  const [kb, setKb] = useState(0);
  useEffect(() => {
    const subs = [
      Keyboard.addListener('keyboardWillShow', (e) =>
        setKb(e.endCoordinates.height),
      ),
      Keyboard.addListener('keyboardDidShow', (e) =>
        setKb(e.endCoordinates.height),
      ),
      Keyboard.addListener('keyboardWillHide', () => setKb(0)),
      Keyboard.addListener('keyboardDidHide', () => setKb(0)),
    ];
    return () => subs.forEach((s) => s.remove());
  }, []);

  // The live route. Everything below steers by this rather than by what the tour
  // *believes* it did: a cached "I already navigated there" is a lie the moment
  // anything else touches the router, and it used to strand whole steps.
  const pathname = usePathname();
  const pathRef = useRef(pathname);
  pathRef.current = pathname;

  // Only the newest run of the controller may act; an older one aborts at its
  // next checkpoint (the user tapped Back, or drifted, while it was working).
  const runToken = useRef(0);
  // The step whose screen is fully in place. Until then the route is *meant* to
  // be moving, so the watchdog below must not mistake it for drift.
  const settledAt = useRef(-1);
  // A repair that keeps failing must not turn into an endless navigate loop.
  const repairs = useRef(0);

  /**
   * Bring the app to exactly where a step lives — the right tab, the right
   * modal, scrolled to the right card — and only then reveal the spotlight.
   * Written as a reconciler, not a script: it compares the desired screen with
   * the real one and does whatever closes the gap, so it is safe to run at any
   * time, from any state, however the user got there.
   */
  const drive = useCallback(
    (idx: number): void => {
      const step = TUTORIAL_STEPS[idx];
      if (!step) return;
      const my = ++runToken.current;
      const T = useTutorial.getState;
      const dead = (): boolean =>
        runToken.current !== my || !T().active || T().stepIndex !== idx;
      // Wait for a condition instead of sleeping a guessed number of ms: it
      // returns the instant the screen is really there (no dead pause when it
      // already was) and still gives up rather than hanging.
      const until = async (cond: () => boolean): Promise<void> => {
        const t0 = Date.now();
        while (!cond() && Date.now() - t0 < SETTLE_TIMEOUT) {
          await wait(40);
          if (dead()) return;
        }
      };

      void (async () => {
        T().setTransitioning(true);
        if (idx === 0) useTutorialSandbox.getState().reset();

        const want = step.modal ?? null;

        // The route is the only honest witness to what is on screen, so the
        // "which modal is open" flag is rebuilt from it first — stale in either
        // direction (a modal it thinks is closed, or one it never saw open) it
        // would otherwise make every decision below wrong.
        const onRoute =
          Object.keys(MODAL_ROUTE).find(
            (k) => MODAL_ROUTE[k] === pathRef.current,
          ) ?? null;
        const flag = T().openModal;
        // A pushed modal is open iff we stand on its route; the state-driven
        // history sheet has no route, so its flag is taken at its word.
        const open = onRoute ?? (flag && !MODAL_ROUTE[flag] ? flag : null);
        if (open !== flag) T().setOpenModal(open);

        // 1. Close a modal this step does not want.
        if (open && open !== want) {
          const route = MODAL_ROUTE[open];
          if (route && router.canGoBack()) {
            router.back();
            await until(() => pathRef.current !== route);
            // The route pops before the sheet has finished sliding away; let it,
            // so the tab underneath doesn't visibly swap behind a closing modal.
            await wait(180);
          }
          if (dead()) return;
          T().setOpenModal(null);
        }

        // 2. Stand on the step's tab. Skipped when we are already there (that
        //    needless round trip is what made consecutive Progress steps feel
        //    like a long dead pause), and when the step's own modal is already
        //    up — the tab is then behind it and cannot be wrong.
        const staying = want !== null && T().openModal === want;
        if (step.nav && !staying && pathRef.current !== step.nav) {
          router.navigate(step.nav as Href);
          await until(() => pathRef.current === step.nav);
          if (dead()) return;
        }

        // 3. Open the modal the step needs (a pushed route, or a state toggle).
        if (want && T().openModal !== want) {
          const route = MODAL_ROUTE[want];
          if (route) {
            router.push(route as Href);
            await until(() => pathRef.current === route);
            if (dead()) return;
          }
          T().setOpenModal(want);
          await wait(300); // let it animate in before the spotlight appears
          if (dead()) return;
        }

        if (
          step.sandbox === 'giveCoins' &&
          useTutorialSandbox.getState().coins < TUTORIAL_COINS
        ) {
          useTutorialSandbox.getState().giveCoins(TUTORIAL_COINS);
        }
        if (step.sandbox === 'reset') useTutorialSandbox.getState().reset();
        if (step.sandbox === 'clearWish')
          useTutorialSandbox.getState().clearWishlist();

        if (step.scrollScreen && step.target) {
          const id = step.target;
          const screen = step.scrollScreen;
          await until(() => !!T().rects[id]);
          if (dead()) return;
          const rr = T().rects[id];
          if (rr) T().scrollers[screen]?.(rr.y);
          // The spotlight may be revealed while the scroll is still gliding —
          // the target is re-measured continuously, so the hole rides with it.
          await wait(140);
        }

        if (dead()) return;
        settledAt.current = idx;
        T().setTransitioning(false);
      })();
    },
    [router],
  );

  // Drive each step once, on entry (Back re-enters, so it re-drives).
  const lastStep = useRef(-1);
  useEffect(() => {
    if (!active) {
      lastStep.current = -1;
      settledAt.current = -1;
      return;
    }
    if (scope !== 'root') return;
    if (lastStep.current === stepIndex) return;
    lastStep.current = stepIndex;
    settledAt.current = -1;
    repairs.current = 0;
    drive(stepIndex);
  }, [scope, active, stepIndex, drive]);

  // Watchdog: a settled step must stay on its own screen. If the route or the
  // open modal drifts from what the step declared — a stray tap, a dismissed
  // sheet, anything the tour did not do itself — steer straight back instead of
  // carrying on against a screen that is no longer there.
  useEffect(() => {
    if (!active || scope !== 'root') return;
    const step = TUTORIAL_STEPS[stepIndex];
    if (!step) return;
    if (settledAt.current !== stepIndex) return; // still being driven
    const adrift =
      pathname !== stepPath(step) || openModal !== (step.modal ?? null);
    if (!adrift || repairs.current >= 3) return;
    repairs.current += 1;
    settledAt.current = -1;
    drive(stepIndex);
  }, [active, scope, stepIndex, pathname, openModal, drive]);

  // Android's back button would pop the step's modal (or leave the app) out from
  // under the tour. The tour owns navigation while it runs; Skip is the way out.
  useEffect(() => {
    if (!active || scope !== 'root') return;
    const sub = BackHandler.addEventListener('hardwareBackPress', () => true);
    return () => sub.remove();
  }, [active, scope]);

  // Forced-tap advancement: when the user performs the step's real action.
  useEffect(() => {
    if (!active || scope !== 'root' || !pendingAction) return;
    const step = TUTORIAL_STEPS[stepIndex];
    if (step?.advanceOn && step.advanceOn === pendingAction) next();
    else clearAction();
  }, [active, scope, pendingAction, stepIndex, next, clearAction]);

  const finish = (): void => {
    // Stop first: any controller run still in flight sees the tour is over at
    // its next checkpoint and aborts, instead of pushing a modal onto a user
    // who has already left.
    const open = useTutorial.getState().openModal;
    useTutorial.getState().stop();
    // Skipping mid-flow can leave a modal on top — close it so the user lands
    // back on a normal screen.
    if (open && MODAL_ROUTE[open] && router.canGoBack()) router.back();
    useTutorial.getState().setOpenModal(null);
    useTutorialSandbox.getState().reset();
    useSettings.getState().setTutorialCompleted(true);
  };

  const step = TUTORIAL_STEPS[stepIndex];
  const myScope = step?.scope ?? 'root';
  if (!active || !step) return null;

  // Who holds the screen, and when.
  //
  // The root overlay sits ABOVE the navigator, so it alone can cover the tab
  // bar — but it would also cover a modal, which is why modal steps get their
  // own overlay inside the modal and the root one steps aside. It used to step
  // aside the instant the step changed, leaving the app fully live for the half
  // second the modal took to open: long enough to tap a tab and send the rest
  // of the tour chasing a screen the user had already left. So now, while a
  // step is in transition, BOTH layers block — the root because it covers the
  // navigator, the modal one because a native modal renders in its own window
  // that the root cannot reach. At no instant is neither of them there.
  const mine = myScope === scope;
  if (scope === 'modal' && !mine) return null;
  if (scope === 'root' && !mine && !transitioning) return null;

  // Block-only: an impenetrable sheet, no spotlight and no card. The root wears
  // the dim (it is on top for pushed modals); the modal layer stays clear so
  // the two never stack into a double-dark flash.
  const blockOnly = !mine || (scope === 'modal' && transitioning);
  if (blockOnly) {
    return (
      <View style={StyleSheet.absoluteFill}>
        <Pressable onPress={() => {}} style={StyleSheet.absoluteFill} />
        {mine ? null : (
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              { backgroundColor: `rgba(0,0,0,${DIM_OPACITY})` },
            ]}
          />
        )}
      </View>
    );
  }

  const isLast = stepIndex === TUTORIAL_STEP_COUNT - 1;
  const forced = !!step.advanceOn;
  const P = 10;
  // A rect stays in the store until its step ends, so one measured on a screen
  // the user has since left would still draw a hole — over whatever now happens
  // to be under those coordinates. A step only ever lights up its own screen.
  // (Unknown routes are none of the tour's business: it stays out of the way
  // rather than guessing, and the watchdog is already steering back.)
  const offStage = TOUR_PATHS.has(pathname) && pathname !== stepPath(step);
  const settled = !transitioning && !offStage;
  // No spotlight while the screen is still settling — avoids a flash on the
  // wrong element mid-transition.
  const hole =
    settled && step.target && rect
      ? {
          x: Math.max(0, rect.x - P),
          y: Math.max(0, rect.y - P),
          w: rect.width + 2 * P,
          h: rect.height + 2 * P,
        }
      : null;
  const r = hole ? Math.min(18, Math.min(hole.w, hole.h) / 2) : 0;
  // A second element kept lit (never tappable — the touch layer below only ever
  // opens the primary hole, so this one still sits under a blocker/catcher).
  const hole2 =
    settled && step.alsoLit && rect2
      ? {
          x: Math.max(0, rect2.x - P),
          y: Math.max(0, rect2.y - P),
          w: rect2.width + 2 * P,
          h: rect2.height + 2 * P,
        }
      : null;
  const r2 = hole2 ? Math.min(18, Math.min(hole2.w, hole2.h) / 2) : 0;
  // Fixed side per step so the tooltip never jumps once the target is measured.
  const tooltipAtBottom = step.tip !== 'top';

  // Forced-tap: a transparent hit-area sits exactly over the lit control and
  // performs its action. Passing the touch "through" the overlay to the real
  // button isn't reliable across the navigator boundary, so we proxy it — it
  // looks identical (the real control is lit, you tap it, it fires).
  const onProxyTap = (): void => {
    if (step.advanceOn) useTutorial.getState().signalAction(step.advanceOn);
  };

  // Back normally steps one back, unless the step names a different landing
  // point (a previous step that can no longer be replayed as-is).
  const onBack = (): void => {
    const bk = step.backToKey;
    const i = bk ? TUTORIAL_STEPS.findIndex((s) => s.key === bk) : -1;
    if (i >= 0) goTo(i);
    else back();
  };

  // Pass-through steps (typing into real inputs / trying real chips — only for
  // 'modal' scope, where the overlay shares the screen with the target):
  // instead of a full blocker, four catchers surround the hole so touches
  // inside it reach the real controls underneath.
  const passThrough = !!step.passThrough && !!hole;

  return (
    <View pointerEvents="box-none" style={StyleSheet.absoluteFill}>
      {passThrough && hole ? (
        <>
          <Pressable
            onPress={() => {}}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: 0,
              height: hole.y,
            }}
          />
          <Pressable
            onPress={() => {}}
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              top: hole.y + hole.h,
              bottom: 0,
            }}
          />
          <Pressable
            onPress={() => {}}
            style={{
              position: 'absolute',
              left: 0,
              top: hole.y,
              width: hole.x,
              height: hole.h,
            }}
          />
          <Pressable
            onPress={() => {}}
            style={{
              position: 'absolute',
              left: hole.x + hole.w,
              right: 0,
              top: hole.y,
              height: hole.h,
            }}
          />
        </>
      ) : (
        /* Block everything by default; the proxy below re-opens just the hole. */
        <Pressable onPress={() => {}} style={StyleSheet.absoluteFill} />
      )}

      {hole ? (
        // The SVG is wrapped in a pointerEvents="none" View: RN guarantees such
        // a view (and everything inside) never hit-tests, whereas the Svg
        // element's own pointerEvents can be ignored on the new architecture —
        // which silently swallowed taps inside the hole.
        <View pointerEvents="none" style={StyleSheet.absoluteFill}>
          <Svg width={width} height={height} style={StyleSheet.absoluteFill}>
            <Path
              d={
                `M0 0 H${width} V${height} H0 Z ` +
                roundedRectPath(hole.x, hole.y, hole.w, hole.h, r) +
                (hole2
                  ? ` ${roundedRectPath(hole2.x, hole2.y, hole2.w, hole2.h, r2)}`
                  : '')
              }
              fill={DIM}
              fillOpacity={DIM_OPACITY}
              fillRule="evenodd"
            />
            <SvgRect
              x={hole.x}
              y={hole.y}
              width={hole.w}
              height={hole.h}
              rx={r}
              ry={r}
              fill="none"
              stroke={c.primary['400']}
              strokeWidth={3}
            />
            {hole2 ? (
              <SvgRect
                x={hole2.x}
                y={hole2.y}
                width={hole2.w}
                height={hole2.h}
                rx={r2}
                ry={r2}
                fill="none"
                stroke={c.primary['400']}
                strokeWidth={2}
                strokeOpacity={0.6}
              />
            ) : null}
          </Svg>
        </View>
      ) : (
        <View
          pointerEvents="none"
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: `rgba(0,0,0,${DIM_OPACITY})` },
          ]}
        />
      )}

      {passThrough ? null : forced && hole && rect && step.button ? (
        // An identical live button placed exactly over the real one, so it
        // presses with the normal animation instead of a dead hit-area.
        <View
          style={{
            position: 'absolute',
            left: rect.x,
            top: rect.y,
            width: rect.width,
          }}
        >
          <Button
            label={t(step.button.labelKey)}
            variant={step.button.variant}
            size={step.button.size}
            icon={
              step.button.icon === 'gift' ? (
                <Gift size={16} color="#ffffff" weight="duotone" />
              ) : undefined
            }
            onPress={onProxyTap}
          />
        </View>
      ) : forced && hole ? (
        // No matching button to clone (e.g. a whole card) — a plain transparent
        // hit area. Keep the style a static object: giving this a `pressed`
        // style callback (to flash a press wash) stopped it registering taps at
        // all, so it stays feedback-free on purpose.
        <Pressable
          onPress={onProxyTap}
          accessibilityRole="button"
          accessibilityLabel={t('tutorial.tapPrompt')}
          style={{
            position: 'absolute',
            left: hole.x,
            top: hole.y,
            width: hole.w,
            height: hole.h,
          }}
        />
      ) : null}

      <View
        style={{
          position: 'absolute',
          left: 16,
          right: 16,
          ...(tooltipAtBottom
            ? { bottom: kb > 0 ? kb + 12 : insets.bottom + 24 }
            : { top: insets.top + 24 }),
        }}
      >
        <View
          className="rounded-2xl bg-neutral-0 p-5 dark:bg-neutral-900"
          style={{
            shadowColor: '#000',
            shadowOpacity: 0.16,
            shadowRadius: 14,
            shadowOffset: { width: 0, height: 5 },
            elevation: 10,
          }}
        >
          <Text className="text-xs font-semibold text-primary-600">
            {stepIndex + 1}/{TUTORIAL_STEP_COUNT}
          </Text>
          <Text className="mt-1 text-lg font-bold text-ink dark:text-neutral-50">
            {t(`tutorial.${step.key}.title`)}
          </Text>
          <Text className="mt-1.5 text-sm leading-6 text-ink-soft dark:text-neutral-300">
            {renderBody(t(`tutorial.${step.key}.body`, { currency }))}
          </Text>
          <View className="mt-4 flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              {stepIndex > 0 ? (
                <Pressable
                  onPress={onBack}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
                    {t('tutorial.back')}
                  </Text>
                </Pressable>
              ) : null}
              {/* Nothing left to skip on the closing card — only "Done". */}
              {isLast ? null : (
                <Pressable
                  onPress={finish}
                  hitSlop={8}
                  accessibilityRole="button"
                >
                  <Text className="text-sm font-medium text-ink-mute dark:text-neutral-400">
                    {t('tutorial.skip')}
                  </Text>
                </Pressable>
              )}
            </View>
            {forced ? (
              <Text className="text-xs font-medium text-primary-600">
                {t('tutorial.tapPrompt')}
              </Text>
            ) : step.auto ? null : (
              <View className="w-32">
                <Button
                  label={isLast ? t('tutorial.finish') : t('tutorial.next')}
                  size="sm"
                  onPress={() => (isLast ? finish() : next())}
                />
              </View>
            )}
          </View>
        </View>
      </View>
    </View>
  );
}
