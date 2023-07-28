import * as THREE from "three"
import { useRef, useState, useEffect, useCallback, Suspense } from 'react'
import { Canvas, useFrame, useLoader, useThree, useStore } from "@react-three/fiber"
import { PerspectiveCamera, OrthographicCamera, OrbitControls, Environment, useTexture, Image, AsciiRenderer, Decal, useBox, Box, Torus, Stars, Cloud, MeshDistortMaterial, CameraShake } from "@react-three/drei"
// import { Physics, useSphere, usePlane, useBox } from "@react-three/cannon"
import { Physics, MeshCollider, RigidBody } from "@react-three/rapier"
import { EffectComposer, N8AO, SMAA, Pixelation, DepthOfField, Bloom, Noise, Scanline, Vignette, DotScreen, Outline, ChromaticAberration } from "@react-three/postprocessing"
import { BlendFunction, Resizer, KernelSize, GlitchMode } from 'postprocessing'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'
import { rand } from '../config/defaults'

const baubleMaterial = new THREE.MeshStandardMaterial({ color: "#222", roughness: 0, envMapIntensity: 1 })
const loader = new THREE.TextureLoader();

function Scene(props) {
  const gltf = useLoader(GLTFLoader, '/simpsons_room.gltf')

  const scale = 12
  gltf.scene.scale.x = scale
  gltf.scene.scale.y = scale
  gltf.scene.scale.z = scale
  gltf.scene.position.x = 0
  gltf.scene.position.y = -20
  gltf.scene.receiveShadow = true
  gltf.scene.castShadow = true

  return <primitive object={gltf.scene} castShadow />
}

const positions = [
  [-10, -2, -22],
  [-20, -2, -22],
  [0, -2, -22],
  [-10, 8, -22],
  [-20, 8, -22],
  [0, 8, -22],
]

function ImageCubes(props) {
  const map = loader.load(props.img)
  const groupPos = positions[parseInt(props.id)]

  let cubes = []
  let exterior = 16
  let size = 2
  let s2 = (size * size)
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const pos = [x * s2, y * s2, 0]
      const rot = [0, 0, 0]
      const m = map.clone()
      m.center = { x: 0, y: 0 }
      m.repeat = { x: 1 / size, y: 1 / size }
      m.offset = { x: (1 / size) * x, y: (1 / size) * y }

      const mat = [
        baubleMaterial, //right side
        baubleMaterial, //left side
        baubleMaterial, //top side
        baubleMaterial, //bottom side
        new THREE.MeshBasicMaterial({ map: m, transparent: true, side: THREE.DoubleSide, colorSpace: THREE.SRGBColorSpace }), //front side
        baubleMaterial,
      ];
      cubes.push(
        <RigidBody key={`${x}_${y}`} rotation={rot} position={pos} colliders={false}>
          <MeshCollider type="cuboid">
            <Box castShadow material={mat} args={[exterior / (size * size), exterior / (size * size), 1, 1, 1, 1]} />
          </MeshCollider>
        </RigidBody>
      )
    }
  }

  return (
    // <group rotation={[0, 0, 0]} position={[defaultX + (parseInt(props.id) * 6), defaultY, defaultZ - (parseInt(props.id) * 2)]} scale={[1, 1, 1]}>
    <group rotation={[0, 0, 0]} position={groupPos} scale={[1, 1, 1]}>
      {cubes}
    </group>
  )
}

