import * as Linking from "expo-linking";
import { useCallback, useEffect, useRef, useState } from "react";
import { useConnectionStore } from "../stores/useConnectionStore";

interface DeepLinkAuthResult {
	url: string;
	token: string;
}

/**
 * Parses deep link URL for authentication parameters.
 * Supports formats:
 * - opencode://connect?url=https://server.com&token=abc123
 * - https://server.com?token=abc123 (web URL opened in app)
 */
function parseDeepLinkAuth(linkUrl: string): DeepLinkAuthResult | null {
	try {
		const url = new URL(linkUrl);

		// Handle opencode:// scheme
		if (url.protocol === "opencode:") {
			const serverUrl = url.searchParams.get("url");
			const token = url.searchParams.get("token");

			if (serverUrl && token) {
				return { url: serverUrl, token };
			}
		}

		// Handle web URL with token parameter (e.g., from Cloudflare tunnel)
		const token = url.searchParams.get("token");
		if (token) {
			// Remove token from URL to get base server URL
			const baseUrl = `${url.protocol}//${url.host}${url.pathname}`;
			return { url: baseUrl, token };
		}

		return null;
	} catch {
		return null;
	}
}

interface UseDeepLinkAuthOptions {
	onAuthSuccess?: (serverUrl: string) => void;
	onAuthError?: (error: Error) => void;
}

export function useDeepLinkAuth(options: UseDeepLinkAuthOptions = {}) {
	const [isProcessing, setIsProcessing] = useState(false);
	const [error, setError] = useState<Error | null>(null);
	const hasProcessedRef = useRef(false);
	const { setConnection, isConnected } = useConnectionStore();

	const processDeepLink = useCallback(
		async (linkUrl: string) => {
			// Skip if already connected or already processing
			if (hasProcessedRef.current || isProcessing) {
				return;
			}

			const authData = parseDeepLinkAuth(linkUrl);
			if (!authData) {
				return;
			}

			hasProcessedRef.current = true;
			setIsProcessing(true);
			setError(null);

			try {
				console.log(`[DeepLinkAuth] Processing URL token for: ${authData.url}`);
				await setConnection(authData.url, authData.token);
				console.log(`[DeepLinkAuth] Successfully authenticated`);
				options.onAuthSuccess?.(authData.url);
			} catch (err) {
				const error = err instanceof Error ? err : new Error("Failed to authenticate with URL token");
				console.error(`[DeepLinkAuth] Authentication failed:`, error.message);
				setError(error);
				options.onAuthError?.(error);
				// Reset so user can try again
				hasProcessedRef.current = false;
			} finally {
				setIsProcessing(false);
			}
		},
		[setConnection, isProcessing, options]
	);

	// Handle initial URL (app opened via deep link)
	useEffect(() => {
		if (isConnected) {
			return;
		}

		const checkInitialUrl = async () => {
			const initialUrl = await Linking.getInitialURL();
			if (initialUrl) {
				await processDeepLink(initialUrl);
			}
		};

		checkInitialUrl();
	}, [processDeepLink, isConnected]);

	// Handle URL changes while app is open
	useEffect(() => {
		if (isConnected) {
			return;
		}

		const subscription = Linking.addEventListener("url", (event) => {
			processDeepLink(event.url);
		});

		return () => {
			subscription.remove();
		};
	}, [processDeepLink, isConnected]);

	return {
		isProcessing,
		error,
		processDeepLink,
	};
}
