import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { cn } from "@opengnothia/shared/lib/cn";
import { useThemeColors } from "@/theme/useAppTheme";

const TRACK_HEIGHT = 6;
const THUMB_SIZE = 26;
/** The strip is taller than the track so the control still clears 44pt of touch target. */
const ROW_HEIGHT = 44;
const MARK_SIZE = 6;

interface SliderProps {
  value: number;
  min: number;
  max: number;
  step: number;
  /** Fires on every step the finger crosses — cheap enough to drive a live readout. */
  onChange: (value: number) => void;
  /** Fires once when the finger lifts, for work too expensive to run per step. */
  onCommit?: (value: number) => void;
  /** Decorative ticks in value space — the meditation timer draws its bells here. */
  marks?: number[];
  disabled?: boolean;
  accessibilityLabel?: string;
  className?: string;
}

/**
 * A stepped slider, written on gesture-handler + reanimated rather than pulled in
 * as a dependency.
 *
 * @react-native-community/slider would mean a native rebuild, and it cannot draw
 * the marks the meditation screen lays on its bell tracks. Everything here is
 * JS + worklets, so Metro reload is the whole install step.
 *
 * The thumb position is a shared value driven straight from the gesture, so the
 * drag stays on the UI thread at 60fps; React only hears about it when the
 * quantised value actually changes. That is the difference between a slider that
 * tracks the finger and one that re-renders a screen sixty times a second.
 *
 * Dragging is relative to where the finger landed (grab the thumb, move it — the
 * iOS behaviour), while a tap jumps straight to the tapped point, which is what
 * makes a 60-step track usable without a long drag.
 */
