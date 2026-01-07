import Reactotron from "reactotron-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * Reactotron configuration for visual debugging
 *
 * Features:
 * - Network request inspection
 * - AsyncStorage monitoring
 * - Console log overlay
 * - State inspection
 * - Custom commands
 *
 * Download the Reactotron desktop app from:
 * https://github.com/infinitered/reactotron/releases
 */

declare global {
  interface Console {
    tron: typeof Reactotron;
  }
}

const reactotron = Reactotron.setAsyncStorageHandler(AsyncStorage)
  .configure({
    name: "OpenChamber Mobile",
    onDisconnect: () => {
      console.log("Reactotron disconnected");
    },
  })
  .useReactNative({
    asyncStorage: true, // Monitor AsyncStorage
    networking: {
      // Network request inspection
      ignoreUrls: /symbolicate|logs/,
    },
    editor: false,
    errors: { veto: () => false }, // Show all errors
    overlay: false,
  })
  .connect();

// Extend console with Reactotron
console.tron = reactotron;

// Log that Reactotron is connected
reactotron.log?.("Reactotron connected!");

export default reactotron;
