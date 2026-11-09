import React from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, ServerOff, Terminal } from 'lucide-react';
import { API_BASE } from '../utils/api';
import { MagneticButton } from './InteractiveEffects';

interface BackendOfflineStateProps {
  onRetry: () => void;
  isRetrying: boolean;
}

/**
 * Friendly animated "Backend not running" state displayed whenever a request
 * to http://localhost:8080 fails.
 */
export const BackendOfflineState: React.FC<BackendOfflineStateProps> = ({
  onRetry,
  isRetrying,
}) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="mx-auto max-w-3xl rounded-2xl border border-red-500/30 bg-slate-900/85 p-8 shadow-2xl"
    >
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 pb-6 border-b border-slate-800">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-red-500/15 border border-red-500/30 text-red-400">
            <ServerOff className="h-7 w-7" />
          </div>
          <div>
            <p className="text-xs font-medium text-red-400">
              Connection Interrupted · {API_BASE}
            </p>
            <h2 className="font-display text-3xl font-bold tracking-wide text-white mt-0.5">
              C++ Backend Server Not Running
            </h2>
          </div>
        </div>

        <MagneticButton
          onClick={onRetry}
          disabled={isRetrying}
          cursorLabel="RETRY"
          className="inline-flex items-center gap-2 rounded-lg bg-amber-500 px-5 py-2.5 text-sm font-semibold text-slate-950 hover:bg-amber-400"
        >
          <RefreshCw className={`h-4 w-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'Checking port 8080...' : 'Retry Connection'}</span>
        </MagneticButton>
      </div>

      <div className="mt-6 space-y-4 text-sm text-slate-300 leading-relaxed">
        <p>
          All cricket match simulations, toss outcomes, batting/bowling scorecards, Net Run Rate,
          and Orange/Purple Cap rankings live exclusively in the C++ backend at{' '}
          <code className="font-mono-num text-amber-300 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
            {API_BASE}
          </code>
          .
        </p>

        <div className="rounded-xl bg-slate-950/90 border border-slate-800/90 p-4 space-y-2.5">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
            <Terminal className="h-4 w-4 text-sky-400" />
            <span>How to start your local C++ server</span>
          </div>
          <pre className="font-mono-num text-xs text-slate-200 overflow-x-auto leading-relaxed">
{`# 1. Compile and start your C++ Cricket Simulator HTTP server on port 8080
g++ -std=c++17 server.cpp -o server -lws2_32 -lwsock32
./server

# 2. Verify it responds with teams JSON
curl ${API_BASE}/api/teams`}
          </pre>
        </div>
      </div>
    </motion.section>
  );
};