export const GagSimpsonsRoom = (props) => {
  const [randomEffect] = useState(rand(1, 5))
  const camPos = [-193.62060575769587, 74.51339870809663, 591.9566643112296]
  const camRot = [0,0,0]
  const cam = { position: camPos, fov: 10, near: 1, far: 10000, zoom: 20, rotation: camRot }

  return (
    <div className="absolute z-10" style={{ width: "100vw", height: "calc(100vh - 100px)", margin: 'auto' }}>
      <Suspense>
        <Canvas dpr={[1, 2]} shadows camera={cam} orthographic={true} flat={true}>

          <ambientLight intensity={0.2} />
          <Physics gravity={[0, -12, 0]} paused={props.isPaused}>
            <group>

              {props.imgs.map((img, id) => (<ImageCubes img={img} id={id} key={id} />))}

              <RigidBody position={[0, 0, 0]} colliders={false} type="kinematicPosition">
                <MeshCollider type="cuboid" >
                  <Box position={[-8, -8, -20]} rotation={[-0.7, 0, 0]} args={[40, 40, 2]} castShadow receiveShadow>
                    <meshPhysicalMaterial transparent={true} opacity={0} />
                  </Box>
                </MeshCollider>
              </RigidBody>
              <RigidBody position={[0, 0, 0]} colliders={false} type="kinematicPosition">
                <MeshCollider type="cuboid" >
                  <Box position={[-8, 0, -23]} rotation={[0, 0, 0]} args={[3, 10, 2]} castShadow receiveShadow>
                    <meshPhysicalMaterial transparent={true} opacity={0} />
                  </Box>
                </MeshCollider>
              </RigidBody>
              <RigidBody position={[0, 0, 0]} colliders={false} type="kinematicPosition">
                <MeshCollider type="cuboid" >
                  <Box position={[-18, 10, -23]} rotation={[0, 0, 0]} args={[10, 3, 2]} castShadow receiveShadow>
                    <meshPhysicalMaterial transparent={true} opacity={0} />
                  </Box>
                </MeshCollider>
              </RigidBody>
              <RigidBody position={[0, 0, 0]} colliders={false} type="kinematicPosition">
                <MeshCollider type="cuboid" >
                  <Box position={[2, 7, -23]} rotation={[0, 0, 0]} args={[10, 3, 2]} castShadow receiveShadow>
                    <meshPhysicalMaterial transparent={true} opacity={0} />
                  </Box>
                </MeshCollider>
              </RigidBody>
              <RigidBody position={[0, 0, 0]} colliders={false} type="kinematicPosition">
                <MeshCollider type="cuboid" >
                  <Box position={[2, -2, -23]} rotation={[0, 0, 0]} args={[10, 3, 2]} castShadow receiveShadow>
                    <meshPhysicalMaterial transparent={true} opacity={0} />
                  </Box>
                </MeshCollider>
              </RigidBody>

              <Suspense>
                <RigidBody position={[0, 0.5, 0]} colliders={false} type="kinematicPosition">
                  <MeshCollider type="hull" >
                    <Scene {...props} castShadow />
                  </MeshCollider>
                </RigidBody>
              </Suspense>
            </group>
          </Physics>
          <OrbitControls enablePan={false} enableRotate={false} enableZoom={false} />

          {randomEffect == 1 && (
            <EffectComposer disableNormalPass multisampling={0}>
              <Noise opacity={0.2} />
              <Scanline blendFunction={BlendFunction.OVERLAY} density={1.25} />
              <ChromaticAberration offset={[0.001, 0.001]} />
            </EffectComposer>
            
          )}
          {randomEffect == 2 && (
            <EffectComposer disableNormalPass multisampling={0}>
              <Noise opacity={0.2} />
              <Scanline blendFunction={BlendFunction.OVERLAY} density={1.25} />
              <DepthOfField focusDistance={0.3} focalLength={5} bokehScale={4} height={100} />
              <Bloom luminanceThreshold={0.1} luminanceSmoothing={0.9} height={500} />
              <Noise opacity={0.01} />
              <Vignette eskil={false} offset={0.2} darkness={0.9} />
            </EffectComposer>
          )}
          {randomEffect == 3 && (
            <EffectComposer disableNormalPass multisampling={0}>
              <Pixelation granularity={8} />
              <Noise opacity={0.05} />
            </EffectComposer>
          )}
          <CameraShake maxYaw={0.005} maxPitch={0.005} maxRoll={0.005} yawFrequency={0.01} pitchFrequency={0.01} rollFrequency={0.01} />

        </Canvas>
      </Suspense>
    </div>
  )
}
