import { useRef, useState, useEffect, createRef } from 'react'
import * as THREE from "three"
import { Canvas, useFrame, useLoader, useThree, useStore } from "@react-three/fiber"
import { RenderTexture, PerspectiveCamera, OrthographicCamera, OrbitControls, Environment, useTexture, Image, AsciiRenderer, Decal, useBox, Box, Torus, Stars, Cloud } from "@react-three/drei"
// import { Physics, useSphere, usePlane, useBox } from "@react-three/cannon"
import { Physics, MeshCollider, RigidBody } from "@react-three/rapier"
import { EffectComposer, N8AO, SMAA, Pixelation, DepthOfField, Bloom, Noise, Scanline, Vignette, DotScreen } from "@react-three/postprocessing"
import { BlendFunction } from 'postprocessing'
// import { STLLoader } from 'three/addons/loaders/STLLoader'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader'

const rfs = THREE.MathUtils.randFloatSpread
const rand = THREE.MathUtils.randFloatSpread
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32)
const boxGeometry = new THREE.BoxGeometry(20, 2, 2, 32, 32, 32)
// const baubleMaterial = new THREE.MeshStandardMaterial({ color: "#db2777", roughness: 0, envMapIntensity: 1 })
const baubleMaterial = new THREE.MeshStandardMaterial({ color: "#222", roughness: 0, envMapIntensity: 1 })

const loader = new THREE.TextureLoader();
// const stlloader = new STLLoader();

function Scene(props) {
  // const gltf = useLoader(GLTFLoader, '/couch_nfts_cam2.gltf')
  const gltf = useLoader(GLTFLoader, '/tv_close2.gltf')

  gltf.scene.scale.x = 15
  gltf.scene.scale.y = 15
  gltf.scene.scale.z = 15
  gltf.scene.position.x = -2
  gltf.scene.position.y = -3
  gltf.scene.receiveShadow = true
  gltf.scene.castShadow = true
  console.log('gltf', gltf);

  // useFrame((state) => {
  //   // console.log('state', state);
  //   state.camera = gltf.cameras[0]
  // })
  return <primitive object={gltf.scene} castShadow />
}

// const defaultX = -8.25
// const defaultY = -6.70
const defaultX = -3.3
const defaultY = -7

function ImageCubes(props) {
  const map = loader.load(props.img)

  let cubes = []
  let size = 10
  for (let x = 0; x < size; x++) {
    for (let y = 0; y < size; y++) {
      const pos = [x, 5 + y, 0]
      const rot = [0, 0, 0]
      const m = map.clone()
      m.center = { x: 0, y: 0 }
      m.repeat = { x: 0.1, y: 0.1 }
      m.offset = { x: 0.1 * x, y: 0.1 * y }

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
          <MeshCollider type="hull">
            <Box castShadow material={mat} args={[1, 1, 0.03, 1, 1, 1]} />
          </MeshCollider>
        </RigidBody>
      )
    }
  }

  return (
    <group rotation={[0.1, 0, 0]} position={[defaultX, defaultY, 0.65 + (parseInt(props.id) * 0.125)]} scale={[0.71, 0.71, 0.71]}>
      {cubes}
    </group>
  )
}

function TvFace(props) {
  // const mat = useRef()
  // const textRef = useRef()
  // useFrame((state) => (textRef.current.position.x = Math.sin(state.clock.elapsedTime) * 2))
  console.log('props.imgs', props.imgs);
  return (
    <mesh position={[-5.15, 0, 1.1]} scale={[7.75, 7.75, 7.75]}>
      <planeGeometry args={[1.2, 1, 1]} />
      <meshStandardMaterial>
        <RenderTexture attach="map" anisotropy={16}>
          <PerspectiveCamera makeDefault manual aspect={props.aspectRatio || 1} position={[0, 0, 10]} fov={50} />
          
          {/* <color attach="background" args={['orange']} /> */}
          {/* <ambientLight intensity={0.1} /> */}
          <directionalLight position={[10, 10, 5]} />
          {/* <spotLight angle={0.30} penumbra={0.75} position={[30, 30, 50]} castShadow /> */}
          {/* <Dodecahedron /> */}

          <Physics gravity={[0, -7, 0]} paused={props.isPaused}>
            <group>
              {props.imgs.map((img, id) => (<ImageCubes img={img} id={id} key={id} />))}

              <RigidBody
                colliders={false}
                position={[0, -4.2, 0]}
                type="kinematicPosition"
              >
                <MeshCollider type="cuboid">
                  <Box args={[100, 0.1, 80]} castShadow receiveShadow>
                    <meshPhysicalMaterial color="black" />
                  </Box>
                </MeshCollider>
              </RigidBody>
            </group>
          </Physics>
        </RenderTexture>
      </meshStandardMaterial>
    </mesh>
  )
}

function Dodecahedron(props) {
  const meshRef = useRef()
  const [hovered, hover] = useState(false)
  const [clicked, click] = useState(false)
  useFrame(() => (meshRef.current.rotation.x += 0.01))
  return (
    <group {...props}>
      <mesh
        ref={meshRef}
        scale={clicked ? 1.5 : 1}
        onClick={() => click(!clicked)}
        onPointerOver={() => hover(true)}
        onPointerOut={() => hover(false)}>
        <dodecahedronGeometry args={[0.75]} />
        <meshStandardMaterial color={hovered ? 'hotpink' : '#5de4c7'} />
      </mesh>
    </group>
  )
}

