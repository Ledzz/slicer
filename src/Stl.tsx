import { useLoader } from "@react-three/fiber";
import { FC, PropsWithChildren } from "react";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";

export const Stl: FC<PropsWithChildren<{ url: string }>> = ({
  url,
  children,
  ...props
}) => {
  const stl = useLoader(STLLoader, url);

  return (
    <mesh castShadow receiveShadow {...props}>
      <primitive attach="geometry" object={stl}></primitive>
      {children}
    </mesh>
  );
};
