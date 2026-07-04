(function mobileWorkbenchCore(global) {
  "use strict";

  const TAP_DISTANCE = 6;
  const CLICK_SUPPRESSION_MS = 520;

  function finite(value, fallback = 0) {
    const number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.min(maximum, Math.max(minimum, finite(value, minimum)));
  }

  function getDeviceMode(snapshot = {}) {
    const viewport = global.visualViewport;
    const width = Math.max(1, finite(snapshot.width, viewport?.width || global.innerWidth || 1));
    const height = Math.max(1, finite(snapshot.height, viewport?.height || global.innerHeight || 1));
    const dpr = clamp(snapshot.dpr ?? global.devicePixelRatio ?? 1, 1, 4);
    const isTouchDevice = snapshot.isTouchDevice ?? (
      (global.navigator?.maxTouchPoints || 0) > 0 ||
      global.matchMedia?.("(pointer: coarse)")?.matches === true
    );
    const orientation = width > height ? "landscape" : "portrait";
    let mode = "tabletDesktop";
    if (orientation === "portrait" && width < 768) mode = "mobilePortrait";
    else if (orientation === "landscape" && width < 932) mode = "mobileLandscape";
    return Object.freeze({ mode, width, height, dpr, isTouchDevice, orientation });
  }

  function detectLowEndMobile(snapshot = {}) {
    const device = getDeviceMode(snapshot);
    if (device.mode === "tabletDesktop") return false;
    const cores = finite(snapshot.cores, global.navigator?.hardwareConcurrency || 4);
    const memory = finite(snapshot.memory, global.navigator?.deviceMemory || 4);
    const reducedMotion = snapshot.reducedMotion ?? global.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches === true;
    return cores <= 4 || memory <= 4 || reducedMotion || device.dpr > 2.5;
  }

  function rectValue(rect, key, fallback = 0) {
    return finite(rect?.[key], fallback);
  }

  function normalizeRect(rect) {
    const x = rectValue(rect, "x", rectValue(rect, "left"));
    const y = rectValue(rect, "y", rectValue(rect, "top"));
    const width = Math.max(0, rectValue(rect, "width"));
    const height = Math.max(0, rectValue(rect, "height"));
    return { x, y, width, height, left: x, top: y, right: x + width, bottom: y + height };
  }

  function calculateCanvasSafeRect(layout = {}) {
    const viewportWidth = Math.max(1, finite(layout.viewportWidth, global.innerWidth || 1));
    const viewportHeight = Math.max(1, finite(layout.viewportHeight, global.innerHeight || 1));
    const safe = layout.safeArea || {};
    const x = Math.max(0, finite(safe.left));
    const y = Math.max(0, finite(safe.top));
    const right = Math.min(viewportWidth, viewportWidth - Math.max(0, finite(safe.right)));
    const bottom = Math.min(viewportHeight, viewportHeight - Math.max(0, finite(safe.bottom)));
    const panelWidth = Math.max(0, finite(layout.activePanelWidth));
    const panelHeight = Math.max(0, finite(layout.activePanelHeight ?? layout.activeSheetHeight));
    const mode = layout.mode || "tabletDesktop";
    const width = Math.max(1, right - x - (mode === "mobileLandscape" ? panelWidth : 0));
    const height = Math.max(1, bottom - y - (mode === "mobilePortrait" ? panelHeight : 0));
    return Object.freeze({
      x,
      y,
      width,
      height,
      right: x + width,
      bottom: y + height,
      avoidRects: (layout.avoidRects || []).map(normalizeRect)
    });
  }

  function createGestureManager(options = {}) {
    const state = {
      activePointers: new Map(),
      gestureType: "none",
      startDistance: 0,
      currentDistance: 0,
      startCenter: null,
      currentCenter: null,
      movedDistance: 0,
      isTeachingModeActive: false,
      isEditingInput: false,
      isBottomSheetDragging: false,
      hadMultiplePointers: false,
      suppressClicksUntil: 0
    };
    let frame = 0;
    let pendingMove = null;

    function now() {
      return global.performance?.now?.() ?? Date.now();
    }

    function point(event) {
      return { id: event.pointerId ?? 1, x: finite(event.clientX), y: finite(event.clientY) };
    }

    function pointers() {
      return Array.from(state.activePointers.values());
    }

    function metrics() {
      const list = pointers();
      if (list.length < 2) return { distance: 0, center: list[0] || null };
      const [a, b] = list;
      return {
        distance: Math.hypot(b.x - a.x, b.y - a.y),
        center: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
      };
    }

    function scheduleMove(payload) {
      pendingMove = payload;
      if (frame) return;
      frame = global.requestAnimationFrame?.(() => {
        frame = 0;
        const next = pendingMove;
        pendingMove = null;
        if (next) options.onMove?.(next, getState());
      }) || 0;
      if (!global.requestAnimationFrame) options.onMove?.(payload, getState());
    }

    function pointerDown(event) {
      const next = point(event);
      state.activePointers.set(next.id, { ...next, startX: next.x, startY: next.y });
      if (state.activePointers.size >= 2) {
        state.hadMultiplePointers = true;
        state.gestureType = "pinch";
        const current = metrics();
        state.startDistance = current.distance;
        state.currentDistance = current.distance;
        state.startCenter = current.center;
        state.currentCenter = current.center;
        state.suppressClicksUntil = now() + CLICK_SUPPRESSION_MS;
      } else if (!state.isEditingInput && !state.isBottomSheetDragging) {
        state.gestureType = "tap";
        state.movedDistance = 0;
      }
      options.onStart?.(event, getState());
      return getState();
    }

    function pointerMove(event) {
      const previous = state.activePointers.get(event.pointerId ?? 1);
      if (!previous) return getState();
      const next = point(event);
      state.activePointers.set(next.id, { ...previous, x: next.x, y: next.y });
      if (state.activePointers.size >= 2 || state.hadMultiplePointers) {
        state.gestureType = "pinch";
        const current = metrics();
        state.currentDistance = current.distance;
        state.currentCenter = current.center;
        state.suppressClicksUntil = now() + CLICK_SUPPRESSION_MS;
      } else {
        state.movedDistance = Math.hypot(next.x - previous.startX, next.y - previous.startY);
        if (state.movedDistance > TAP_DISTANCE) state.gestureType = "pan";
      }
      scheduleMove({ event, type: state.gestureType });
      return getState();
    }

    function finishPointer(event, cancelled = false) {
      const id = event.pointerId ?? 1;
      const previousType = state.gestureType;
      state.activePointers.delete(id);
      const suppressTap = cancelled || state.hadMultiplePointers || previousType === "pinch" || previousType === "pan" || state.movedDistance > TAP_DISTANCE;
      if (suppressTap) state.suppressClicksUntil = now() + CLICK_SUPPRESSION_MS;
      const result = Object.freeze({
        type: suppressTap ? previousType : "tap",
        tap: !suppressTap && previousType === "tap",
        suppressTap
      });
      if (state.activePointers.size === 0) {
        state.gestureType = "none";
        state.startDistance = 0;
        state.currentDistance = 0;
        state.startCenter = null;
        state.currentCenter = null;
        state.movedDistance = 0;
        state.hadMultiplePointers = false;
      } else {
        state.gestureType = "pinch";
      }
      options.onEnd?.(event, result, getState());
      return result;
    }

    function shouldSuppressTap() {
      return state.activePointers.size > 1 || state.hadMultiplePointers || state.gestureType === "pinch" || state.gestureType === "pan" || now() < state.suppressClicksUntil;
    }

    function setTeachingMode(active) {
      state.isTeachingModeActive = Boolean(active);
    }

    function setEditingInput(active) {
      state.isEditingInput = Boolean(active);
    }

    function setBottomSheetDragging(active) {
      state.isBottomSheetDragging = Boolean(active);
    }

    function reset() {
      state.activePointers.clear();
      state.gestureType = "none";
      state.hadMultiplePointers = false;
      state.movedDistance = 0;
      state.suppressClicksUntil = now() + 80;
    }

    function getState() {
      return Object.freeze({ ...state, activePointers: new Map(state.activePointers) });
    }

    function register(target, callbacks = {}) {
      if (!target?.addEventListener) return () => {};
      const down = (event) => { pointerDown(event); callbacks.pointerDown?.(event, getState()); };
      const move = (event) => { pointerMove(event); callbacks.pointerMove?.(event, getState()); };
      const up = (event) => { const result = finishPointer(event, false); callbacks.pointerUp?.(event, result, getState()); };
      const cancel = (event) => { const result = finishPointer(event, true); callbacks.pointerCancel?.(event, result, getState()); };
      target.addEventListener("pointerdown", down);
      target.addEventListener("pointermove", move);
      target.addEventListener("pointerup", up);
      target.addEventListener("pointercancel", cancel);
      return () => {
        target.removeEventListener("pointerdown", down);
        target.removeEventListener("pointermove", move);
        target.removeEventListener("pointerup", up);
        target.removeEventListener("pointercancel", cancel);
      };
    }

    return Object.freeze({
      pointerDown,
      pointerMove,
      pointerUp: (event) => finishPointer(event, false),
      pointerCancel: (event) => finishPointer(event, true),
      shouldSuppressTap,
      setTeachingMode,
      setEditingInput,
      setBottomSheetDragging,
      register,
      reset,
      getState
    });
  }

  global.MODUDRAFTMobileCore = Object.freeze({
    TAP_DISTANCE,
    getDeviceMode,
    detectLowEndMobile,
    calculateCanvasSafeRect,
    createGestureManager,
    normalizeRect,
    clamp
  });
})(window);
