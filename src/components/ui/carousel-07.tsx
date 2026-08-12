"use client";

import * as React from "react";
import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  type PanInfo,
  type MotionValue,
} from "motion/react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";

interface Slide {
  image: string;
  title: string;
  description: string;
  badge: string;
}

const slides: Slide[] = [
  {
    image: "https://images.shadcnspace.com/assets/gallery/destinations-1.webp",
    title: "Mountain Trek",
    description: "Scale new heights and embrace the hiker's journey.",
    badge: "Adventure",
  },
  {
    image: "https://images.shadcnspace.com/assets/gallery/destinations-2.webp",
    title: "River Rafting",
    description: "Feel the adrenaline rush as you navigate the wild rapids.",
    badge: "Extreme",
  },
  {
    image: "https://images.shadcnspace.com/assets/gallery/destinations-1.webp",
    title: "Forest Walk",
    description: "Deep dive into the silence of the ancient woods.",
    badge: "Nature",
  },
  {
    image: "https://images.shadcnspace.com/assets/gallery/destinations-3.webp",
    title: "Azure Beach",
    description: "Unwind on the crystal clear shores of a tropical paradise.",
    badge: "Paradise",
  },
  {
    image: "https://images.shadcnspace.com/assets/gallery/destinations-4.webp",
    title: "Spiritual Path",
    description: "Discover inner peace through ancient wisdom.",
    badge: "Serenity",
  },
];

interface CarouselConfig {
  distanceDivisor: number;
  velocityDivisor: number;
  sensitivity: number;
  xMultiplier: number;
  yMultiplier: number;
  rotationMultiplier: number;
  scaleReduction: number;
}

const getCarouselConfig = (width: number): CarouselConfig => {
  if (width < 640) {
    return {
      distanceDivisor: 120,
      velocityDivisor: 500,
      sensitivity: 180,
      xMultiplier: 90,
      yMultiplier: 20,
      rotationMultiplier: 8,
      scaleReduction: 0.06,
    };
  }
  if (width < 1024) {
    return {
      distanceDivisor: 160,
      velocityDivisor: 650,
      sensitivity: 220,
      xMultiplier: 130,
      yMultiplier: 30,
      rotationMultiplier: 10,
      scaleReduction: 0.09,
    };
  }
  return {
    distanceDivisor: 200,
    velocityDivisor: 800,
    sensitivity: 250,
    xMultiplier: 170,
    yMultiplier: 40,
    rotationMultiplier: 12,
    scaleReduction: 0.12,
  };
};

const CarouselStacked = () => {
  const scrollProgress = useMotionValue(0);
  const startProgress = React.useRef(0);
  const [windowWidth, setWindowWidth] = React.useState(() =>
    typeof window !== "undefined" ? window.innerWidth : 0,
  );

  const total = slides.length;

  React.useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const config = React.useMemo(() => getCarouselConfig(windowWidth), [windowWidth]);

  const handleDragStart = () => {
    startProgress.current = scrollProgress.get();
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const dragDistance = info.offset.x;
    const velocity = info.velocity.x;

    const distanceShift = -dragDistance / config.distanceDivisor;
    const velocityShift = -velocity / config.velocityDivisor;

    let totalShift = Math.round(distanceShift + velocityShift);
    totalShift = Math.max(-3, Math.min(3, totalShift));

    const target = Math.round(startProgress.current) + totalShift;

    animate(scrollProgress, target, {
      type: "spring",
      stiffness: 200,
      damping: 30,
      mass: 1,
    });
  };

  return (
    <div className="flex w-full flex-col items-center justify-center overflow-hidden bg-paper py-10 select-none">
      <div className="relative flex h-80 w-full max-w-7xl items-center justify-center sm:h-112 lg:h-128">
        {/* Transparent drag surface */}
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragStart={handleDragStart}
          onDrag={(_, info) => {
            const delta = -info.delta.x / config.sensitivity;
            scrollProgress.set(scrollProgress.get() + delta);
          }}
          onDragEnd={handleDragEnd}
          className="absolute inset-0 z-50 cursor-grab active:cursor-grabbing"
        />

        {slides.map((slide, i) => (
          <Card key={i} slide={slide} index={i} total={total} progress={scrollProgress} config={config} />
        ))}
      </div>
    </div>
  );
};

interface CardProps {
  slide: Slide;
  index: number;
  total: number;
  progress: MotionValue<number>;
  config: CarouselConfig;
}

const Card = ({ slide, index, total, progress, config }: CardProps) => {
  const offset = useTransform(progress, (p) => {
    let diff = (index - p) % total;
    if (diff > total / 2) diff -= total;
    if (diff < -total / 2) diff += total;
    return diff;
  });

  const x = useTransform(offset, (o) => o * config.xMultiplier);
  const rotate = useTransform(offset, (o) => {
    const absO = Math.abs(o);
    if (absO < 0.05) return 0;
    return o * config.rotationMultiplier;
  });
  const y = useTransform(offset, (o) => {
    const absO = Math.abs(o);
    if (absO < 0.05) return 0;
    return absO * config.yMultiplier;
  });
  const scale = useTransform(offset, (o) => 1 - Math.abs(o) * config.scaleReduction);
  const opacity = useTransform(
    offset,
    [-total / 2, -total / 2 + 0.5, 0, total / 2 - 0.5, total / 2],
    [0, 1, 1, 1, 0],
  );
  const zIndex = useTransform(offset, (o) => Math.round(100 - Math.abs(o) * 10));
  const dimOpacity = useTransform(offset, [-2, -0.5, 0, 0.5, 2], [0.5, 0.2, 0, 0.2, 0.5]);
  const textOpacity = useTransform(offset, [-0.5, 0, 0.5], [0, 1, 0]);

  return (
    <motion.div
      style={{ x, rotate, y, scale, opacity, zIndex }}
      className={cn(
        "group pointer-events-none absolute overflow-hidden rounded-2xl bg-sand",
        "h-56 w-44 sm:h-80 sm:w-56 lg:h-96 lg:w-64",
      )}
    >
      <img
        src={slide.image}
        alt={slide.title}
        className="pointer-events-none absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
      />

      <motion.div style={{ opacity: dimOpacity }} className="pointer-events-none absolute inset-0 bg-ink" />

      <div className="absolute inset-0 bg-linear-to-t from-ink/80 via-ink/20 to-transparent" />

      <Badge className="absolute top-3 right-3 rounded-full bg-paper/95 px-2 py-0.5 text-xs font-bold tracking-widest text-ink uppercase backdrop-blur-md sm:top-5 sm:right-5 sm:px-3 sm:py-1 lg:top-6 lg:right-6">
        {slide.badge}
      </Badge>

      <div className="absolute right-3 bottom-5 left-3 text-center text-paper sm:right-5 sm:bottom-8 sm:left-5 sm:text-left lg:right-6 lg:bottom-10 lg:left-6">
        <motion.p
          style={{ opacity: textOpacity }}
          className="mb-0.5 text-sm leading-tight font-bold drop-shadow-md sm:mb-1 sm:text-lg lg:text-xl"
        >
          {slide.title}
        </motion.p>
        <motion.p
          style={{ opacity: textOpacity }}
          className="hidden text-xs font-medium text-paper/70 italic sm:line-clamp-2 sm:block"
        >
          {slide.description}
        </motion.p>
      </div>
    </motion.div>
  );
};

export default CarouselStacked;
