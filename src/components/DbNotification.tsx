import React from 'react';
import { useAppContext } from '../context/AppContext';
import { CheckCircle2, XCircle, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export const DbNotification = () => {
  const { dbStatus, dbMessage } = useAppContext();

  return (
    <AnimatePresence>
      {dbStatus !== 'idle' && (
        <motion.div
          initial={{ opacity: 0, y: -50 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -50 }}
          className={`fixed top-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-lg text-white ${
            dbStatus === 'connected' ? 'bg-emerald-500' :
            dbStatus === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          }`}
        >
          {dbStatus === 'connecting' && <Loader2 className="w-5 h-5 animate-spin" />}
          {dbStatus === 'connected' && <CheckCircle2 className="w-5 h-5" />}
          {dbStatus === 'error' && <XCircle className="w-5 h-5" />}
          <span className="font-medium">{dbMessage}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
