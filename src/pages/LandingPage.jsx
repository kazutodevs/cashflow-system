import { motion } from "framer-motion";
import { Wallet, ArrowRight, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  const containerVariants = {
    hidden: {
      opacity: 0,
    },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.15,
        delayChildren: 0.15,
      },
    },
  };

  const itemVariants = {
    hidden: {
      opacity: 0,
      y: 40,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: .8,
        ease: "easeOut",
      },
    },
  };

  return (
<<<<<<< HEAD
    <div className="relative w-full h-screen overflow-hidden bg-dark-primary">
      {/* Background image with overlay */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: 'url(https://fxxjfkcjtuuxbrxhfrph.supabase.co/storage/v1/object/public/expense-proofs/IMG-20260421-WA0021.webp)',
          filter: 'brightness(0.8) blur(1.5px)',
        }}
      />
=======
    <div className="relative min-h-screen overflow-hidden bg-[#0A0712] text-white">
>>>>>>> 0a888cb (feat: search bar on payment manager)

      {/* ================= BACKGROUND ================= */}

      <div className="absolute inset-0">

        {/* gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-[#261133] via-[#0A0712] to-black" />

        {/* purple glow */}
        <div
          className="absolute
          -left-40
          -top-32
          w-[700px]
          h-[700px]
          rounded-full
          blur-[180px]
          bg-purple-700/20"
        />

        {/* blue glow */}
        <div
          className="absolute
          left-[10%]
          bottom-[-250px]
          w-[650px]
          h-[650px]
          rounded-full
          blur-[180px]
          bg-cyan-500/10"
        />

        {/* orange glow */}
        <div
          className="absolute
          right-[-150px]
          top-[120px]
          w-[500px]
          h-[500px]
          rounded-full
          blur-[150px]
          bg-orange-500/15"
        />

      </div>

      {/* ================= DECORATION ================= */}

      <div className="absolute left-[-180px] bottom-[-180px] w-[700px] h-[700px] rounded-full border border-white/10" />
      <div className="absolute left-[-80px] bottom-[-90px] w-[520px] h-[520px] rounded-full border border-white/10" />
      <div className="absolute left-[20px] bottom-[10px] w-[360px] h-[360px] rounded-full border border-white/10" />

      <div className="absolute top-24 left-1/3 w-6 h-6 rounded-full border border-white/40" />
      <div className="absolute top-40 right-40 w-8 h-8 rounded-full border border-white/30" />
      <div className="absolute bottom-24 right-24 w-28 h-10 rotate-[-25deg] border border-white/20" />

      {/* ================= NAVBAR ================= */}

      <header className="absolute top-0 left-0 w-full z-30">

        <div className="max-w-7xl mx-auto px-10 py-8 flex items-center justify-between">

          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3"
          >

            <div className="w-12 h-12 rounded-full border border-white/30 flex items-center justify-center">

              <Wallet className="w-6 h-6" />

            </div>

            <span className="font-semibold tracking-wide text-lg">
              CashFlow
            </span>

          </motion.div>

          <motion.nav
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="hidden lg:flex items-center gap-16 font-semibold tracking-wide"
          >
            <Search className="cursor-pointer" />

          </motion.nav>

        </div>

      </header>

      {/* ================= HERO ================= */}

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="relative z-20 max-w-7xl mx-auto min-h-screen grid lg:grid-cols-2 items-center px-10 gap-12"
      >

        {/* LEFT */}

        <div>

          <motion.div variants={itemVariants}>

            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-8">

              <Wallet className="w-8 h-8 text-orange-400" />

            </div>

          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-6xl md:text-7xl xl:text-8xl font-black leading-[0.95]"
          >

            CashFlow

            <br />

            <span className="text-white">
              System by Nopal
            </span>

          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="mt-8 text-lg md:text-xl text-white/70 max-w-xl leading-relaxed"
          >

            Sistem kas kelas yang dibuat untuk
            TKJ A Angkatan 29.

            <br /><br />

            Dikembangkan oleh
            Noval Hadi Purnomo.

          </motion.p>

          <motion.div
            variants={itemVariants}
            className="mt-12 flex items-center gap-5"
          >

            <motion.button

              whileHover={{
                scale: 1.05,
                backgroundColor: "#fff",
                color: "#000",
              }}

              whileTap={{
                scale: .95,
              }}

              onClick={() => navigate("/login")}

              className="
              px-10
              py-5
              border
              border-white/50
              text-xl
              font-bold
              flex
              items-center
              gap-4
              transition-all
              duration-300
              "
            >

              Get Started

              <motion.div
                animate={{
                  x: [0, 8, 0],
                }}
                transition={{
                  duration: 1.4,
                  repeat: Infinity,
                }}
              >
                <ArrowRight size={22} />
              </motion.div>

            </motion.button>

                    </motion.div>

        </div>
        {/* ↑ close LEFT column here */}

        {/* RIGHT */}
        <motion.div
          variants={itemVariants}
          className="relative hidden lg:flex items-center justify-center"
        >
          {/* Glow */}
          <div
            className="
            absolute
            w-[520px]
            h-[520px]
            rounded-full
            bg-pink-500/20
            blur-[120px]
            "
          />

          {/* Main Image */}
          <motion.img
            animate={{
              y: [0, -15, 0],
              rotate: [0, 2, 0, -2, 0],
            }}
            transition={{
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
            }}
            src="https://cdn3d.iconscout.com/3d/premium/thumb/abstract-shape-3d-icon-download-in-png-blend-fbx-gltf-file-formats--render-art-design-pack-interface-icons-7575315.png"
            alt="Hero"
            className="
            relative
            w-[560px]
            drop-shadow-[0_0_80px_rgba(255,0,120,.35)]
            select-none
            pointer-events-none
            "
          />

          {/* Floating Circle */}
          <motion.div
            animate={{
              y: [0, -18, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
            }}
            className="
            absolute
            top-20
            left-10
            w-20
            h-20
            rounded-full
            bg-pink-500
            blur-sm
            opacity-80
            "
          />

          {/* Cube */}
          <motion.div
            animate={{
              y: [0, 15, 0],
              rotate: [0, 10, 0],
            }}
            transition={{
              duration: 6,
              repeat: Infinity,
            }}
            className="
            absolute
            right-10
            top-48
            w-20
            h-20
            rounded-xl
            bg-purple-600
            rotate-12
            "
          />

          {/* Ring */}
          <motion.div
            animate={{
              rotate: 360,
            }}
            transition={{
              duration: 18,
              repeat: Infinity,
              ease: "linear",
            }}
            className="
            absolute
            bottom-24
            right-20
            w-32
            h-32
            rounded-full
            border-[18px]
            border-yellow-400
            "
          />

        </motion.div>

      </motion.div>

      {/* Bottom Indicator */}

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="
        absolute
        bottom-8
        left-1/2
        -translate-x-1/2
        flex
        flex-col
        items-center
        gap-3
        "
      >

        <div className="flex gap-3">

          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="w-1 h-1 rounded-full bg-white/40" />
          <span className="w-1 h-1 rounded-full bg-white/40" />

        </div>

        <motion.div
          animate={{
            y: [0, 8, 0],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
          }}
          className="
          w-12
          h-12
          rounded-full
          border
          border-white/40
          flex
          items-center
          justify-center
          "
        >

          <ArrowRight className="rotate-90" />

        </motion.div>

      </motion.div>

      {/* Existing Floating Elements */}

      <motion.div
        animate={{
          y: [0, -10, 0],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
        }}
        className="
        absolute
        top-24
        right-16
        w-32
        h-32
        rounded-3xl
        bg-white/5
        backdrop-blur-md
        border
        border-white/10
        opacity-20
        "
      />

      <motion.div
        animate={{
          y: [0, 10, 0],
        }}
        transition={{
          duration: 5,
          repeat: Infinity,
        }}
        className="
        absolute
        bottom-28
        left-16
        w-44
        h-44
        rounded-full
        bg-white/5
        backdrop-blur-md
        border
        border-white/10
        opacity-10
        "
      />

      {/* Footer */}

      <motion.p
        initial={{
          opacity: 0,
        }}
        animate={{
          opacity: .5,
        }}
        transition={{
          delay: 2,
        }}
        className="
        absolute
        bottom-5
        w-full
        text-center
        text-xs
        tracking-widest
        text-white/50
        "
      >
        Sebuah langkah modernisasi sistem dari buku ke media website
      </motion.p>

    </div>
<<<<<<< HEAD
  )
}
=======
  );
}
>>>>>>> 0a888cb (feat: search bar on payment manager)
