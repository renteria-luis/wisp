import { type Href, useRouter } from 'expo-router';
import { Gift } from 'phosphor-react-native';
import { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
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

import { TUTORIAL_STEP_COUNT, TUTORIAL_STEPS } from './steps';

const DIM = '#000000';
const DIM_OPACITY = 0.66;
const TUTORIAL_COINS = 20;
// Modals reachable by pushing a route (others, like the history sheet, are
// state-driven and just toggled via `openModal`).
const MODAL_ROUTE: Record<string, Href | undefined> = {
  log: '/log' as Href,
  wishlist: '/wishlist' as Href,
  craving: '/craving' as Href,
};
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

  // Step side-effects: keep the right nav state, run sandbox effects, scroll.
  // Root instance only, guarded so it fires once per step (re-runs on Back too).
  const lastStep = useRef(-1);
  useEffect(() => {
    if (!active) {
      lastStep.current = -1;
      return;
    }
    if (scope !== 'root') return;
    if (lastStep.current === stepIndex) return;
    lastStep.current = stepIndex;
    const step = TUTORIAL_STEPS[stepIndex];
    if (!step) return;
    const myStep = stepIndex;
    // Abort a stale run (e.g. the user tapped Back before this one finished).
    const dead = (): boolean =>
      useTutorial.getState().stepIndex !== myStep ||
      !useTutorial.getState().active;
    void (async () => {
      // Hide the spotlight until the screen has settled on the right element.
      useTutorial.getState().setTransitioning(true);
      if (myStep === 0) useTutorialSandbox.getState().reset();
      await wait(80);
      if (dead()) return;
      const want = step.modal ?? null;
      // 1. Close any modal we don't want open. (`canGoBack` guards the
      //    "GO_BACK was not handled by any navigator" warning if it already
      //    dismissed itself.)
      const cur = useTutorial.getState().openModal;
      if (cur && cur !== want) {
        if (MODAL_ROUTE[cur] && router.canGoBack()) {
          router.back();
          await wait(260);
        }
        useTutorial.getState().setOpenModal(null);
        if (dead()) return;
      }
      // 2. Switch to the step's base tab — unless we're already sitting in the
      //    modal this step wants (then the tab underneath is already right).
      const stayingInModal =
        want !== null && useTutorial.getState().openModal === want;
      if (step.nav && !stayingInModal) {
        router.navigate(step.nav as Href);
        await wait(220);
        if (dead()) return;
      }
      // 3. Open the modal this step needs (a pushed route, or a state toggle).
      if (want && useTutorial.getState().openModal !== want) {
        const route = MODAL_ROUTE[want];
        if (route) router.push(route);
        useTutorial.getState().setOpenModal(want);
        await wait(360); // let the modal animate in before revealing
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
        await wait(120);
        for (let i = 0; i < 16; i++) {
          if (dead()) return;
          const rr = useTutorial.getState().rects[step.target];
          if (rr) {
            useTutorial.getState().scrollers[step.scrollScreen]?.(rr.y);
            break;
          }
          await wait(80);
        }
        await wait(320); // let the scroll animation settle before revealing
      }
      if (dead()) return;
      useTutorial.getState().setTransitioning(false);
    })();
  }, [scope, active, stepIndex, router]);

  // Forced-tap advancement: when the user performs the step's real action.
  useEffect(() => {
    if (!active || scope !== 'root' || !pendingAction) return;
    const step = TUTORIAL_STEPS[stepIndex];
    if (step?.advanceOn && step.advanceOn === pendingAction) next();
    else clearAction();
  }, [active, scope, pendingAction, stepIndex, next, clearAction]);

  const finish = (): void => {
    // Skipping mid-flow can leave a modal on top — close it so the user lands
    // back on a normal screen.
    const open = useTutorial.getState().openModal;
    if (open && MODAL_ROUTE[open] && router.canGoBack()) router.back();
    useTutorial.getState().setOpenModal(null);
    useTutorialSandbox.getState().reset();
    useSettings.getState().setTutorialCompleted(true);
    useTutorial.getState().stop();
  };

  const step = TUTORIAL_STEPS[stepIndex];
  const myScope = step?.scope ?? 'root';
  if (!active || !step || myScope !== scope) return null;

  const isLast = stepIndex === TUTORIAL_STEP_COUNT - 1;
  const forced = !!step.advanceOn;
  const P = 10;
  // No spotlight while the screen is still settling — avoids a flash on the
  // wrong element mid-transition.
  const hole =
    !transitioning && step.target && rect
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
    !transitioning && step.alsoLit && rect2
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
          <Pressable onPress={() => {}} style={{ position: 'absolute', left: 0, right: 0, top: 0, height: hole.y }} />
          <Pressable onPress={() => {}} style={{ position: 'absolute', left: 0, right: 0, top: hole.y + hole.h, bottom: 0 }} />
          <Pressable onPress={() => {}} style={{ position: 'absolute', left: 0, top: hole.y, width: hole.x, height: hole.h }} />
          <Pressable onPress={() => {}} style={{ position: 'absolute', left: hole.x + hole.w, right: 0, top: hole.y, height: hole.h }} />
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
          style={[StyleSheet.absoluteFill, { backgroundColor: `rgba(0,0,0,${DIM_OPACITY})` }]}
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
                <Pressable onPress={onBack} hitSlop={8} accessibilityRole="button">
                  <Text className="text-sm font-medium text-ink-soft dark:text-neutral-300">
                    {t('tutorial.back')}
                  </Text>
                </Pressable>
              ) : null}
              <Pressable onPress={finish} hitSlop={8} accessibilityRole="button">
                <Text className="text-sm font-medium text-ink-mute dark:text-neutral-400">
                  {t('tutorial.skip')}
                </Text>
              </Pressable>
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
