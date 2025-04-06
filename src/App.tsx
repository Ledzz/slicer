import "./App.css";
import { Button, Layout, theme } from "antd";
import Sider from "antd/es/layout/Sider";
import { Content } from "antd/es/layout/layout";
import { Canvas } from "@react-three/fiber";
import { noEvents, PointerEvents } from "./utils/pointer-events";
import { OrbitHandles } from "@react-three/handle";
import { Stl } from "./Stl";
import { Environment } from "@react-three/drei";
import { Suspense } from "react";
import { DownloadOutlined } from "@ant-design/icons";
import { slice } from "./utils/slicer";
import { helperGroup } from "./utils/helper";
import { setPreviewLayerIndex, usePreviewStore } from "./previewStore.ts";
import { ImagePreview } from "./ImagePreview.tsx";
import { exportGoo } from "./export/goo.ts";

const file = "/baseplate-1x1.stl";

const result = await slice(file);

function App() {
  const {
    token: { colorBgContainer, borderRadiusLG, colorSplit, lineType },
  } = theme.useToken();

  const previewLayerIndex = usePreviewStore((s) => s.previewLayerIndex);

  return (
    <>
      <Layout
        style={{
          background: colorBgContainer,
          borderRadius: borderRadiusLG,
        }}
      >
        <Sider
          style={{
            background: colorBgContainer,
            height: "100vh",
            borderInlineEnd: `1px ${lineType} ${colorSplit}`,
            padding: "16px",
            overflow: "auto",
          }}
          width={300}
        >
          <Button type="primary" icon={<DownloadOutlined />} onClick={slice}>
            Slice
          </Button>

          <Button
            type="primary"
            icon={<DownloadOutlined />}
            onClick={() => exportGoo(result)}
          >
            Export GOO
          </Button>

          <input
            type={"range"}
            min={0}
            max={result.layers.length - 1}
            onChange={(e) => {
              setPreviewLayerIndex(+e.target.value);
            }}
          />

          <ImagePreview
            result={result}
            layer={result.layers[previewLayerIndex]}
          />
        </Sider>
        <Content>
          <Canvas
            camera={{
              near: 0.1,
              far: 10000,
              position: [-100, 60, 100],
            }}
            events={noEvents}
            style={{ minHeight: "100vh" }}
          >
            <Suspense
              fallback={
                <>
                  <pointLight position={[70, 100, 70]} intensity={50000 / 2} />
                  <pointLight
                    position={[-70, -40, -70]}
                    intensity={50000 / 2}
                  />
                  <ambientLight intensity={1} />
                </>
              }
            >
              <Environment
                files={"studio_small_03_compressed.exr"}
                environmentIntensity={0.7}
              />
            </Suspense>
            <PointerEvents />

            <OrbitHandles />

            <group rotation-x={-Math.PI / 2}>
              <primitive object={helperGroup} />

              <axesHelper scale={60} />

              <primitive object={result.layers[previewLayerIndex].line} />

              {result.layers.map((r, i) => (
                <group key={i}>
                  {/*<primitive object={r.line} />*/}
                  {/*{r.infill.map((line, k) => (*/}
                  {/*  // <arrowHelper*/}
                  {/*  //   key={k}*/}
                  {/*  //   args={[line[0], line[1], line[2], 0x00ff00]}*/}
                  {/*  // />*/}
                  {/*  <mesh key={k} position={line[1]}>*/}
                  {/*    <sphereGeometry args={[1]} />*/}
                  {/*    <meshBasicMaterial color={0x00ff00} />*/}
                  {/*  </mesh>*/}c{/*))}*/}
                </group>
              ))}
              <Stl renderOrder={100} url={file}>
                <meshStandardMaterial
                  color={0xff0000}
                  // wireframe
                  // wireframeLinewidth={2}
                  transparent
                  opacity={0.1}
                />
              </Stl>
            </group>
          </Canvas>
        </Content>
      </Layout>
    </>
  );
}

export default App;
