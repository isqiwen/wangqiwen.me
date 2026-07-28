"use client";

import { Bounds, Html, OrbitControls, useGLTF } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import type { FC } from "react";
import { Suspense, useMemo } from "react";
import { mdxMutedTextClass, mdxPanelClass } from "./surface";

interface ThreeSceneProps {
  modelUrl: string;
  width?: string;
  height?: string;
  title?: string;
  caption?: string;
}

const Model: FC<{ modelUrl: string }> = ({ modelUrl }) => {
  const { scene } = useGLTF(modelUrl);
  const model = useMemo(() => scene.clone(), [scene]);

  return <primitive object={model} />;
};

export const ThreeScene: FC<ThreeSceneProps> = ({
  modelUrl,
  width = "100%",
  height = "420px",
  title,
  caption,
}) => {
  return (
    <div className={mdxPanelClass}>
      {title ? <p className="text-base font-semibold text-slate-900 dark:text-white">{title}</p> : null}
      <div
        className="mt-3 overflow-hidden rounded-2xl border border-slate-200/70 bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.2),_rgba(15,23,42,0.95))] dark:border-white/10"
        style={{ width, maxWidth: "100%", height, margin: "0 auto" }}
      >
        <Canvas camera={{ position: [0, 0, 3], fov: 35 }}>
          <Suspense fallback={<Html center className="text-sm text-white">Loading model...</Html>}>
            <ambientLight intensity={0.75} />
            <directionalLight position={[3, 4, 3]} intensity={1.2} />
            <Bounds fit clip observe margin={1.2}>
              <Model modelUrl={modelUrl} />
            </Bounds>
            <OrbitControls makeDefault enablePan={false} />
          </Suspense>
        </Canvas>
      </div>
      {caption ? <p className={`mt-3 ${mdxMutedTextClass}`}>{caption}</p> : null}
    </div>
  );
};
