"use client";

import React, { FC, useEffect, useRef, Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Loader } from "@react-three/drei";
import { Box3, Vector3 } from "three";

interface ThreeSceneProps {
  modelUrl: string;
  width?: string;
  height?: string;
}

const Model: FC<{ modelUrl: string }> = ({ modelUrl }) => {
  const { scene } = useGLTF(modelUrl);

  useEffect(() => {
    const box = new Box3().setFromObject(scene);
    const center = new Vector3();
    box.getCenter(center);
    scene.position.sub(center);
  }, [scene]);

  return <primitive object={scene} />;
};

export const ThreeScene: FC<ThreeSceneProps> = ({
  modelUrl,
  width = "90%",
  height = "500px",
}) => {
  const controlsRef = useRef<any>(null);

  return (
    <div
      style={{
        width,
        height,
        maxWidth: "100%",
        margin: "0 auto",
        border: "1px solid #ccc",
        borderRadius: "8px",
      }}
    >
      <Canvas>
        <Suspense fallback={<Html center>Loading...</Html>}>
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={1} />
          <Model modelUrl={modelUrl} />
          <OrbitControls ref={controlsRef} />
        </Suspense>
      </Canvas>
      <Loader />
    </div>
  );
};
