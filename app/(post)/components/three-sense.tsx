"use client";

import { FC } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, useGLTF, Html, Loader } from "@react-three/drei";
import React, { Suspense } from "react";

interface ThreeSceneProps {
  modelUrl: string;
  width?: string;
  height?: string;
}

const Model: FC<{ modelUrl: string }> = ({ modelUrl }) => {
  const { scene } = useGLTF(modelUrl);
  return <primitive object={scene} />;
};

export const ThreeScene: FC<ThreeSceneProps> = ({
  modelUrl,
  width = "100%",
  height = "500px",
}) => {
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
      {/* Three.js 的主场景 */}
      <Canvas>
        {/* 使用 Suspense 包裹，显示加载状态 */}
        <Suspense fallback={<Html center>Loading...</Html>}>
          {/* 环境光和方向光 */}
          <ambientLight intensity={0.5} />
          <directionalLight position={[5, 10, 5]} intensity={1} />

          {/* 3D 模型 */}
          <Model modelUrl={modelUrl} />

          {/* 用户交互控制 */}
          <OrbitControls />
        </Suspense>
      </Canvas>

      {/* 全局加载器（显示加载进度条） */}
      <Loader />
    </div>
  );
};
