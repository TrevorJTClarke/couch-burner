import React, { useRef, useEffect } from 'react';
import { Canvas, useFrame, extend } from '@react-three/fiber';
import { useThree } from '@react-three/fiber';
import { Plane } from '@react-three/drei';
import * as THREE from 'three';

const CustomShaderMaterial = THREE.ShaderMaterial;

extend({ CustomShaderMaterial });

const ParticleEmitter = () => {
  const planeRef = useRef();
  const { clock } = useThree();

  useEffect(() => {
    // Get the shader material uniform to update properties
    const material = planeRef.current.material;
    console.log('material', planeRef.current);
    // material.uniforms.time.value = 0; // Set initial time value

    return () => {
      // Clean up resources when the component unmounts
      material.dispose();
    };
  }, []);

  // useFrame(() => {
  //   // Update the time uniform in the shader to animate particles
  //   const material = planeRef.current.material;
  //   material.uniforms.time.value = clock.elapsedTime;
  // });

  return (
    <Plane ref={planeRef} args={[5, 5, 100, 100]}>
      {/* <customShaderMaterial
        attach="material"
        args={[
          {
            uniforms: {
              time: { value: 0 },
            },
            vertexShader: `
              uniform float time;

              void main() {
                // Define the vertex shader logic here
                // For particle animation, you can use the time uniform to move vertices
                // Example: float offsetY = sin(position.x + time) * 0.5;
                // gl_Position = projectionMatrix * modelViewMatrix * vec4(position.x, position.y + offsetY, position.z, 1.0);
              }
            `,
            fragmentShader: `
              void main() {
                // Define the fragment shader logic here
                // Example: gl_FragColor = vec4(1.0, 1.0, 1.0, 1.0);
              }
            `,
          },
        ]}
        transparent
        blending={THREE.AdditiveBlending}
      /> */}
    </Plane>
  );
};

export const Test2 = (props) => {
  const camPos = [-2, 2, 13]
  const camRot = [3, 3, 3]
  const cam = { position: camPos, fov: 30, zoom: 0.4, rotation: camRot }

  return (
    <div className="absolute z-10" style={{ width: "100vw", height: "calc(100vh - 100px)", margin: 'auto' }}>

      <Canvas dpr={[1, 2]} shadows camera={cam}>
        <ambientLight />
        <pointLight position={[10, 10, 10]} />
        <ParticleEmitter />
      </Canvas>
    </div>
  );
};
