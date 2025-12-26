"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Html5Qrcode } from "html5-qrcode";
import { isAddress } from "viem";

interface QRCodeScannerProps {
  isOpen: boolean;
  onClose: () => void;
  onScan: (address: string) => void;
}

export function QRCodeScanner({ isOpen, onClose, onScan }: QRCodeScannerProps) {
  const [error, setError] = useState<string | null>(null);
  const [isStarting, setIsStarting] = useState(false);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const isRunningRef = useRef(false);
  const hasScannedRef = useRef(false);
  
  // Use refs for callbacks to avoid re-running effect when they change
  const onScanRef = useRef(onScan);
  const onCloseRef = useRef(onClose);
  
  // Update refs when callbacks change
  useEffect(() => {
    onScanRef.current = onScan;
    onCloseRef.current = onClose;
  }, [onScan, onClose]);

  // Safe stop function
  const stopScanner = useCallback(async () => {
    if (scannerRef.current && isRunningRef.current) {
      try {
        isRunningRef.current = false;
        await scannerRef.current.stop();
      } catch (err) {
        // Ignore stop errors - scanner might already be stopped
        console.log("[QRScanner] Stop handled:", err);
      }
    }
  }, []);

  useEffect(() => {
    if (!isOpen) {
      // Reset state when closed
      hasScannedRef.current = false;
      return;
    }

    // Prevent re-initialization if already running
    if (isRunningRef.current) {
      return;
    }

    const startScanner = async () => {
      setIsStarting(true);
      setError(null);
      hasScannedRef.current = false;

      try {
        // Create scanner instance
        const scanner = new Html5Qrcode("qr-reader");
        scannerRef.current = scanner;

        // Get available cameras
        const devices = await Html5Qrcode.getCameras();
        if (devices.length === 0) {
          throw new Error("No camera found");
        }

        // Prefer back camera on mobile
        const backCamera = devices.find(
          (d) =>
            d.label.toLowerCase().includes("back") ||
            d.label.toLowerCase().includes("rear")
        );
        const cameraId = backCamera?.id || devices[0].id;

        await scanner.start(
          cameraId,
          {
            fps: 10,
            qrbox: { width: 250, height: 250 },
            aspectRatio: 1,
          },
          async (decodedText) => {
            // Prevent multiple scans
            if (hasScannedRef.current) return;
            hasScannedRef.current = true;

            // Stop scanner first
            try {
              isRunningRef.current = false;
              await scanner.stop();
            } catch (e) {
              // Ignore
            }
            
            // Then notify parent using refs
            onScanRef.current(decodedText);
            onCloseRef.current();
          },
          () => {
            // Ignore QR scan failures (noise, etc.)
          }
        );
        
        isRunningRef.current = true;
      } catch (err: any) {
        console.error("[QRScanner] Error:", err);
        if (err.name === "NotAllowedError") {
          setError("Camera permission denied. Please allow camera access.");
        } else if (err.message?.includes("No camera")) {
          setError("No camera found on this device.");
        } else {
          setError("Failed to start camera. Please try again.");
        }
      } finally {
        setIsStarting(false);
      }
    };

    // Small delay to ensure DOM is ready
    const timer = setTimeout(startScanner, 100);

    return () => {
      clearTimeout(timer);
      stopScanner();
      scannerRef.current = null;
    };
  }, [isOpen, stopScanner]); // Removed onScan, onClose - using refs instead

  // Close on escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 w-full max-w-sm"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-white">Scan QR Code</h2>
              <button
                onClick={onClose}
                className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-full transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={2}
                  stroke="currentColor"
                  className="w-5 h-5"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>

            {/* Scanner */}
            <div className="relative">
              {isStarting && (
                <div className="absolute inset-0 flex items-center justify-center bg-zinc-800 rounded-xl z-10">
                  <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-[#FB8D22] border-t-transparent rounded-full animate-spin" />
                    <p className="text-zinc-400 text-sm">Starting camera...</p>
                  </div>
                </div>
              )}

              {error ? (
                <div className="bg-zinc-800 rounded-xl p-8 text-center">
                  <div className="w-12 h-12 mx-auto mb-4 bg-red-500/10 rounded-full flex items-center justify-center">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                      strokeWidth={2}
                      stroke="currentColor"
                      className="w-6 h-6 text-red-400"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
                      />
                    </svg>
                  </div>
                  <p className="text-red-400 text-sm mb-4">{error}</p>
                  <button
                    onClick={onClose}
                    className="px-4 py-2 bg-zinc-700 hover:bg-zinc-600 text-white rounded-lg transition-colors text-sm"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <div
                  id="qr-reader"
                  className="rounded-xl overflow-hidden bg-zinc-800"
                  style={{ width: "100%", minHeight: "300px" }}
                />
              )}
            </div>

            <p className="text-zinc-500 text-sm text-center mt-4">
              Point your camera at a friend&apos;s QR code
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

