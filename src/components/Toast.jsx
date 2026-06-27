import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";
import { useEffect } from "react";

export default function Toast({ message, onDone }) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onDone();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onDone]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 40 }}
      className="fixed bottom-6 right-6 z-[9999]"
    >
      <div className="flex items-center gap-3 rounded-xl bg-green-600 px-5 py-4 text-white shadow-2xl">
        <CheckCircle size={20} />
        <span>{message}</span>
      </div>
    </motion.div>
  );
}