import { useEffect, useRef } from "react";
import { Dimensions, type GestureResponderEvent } from "react-native";

interface EdgeSwipeOptions {
	edgeThreshold?: number;
	minSwipeDistance?: number;
	maxSwipeTime?: number;
	enabled?: boolean;
	onSwipe?: () => void;
}

export function useEdgeSwipe(options: EdgeSwipeOptions = {}) {
	const {
		edgeThreshold = 30,
		minSwipeDistance = 50,
		maxSwipeTime = 300,
		enabled = true,
		onSwipe,
	} = options;

	const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);

	useEffect(() => {
		if (!enabled || !onSwipe) return;

		const screenWidth = Dimensions.get("window").width;

		const handleTouchStart = (event: TouchEvent) => {
			const touch = event.touches[0];
			if (!touch) {
				touchStartRef.current = null;
				return;
			}

			const fromLeft = touch.clientX <= edgeThreshold;
			if (fromLeft) {
				touchStartRef.current = {
					x: touch.clientX,
					y: touch.clientY,
					time: Date.now(),
				};
			} else {
				touchStartRef.current = null;
			}
		};

		const handleTouchEnd = (event: TouchEvent) => {
			if (!touchStartRef.current) return;

			const touch = event.changedTouches[0];
			if (!touch) {
				touchStartRef.current = null;
				return;
			}

			const { x: startX, y: startY, time: startTime } = touchStartRef.current;
			const endX = touch.clientX;
			const endY = touch.clientY;
			const endTime = Date.now();

			const deltaX = endX - startX;
			const deltaY = endY - startY;
			const deltaTime = endTime - startTime;

			const isHorizontal = Math.abs(deltaY) < Math.abs(deltaX);
			const isQuick = deltaTime <= maxSwipeTime;
			const limitedVertical = Math.abs(deltaY) < minSwipeDistance;
			const isValidSwipe = deltaX >= minSwipeDistance && isHorizontal && isQuick && limitedVertical;

			if (isValidSwipe) {
				onSwipe();
			}

			touchStartRef.current = null;
		};

		const handleTouchCancel = () => {
			touchStartRef.current = null;
		};

		if (typeof document !== "undefined") {
			document.addEventListener("touchstart", handleTouchStart, { passive: true });
			document.addEventListener("touchend", handleTouchEnd, { passive: true });
			document.addEventListener("touchcancel", handleTouchCancel, { passive: true });

			return () => {
				document.removeEventListener("touchstart", handleTouchStart);
				document.removeEventListener("touchend", handleTouchEnd);
				document.removeEventListener("touchcancel", handleTouchCancel);
			};
		}
	}, [enabled, edgeThreshold, minSwipeDistance, maxSwipeTime, onSwipe]);
}

export function createPanResponderHandlers(options: EdgeSwipeOptions) {
	const {
		edgeThreshold = 30,
		minSwipeDistance = 50,
		maxSwipeTime = 300,
		onSwipe,
	} = options;

	let touchStart: { x: number; y: number; time: number } | null = null;

	return {
		onStartShouldSetResponder: (evt: GestureResponderEvent) => {
			const { pageX } = evt.nativeEvent;
			return pageX <= edgeThreshold;
		},
		onResponderGrant: (evt: GestureResponderEvent) => {
			const { pageX, pageY } = evt.nativeEvent;
			touchStart = { x: pageX, y: pageY, time: Date.now() };
		},
		onResponderRelease: (evt: GestureResponderEvent) => {
			if (!touchStart || !onSwipe) return;

			const { pageX, pageY } = evt.nativeEvent;
			const deltaX = pageX - touchStart.x;
			const deltaY = pageY - touchStart.y;
			const deltaTime = Date.now() - touchStart.time;

			const isHorizontal = Math.abs(deltaY) < Math.abs(deltaX);
			const isQuick = deltaTime <= maxSwipeTime;
			const limitedVertical = Math.abs(deltaY) < minSwipeDistance;
			const isValidSwipe = deltaX >= minSwipeDistance && isHorizontal && isQuick && limitedVertical;

			if (isValidSwipe) {
				onSwipe();
			}

			touchStart = null;
		},
		onResponderTerminate: () => {
			touchStart = null;
		},
	};
}