export const GagTvRendered = (props) => {
  const parentRef = createRef()
  const sceneRef = createRef()
  const [aspectRatio, setAspectRatio] = useState(1/1)

  useEffect(() => {
    const w = parentRef.current?.clientWidth || 1
    const h = parentRef.current?.clientHeight || 1
    console.log(sceneRef.current);

    setAspectRatio(w/h)
  }, [])

  // const [ready, set] = useState(false)
  // useEffect(() => {
  //   const timeout = setTimeout(() => set(true), 1000)
  //   return () => clearTimeout(timeout)
  // }, [])

  // const camPos = [25, 12, 25]
  // const camRot = [-115.60, -110.66, -327.45]
  // const cam = { position: camPos, fov: 30, zoom: 0.4, rotation: camRot }

  const camPos = [-2, 2, 13]
  const camRot = [3,3,3]
  const cam = { position: camPos, fov: 30, zoom: 0.4, rotation: camRot }

  return (
    <div ref={parentRef} className="absolute z-10" style={{ width: "100vw", height: "calc(100vh - 100px)", margin: 'auto' }}>

      <Canvas dpr={[1, 2]} shadows camera={cam}>
        {/* <PerspectiveCamera dpr={[1, 2]} makeDefault manual position={camPos} rotation={camRot} fov={10} zoom={0.5} /> */}
        {/* <OrthographicCamera makeDefault manual position={camPos} rotation={camRot} fov={10} zoom={0.5} near={0.1} /> */}
        {/* <PerspectiveCamera makeDefault manual aspect={1 / 1} position={[0, 0, 4]} fov={10} zoom={0.5} /> */}

        <ambientLight intensity={0.1} />
        {/* <directionalLight intensity={0.1} color="pink" position={[0, 0, 5]} /> */}
        {/* <hemisphereLight color="white" groundColor="blue" intensity={0.5} /> */}
        <spotLight angle={0.30} penumbra={0.75} position={[30, 30, 50]} castShadow />
        {/* <Physics gravity={[0, -7, 0]} paused={props.isPaused}>
          <group>
            {props.imgs.map((img, id) => (<ImageCubes img={img} id={id} key={id} />))}

            <RigidBody position={[0, 0.5, 0]} colliders={false} type="kinematicPosition">
              <MeshCollider type="hull" >
                <Scene {...props} castShadow />
              </MeshCollider>
            </RigidBody>

            <RigidBody
              colliders={false}
              position={[0, -4.2, 0]}
              type="kinematicPosition"
            >
              <MeshCollider type="cuboid">
                <Box args={[100, 0.1, 80]} castShadow receiveShadow>
                  <meshPhysicalMaterial color="#db2777" />
                </Box>
              </MeshCollider>
            </RigidBody>
          </group>
        </Physics> */}

        {/* <PerspectiveCamera makeDefault manual aspect={aspectRatio} position={[0, 0, 10]} fov={50} />

        <Physics gravity={[0, -7, 0]} paused={false}>
          <group>
            {props.imgs.map((img, id) => (<ImageCubes img={img} id={id} key={`${img}-${id}`} />))}

            <RigidBody
              colliders={false}
              position={[0, -4, 0]}
              type="kinematicPosition"
            >
              <MeshCollider type="cuboid">
                <Box args={[100, 0.1, 80]} castShadow receiveShadow>
                  <meshPhysicalMaterial color="#db2777" />
                </Box>
              </MeshCollider>
            </RigidBody>
          </group>
        </Physics> */}

        <TvFace ref={sceneRef} {...props} aspect={aspectRatio} castShadow receiveShadow />

        <Scene {...props} castShadow receiveShadow />

        <Box position={[1,-4.4,1]} args={[100, 0.1, 80]} castShadow receiveShadow>
          <meshPhysicalMaterial color="#db2777" />
        </Box>

        <OrbitControls />
        {/* <OrbitControls autoRotate autoRotateSpeed={0.6} enablePan={false} enableZoom={false} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 4} /> */}
        {/* <OrbitControls enablePan={true} enableZoom={true} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 4} /> */}
        {/* <OrbitControls enableDamping={true} enablePan={true} enableRotate={false} enableZoom={true} minPolarAngle={Math.PI / 4} maxPolarAngle={Math.PI / 4} /> */}

        {/* <AsciiRenderer bgColor="transparent" fgColor="#db2777" /> */}
        {/* <fog attach="fog" args={['#202020', 8, 50]} /> */}
        {/* <EffectComposer disableNormalPass multisampling={0}>
          <Pixelation granularity={8} />
          <Noise opacity={0.05} />
        </EffectComposer> */}
        {/* <EffectComposer renderPriority={2} multisampling={0}>
          <Scanline blendFunction={BlendFunction.OVERLAY} density={1.25} />
          <DepthOfField focusDistance={0} focalLength={0.2} bokehScale={10} height={380} />
          <Bloom luminanceThreshold={0} luminanceSmoothing={0.25} height={900} />
          <Noise opacity={0.2} />
          <Vignette eskil={false} offset={0.1} darkness={1.1} />
        </EffectComposer> */}
        {/* <EffectComposer disableNormalPass multisampling={0}>
          <DepthOfField focusDistance={0.2} focalLength={1.2} bokehScale={0.5} height={180} />
          <Noise opacity={0.15} />
          <Vignette eskil={false} offset={0.13} darkness={0.7} />
          <DotScreen
            blendFunction={BlendFunction.LUMINOSITY} // blend mode
            angle={Math.PI * 0.5} // angle of the dot pattern
            scale={1.4} // scale of the dot pattern
          />
        </EffectComposer> */}
        {/* <EffectComposer>
          <Vignette eskil={false} offset={0.2} darkness={0.9} />
          <DepthOfField target={[0, 0, -2.5]} focusRange={0.05} bokehScale={30} />
        </EffectComposer> */}
      </Canvas>
    </div>
  )
}
