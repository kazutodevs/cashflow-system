import { motion } from 'framer-motion'
import { Wallet2 } from 'lucide-react'  

export default function LoadingScreen() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        duration: 0.5,
        delayChildren: 0.2,
        staggerChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: 'easeOut' },
    },
  }

  const loaderVariants = {
    animate: {
      scaleY: [1, 1.2, 1],
      transition: {
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      },
    },
  }

  return (
  <div
    className="fixed inset-0 flex items-center justify-center overflow-hidden"
    style={{
      background: "#0a0a0a",
    }}
  >
    {/* Background Glow */}
    <div
      style={{
        position: "absolute",
        width: 500,
        height: 500,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(139,92,246,.12) 0%, transparent 70%)",
        top: -150,
        right: -150,
        filter: "blur(20px)",
      }}
    />

    <div
      style={{
        position: "absolute",
        width: 350,
        height: 350,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(139,92,246,.08) 0%, transparent 70%)",
        bottom: -120,
        left: -120,
        filter: "blur(20px)",
      }}
    />

    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{
        width: 360,
        padding: 40,
        borderRadius: 20,
        background: "rgba(255,255,255,.04)",
        border: "1px solid rgba(255,255,255,.08)",
        backdropFilter: "blur(20px)",
        textAlign: "center",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Top Accent */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: 2,
          background: "#8b5cf6",
        }}
      />

      <motion.div variants={itemVariants}>
        <div
          style={{
            width: 72,
            height: 72,
            margin: "0 auto 24px",
            borderRadius: 20,
            background: "rgba(139,92,246,.12)",
            border: "1px solid rgba(139,92,246,.2)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 30,
          }}
        >
          <Wallet2 size={36} className="text-accent" />
        </div>

        <h1
          style={{
            color: "#fff",
            fontWeight: 800,
            fontSize: 30,
            marginBottom: 6,
            letterSpacing: "-.5px",
          }}
        >
          CashFlow
        </h1>

        <p
          style={{
            color: "rgba(255,255,255,.5)",
            fontSize: 13,
            marginBottom: 30,
          }}
        >
          TKJ A • XI • 2026/2027
        </p>
      </motion.div>

      {/* Loader */}
      <motion.div
        variants={itemVariants}
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "flex-end",
          gap: 6,
          height: 40,
        }}
      >
        {[0, 1, 2, 3, 4].map((i) => (
          <motion.div
            key={i}
            animate={{
              scaleY: [1, 1.6, 1],
            }}
            transition={{
              duration: 0.9,
              repeat: Infinity,
              delay: i * 0.08,
            }}
            style={{
              width: 5,
              height: 12 + i * 5,
              borderRadius: 999,
              background: "#8b5cf6",
            }}
          />
        ))}
      </motion.div>

      <motion.p
        variants={itemVariants}
        animate={{
          opacity: [0.35, 1, 0.35],
        }}
        transition={{
          duration: 1.2,
          repeat: Infinity,
        }}
        style={{
          marginTop: 28,
          color: "rgba(255,255,255,.45)",
          fontSize: 13,
          letterSpacing: 1,
        }}
      >
        Loading dashboard...
      </motion.p>
    </motion.div>
  </div>
)
}