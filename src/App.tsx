import "./App.css";
import { Button, Layout, theme } from "antd";
import Sider from "antd/es/layout/Sider";
import { Content } from "antd/es/layout/layout";
import { Canvas } from "@react-three/fiber";
import { noEvents, PointerEvents } from "./utils/pointer-events.ts";
import { OrbitHandles } from "@react-three/handle";
import { Stl } from "./Stl.tsx";
import { Environment } from "@react-three/drei";
import { Suspense } from "react";
import { DownloadOutlined } from "@ant-design/icons";
import { slice } from "./utils/slicer.ts";
import { generateInfill } from "./utils/infill.ts";

const file = "/baseplate-1x1.stl";

const result = await slice(file);
const withInfill = generateInfill(result);
console.log(withInfill);

function App() {
  const {
    token: { colorBgContainer, borderRadiusLG, colorSplit, lineType },
  } = theme.useToken();

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
        </Sider>
        <Content>
          <Canvas
            camera={{
              near: 0.1,
              far: 10000,
              position: [-100, 60, 100],
            }}
            events={noEvents}
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

            <axesHelper scale={60} />
            <OrbitHandles />

            {withInfill.map((r, i) => (
              <group key={i}>
                <primitive object={r.line} />
                {r.infill.map((line, k) => (
                  <arrowHelper
                    key={k}
                    args={[line[0], line[1], line[2], 0x00ff00]}
                  />
                ))}
              </group>
            ))}
            <group rotation-x={-Math.PI / 2}>
              <Stl renderOrder={100} url={file}>
                <meshStandardMaterial
                  color={0xff0000}
                  // wireframe
                  // wireframeLinewidth={2}
                  transparent
                  opacity={0.4}
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