export function Slider({
  value,
  min,
  max,
  step,
  onChange,
  onCommit,
  marks,
  disabled = false,
  accessibilityLabel,
  className,
}: SliderProps) {
  const { colors } = useThemeColors();

  const [width, setWidth] = useState(0);
  const usable = Math.max(0, width - THUMB_SIZE);
  const span = max - min;
  const steps = span > 0 ? Math.round(span / step) : 0;

  const pos = useSharedValue(0);
  const usableSV = useSharedValue(0);
  const startPos = useSharedValue(0);
  const lastValue = useSharedValue(value);
  const active = useSharedValue(0);
  // A pan that the system cancels (an incoming call, a control-centre swipe)
  // never reaches onEnd. onCommit is what hands the value to the store, so it
  // has to fire once per activated gesture either way — and never for a touch
  // that only ever became a tap.
  const started = useSharedValue(0);
  const ended = useSharedValue(0);

  // Gate for the prop→position sync below: while a finger owns the thumb, the
  // gesture is the source of truth and the echo of our own onChange must not
  // fight it. State rather than a ref, so that releasing re-runs the sync — a
  // parent that reorders on commit (the bell list does) moves this slider's
  // value out from under it, and a ref would leave the thumb behind.
  const [dragging, setDragging] = useState(false);

  // Callbacks reach the UI thread through stable identities; re-creating them
  // every render would rebuild the gesture on every step of a drag.
  const handlers = useRef({ onChange, onCommit });
  handlers.current = { onChange, onCommit };
  const emit = useCallback((next: number) => handlers.current.onChange(next), []);
  const commit = useCallback((next: number) => handlers.current.onCommit?.(next), []);

  // One gesture object for the life of the range, not one per render: a drag
  // re-renders this component on every step it crosses, and handing
  // GestureDetector a new gesture mid-drag would reconfigure the recogniser
  // underneath the finger.
  const gesture = useMemo(() => {
    const quantize = (px: number) => {
      "worklet";
      if (usableSV.value <= 0 || steps <= 0) return min;
      return Math.min(max, Math.max(min, min + Math.round((px / usableSV.value) * steps) * step));
    };

    const toPosition = (next: number) => {
      "worklet";
      if (span <= 0) return 0;
      return ((Math.min(max, Math.max(min, next)) - min) / span) * usableSV.value;
    };

    const pan = Gesture.Pan()
      .enabled(!disabled)
      // The screen scrolls vertically underneath: claim the gesture only once
      // the movement is clearly sideways, and give it up the moment it is not.
      .activeOffsetX([-4, 4])
      .failOffsetY([-14, 14])
      .onBegin(() => {
        startPos.value = pos.value;
      })
      .onStart(() => {
        active.value = 1;
        started.value = 1;
        ended.value = 0;
        runOnJS(setDragging)(true);
      })
      .onUpdate((event) => {
        const next = Math.min(usableSV.value, Math.max(0, startPos.value + event.translationX));
        pos.value = next;
        const stepped = quantize(next);
        if (stepped !== lastValue.value) {
          lastValue.value = stepped;
          runOnJS(emit)(stepped);
        }
      })
      .onEnd(() => {
        const stepped = quantize(pos.value);
        // Settle onto the step the value landed on, rather than leaving the
        // thumb wherever between two steps the finger stopped.
        pos.value = withTiming(toPosition(stepped), { duration: 120 });
        ended.value = 1;
        runOnJS(commit)(stepped);
      })
      .onFinalize(() => {
        active.value = 0;
        if (started.value === 1 && ended.value === 0) runOnJS(commit)(quantize(pos.value));
        started.value = 0;
        runOnJS(setDragging)(false);
      });

    // A tap jumps to where it landed. Dragging is relative to the thumb, which
    // is the iOS behaviour but means a sixty-step track would otherwise need a
    // long drag to cross.
    const tap = Gesture.Tap()
      .enabled(!disabled)
      .maxDuration(400)
      .onEnd((event) => {
        const stepped = quantize(Math.min(usableSV.value, Math.max(0, event.x - THUMB_SIZE / 2)));
        pos.value = withTiming(toPosition(stepped), { duration: 140 });
        lastValue.value = stepped;
        runOnJS(emit)(stepped);
        runOnJS(commit)(stepped);
      });

    return Gesture.Race(pan, tap);
  }, [
    disabled, min, max, step, steps, span, emit, commit,
    active, started, ended, lastValue, pos, startPos, usableSV,
  ]);

  const lastWidth = useRef(0);
  useEffect(() => {
    if (dragging || usable <= 0 || span <= 0) return;
    const target = ((Math.min(max, Math.max(min, value)) - min) / span) * usable;
    // A width change is a layout event, not a value change: animating there
    // would sweep the thumb across the screen on first paint and on rotation.
    if (lastWidth.current === usable) pos.value = withTiming(target, { duration: 140 });
    else pos.value = target;
    lastWidth.current = usable;
    lastValue.value = Math.min(max, Math.max(min, value));
  }, [value, dragging, usable, span, min, max, pos, lastValue]);

  const onLayout = (event: LayoutChangeEvent) => {
    const next = event.nativeEvent.layout.width;
    setWidth(next);
    usableSV.value = Math.max(0, next - THUMB_SIZE);
  };

  const fillStyle = useAnimatedStyle(() => ({ width: pos.value }));
  const thumbStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: pos.value },
      { scale: withTiming(active.value === 1 ? 1.18 : 1, { duration: 120 }) },
    ],
  }));

  const nudge = (direction: 1 | -1) => {
    const next = Math.min(max, Math.max(min, value + direction * step));
    if (next === value) return;
    onChange(next);
    onCommit?.(next);
  };

  return (
    <GestureDetector gesture={gesture}>
      <View
        onLayout={onLayout}
        accessibilityRole="adjustable"
        accessibilityLabel={accessibilityLabel}
        accessibilityValue={{ min, max, now: value }}
        accessibilityState={{ disabled }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(event) => nudge(event.nativeEvent.actionName === "increment" ? 1 : -1)}
        className={cn("justify-center", disabled && "opacity-40", className)}
        style={{ height: ROW_HEIGHT }}
      >
        <View
          className="absolute overflow-hidden rounded-full bg-raised"
          style={{ left: THUMB_SIZE / 2, right: THUMB_SIZE / 2, height: TRACK_HEIGHT }}
        >
          <Animated.View
            style={[{ height: TRACK_HEIGHT, backgroundColor: colors.tint, borderRadius: TRACK_HEIGHT / 2 }, fillStyle]}
          />
        </View>

        {/* Bell marks sit on top of the fill, so a bell that has been passed still
            reads as a bell rather than dissolving into the filled track. */}
        {usable > 0 &&
          span > 0 &&
          marks?.map((mark, index) => (
            <View
              key={`${mark}-${index}`}
              pointerEvents="none"
              className="absolute rounded-full"
              style={{
                left: THUMB_SIZE / 2 + ((Math.min(max, Math.max(min, mark)) - min) / span) * usable - MARK_SIZE / 2,
                width: MARK_SIZE,
                height: MARK_SIZE,
                backgroundColor: colors.accent,
              }}
            />
          ))}

        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: "absolute",
              width: THUMB_SIZE,
              height: THUMB_SIZE,
              borderRadius: THUMB_SIZE / 2,
              backgroundColor: "#FFFFFF",
              shadowColor: "#000",
              shadowOpacity: 0.28,
              shadowRadius: 4,
              shadowOffset: { width: 0, height: 2 },
              elevation: 4,
            },
            thumbStyle,
          ]}
        />
      </View>
    </GestureDetector>
  );
}
