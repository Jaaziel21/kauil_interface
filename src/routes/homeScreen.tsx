import React, { useState, useEffect, useRef } from "react";

const WS_BASE = `${window.location.protocol === "https:" ? "wss" : "ws"}://localhost:8000`;

function ZedLensView({ streamKey, label }: { streamKey: string; label: string }) {
  const [frame, setFrame] = useState<string | null>(null);
  const [connected, setConnected] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(`${WS_BASE}/ws/connection/img/${streamKey}`);
    wsRef.current = ws;
    ws.onopen = () => setConnected(true);
    ws.onclose = () => {
      setConnected(false);
      setFrame(null);
    };
    ws.onerror = () => setConnected(false);
    ws.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        if (msg.data) {
          setFrame(`data:image/jpeg;base64,${msg.data}`);
        }
      } catch (err) {}
    };
    return () => {
      ws.close();
    };
  }, [streamKey]);

  return (
    <div className="bg-gray-800 rounded-2xl border border-gray-700 flex flex-col h-full min-h-[300px] overflow-hidden">
      <div className="flex items-center justify-between px-3 py-2 flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-400" : "bg-red-500"}`} />
          <span className="text-white text-xs font-semibold">{label}</span>
        </div>
      </div>
      <div className="flex-1 px-2 pb-2 min-h-0 overflow-hidden">
        <div className="relative w-full h-full bg-black rounded-xl overflow-hidden flex items-center justify-center">
          {frame ? (
            <img src={frame} alt={label} className="max-w-full max-h-full object-contain" />
          ) : (
            <div className="text-gray-600 flex flex-col items-center gap-2 text-sm">
              <span className="text-3xl">📷</span>
              <span>{connected ? "Waiting for frames..." : "Disconnected"}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const Home: React.FC = () => {
  return (
    <div className="flex flex-col h-full w-full overflow-hidden">
      <div className="flex items-center justify-between mb-4 flex-shrink-0">
        <h2 className="text-2xl font-bold">ResQ CEM - ZED Stereo Vision</h2>
      </div>
      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0 overflow-auto">
        <ZedLensView streamKey="zed_left" label="ZED Left Camera" />
        <ZedLensView streamKey="zed_right" label="ZED Right Camera" />
      </div>
    </div>
  );
};

export default Home;