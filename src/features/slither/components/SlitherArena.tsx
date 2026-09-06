'use client'

import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js'
import {
  SLITHER_ARENA_RADIUS,
  SLITHER_BASE_SPEED,
  SLITHER_BOOST_DRAIN,
  SLITHER_BOOST_MIN_SCORE,
  SLITHER_BOOST_SPEED,
  SLITHER_BOT_RESPAWN_MS,
  SLITHER_DROP_MAX,
  SLITHER_DROP_MIN,
  SLITHER_EAT_RADIUS,
  SLITHER_FRAME_INTERVAL,
  SLITHER_NETWORK_SPACING,
  SLITHER_SAMPLE_COUNT,
  SLITHER_SEGMENT_SPACING,
  SLITHER_SKINS,
  SLITHER_TURN_RATE,
  getSlitherBotName,
  getSlitherBotTarget,
  getSlitherFood,
  getSlitherHit,
  getSlitherOutOfBounds,
  getSlitherRadius,
  getSlitherRandom,
  getSlitherRespawnFood,
  getSlitherSampled,
  getSlitherSegmentCount,
  getSlitherSkin,
  getSlitherSpawnPoint,
  getSlitherSteered,
} from '@/shared/lib/slitherEngine'
import type { MutableRefObject } from 'react'
import type { DataSlitherPlayer } from '../types/slitherTypes'
import type { SlitherControl } from './SlitherTouch'

export interface SlitherBoardRow {
  playerId: string
  name: string
  score: number
  alive: boolean
}

interface Props {
  isActive: boolean
  selfId: string
  selfName: string
  selfSkin: number
  seed: number
  botCount: number
  remotePlayers: DataSlitherPlayer[]
  respawnNonce: number
  controlRef: MutableRefObject<SlitherControl>
  onSubmitSlitherFrame: (frame: DataSlitherPlayer) => void
  onSubmitSlitherScore: (score: number) => void
  onSubmitSlitherDead: () => void
  onSubmitSlitherBoard: (rows: SlitherBoardRow[]) => void
}

const FOOD_RESPAWN_MS = 7000
const BOARD_INTERVAL = 500
// Sudut pandang hampir tegak lurus dari atas seperti permainan aslinya, hanya dimiringkan
// sedikit supaya tetap terasa tiga dimensi.
const CAMERA_OFFSET = new THREE.Vector3(0, 402, 58)
const BODY_Y = 13
// Jumlah titik tulang punggung yang dipakai untuk tabrakan dan pengiriman ke lawan.
const RINGS = 64
// Cincin tempat mata menempel, diambil dari geometri kepala yang sebenarnya.
const DISC_MAX = 340

export default function SlitherArena({
  isActive,
  selfId,
  selfName,
  selfSkin,
  seed,
  botCount,
  remotePlayers,
  respawnNonce,
  controlRef,
  onSubmitSlitherFrame,
  onSubmitSlitherScore,
  onSubmitSlitherDead,
  onSubmitSlitherBoard,
}: Props) {
  const mountRef = useRef<HTMLDivElement | null>(null)
  const frameRef = useRef({
    isActive,
    remotePlayers,
    selfName,
    onSubmitSlitherFrame,
    onSubmitSlitherScore,
    onSubmitSlitherDead,
    onSubmitSlitherBoard,
  })
  const sceneRef = useRef<{ start: () => void; stop: () => void; respawn: () => void } | null>(null)

  useEffect(() => {
    frameRef.current.remotePlayers = remotePlayers
    frameRef.current.selfName = selfName
    frameRef.current.onSubmitSlitherFrame = onSubmitSlitherFrame
    frameRef.current.onSubmitSlitherScore = onSubmitSlitherScore
    frameRef.current.onSubmitSlitherDead = onSubmitSlitherDead
    frameRef.current.onSubmitSlitherBoard = onSubmitSlitherBoard
  }, [
    remotePlayers,
    selfName,
    onSubmitSlitherFrame,
    onSubmitSlitherScore,
    onSubmitSlitherDead,
    onSubmitSlitherBoard,
  ])

  useEffect(() => {
    frameRef.current.isActive = isActive
    if (isActive) sceneRef.current?.start()
    else sceneRef.current?.stop()
  }, [isActive])

  useEffect(() => {
    if (respawnNonce > 0) sceneRef.current?.respawn()
  }, [respawnNonce])

  useEffect(() => {
    const mount = mountRef.current
    if (!mount) return

    // Corak dipilih pemain di lobi; nilainya ikut disiarkan sebagai `hue` supaya lawan
    // menggambar ular ini dengan corak yang sama.
    const selfHue = selfSkin
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
    renderer.setSize(mount.clientWidth || 1, mount.clientHeight || 1)
    renderer.outputColorSpace = THREE.SRGBColorSpace
    renderer.toneMapping = THREE.ACESFilmicToneMapping
    renderer.toneMappingExposure = 1.1
    mount.appendChild(renderer.domElement)

    const disposables: Array<THREE.BufferGeometry | THREE.Material | THREE.Texture> = []
    const scene = new THREE.Scene()
    scene.fog = new THREE.Fog(0x06060a, 620, 1450)

    const camera = new THREE.PerspectiveCamera(50, 1, 1, 4000)
    camera.position.copy(CAMERA_OFFSET)
    camera.lookAt(0, 0, 0)

    scene.add(new THREE.AmbientLight(0xffffff, 0.55))
    const keyLight = new THREE.DirectionalLight(0xfff1dd, 0.9)
    keyLight.position.set(160, 460, 220)
    scene.add(keyLight)
    const rimLight = new THREE.DirectionalLight(0x6a86ff, 0.45)
    rimLight.position.set(-260, 200, -240)
    scene.add(rimLight)

    const composer = new EffectComposer(renderer)
    composer.addPass(new RenderPass(scene, camera))
    const bloomPass = new UnrealBloomPass(new THREE.Vector2(1, 1), 0.62, 0.6, 0.9)
    composer.addPass(bloomPass)

    // Lantai bata gelap; ubinnya digambar sekali lalu diputar miring dan diulang menutupi arena.
    const makeBrickTexture = () => {
      const width = 128
      const height = 64
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const context = canvas.getContext('2d')
      if (context) {
        context.fillStyle = '#191c22'
        context.fillRect(0, 0, width, height)
        const drawBrick = (x: number, y: number) => {
          context.fillStyle = '#23272f'
          context.fillRect(x + 1.5, y + 1.5, width / 2 - 3, height / 2 - 3)
          context.strokeStyle = '#2b303a'
          context.lineWidth = 1
          context.strokeRect(x + 1.5, y + 1.5, width / 2 - 3, height / 2 - 3)
        }
        // Dua baris bata dengan pergeseran setengah supaya polanya bersambung saat diulang.
        drawBrick(0, 0)
        drawBrick(width / 2, 0)
        drawBrick(-width / 4, height / 2)
        drawBrick(width / 4, height / 2)
        drawBrick((width * 3) / 4, height / 2)
      }
      const texture = new THREE.CanvasTexture(canvas)
      texture.wrapS = THREE.RepeatWrapping
      texture.wrapT = THREE.RepeatWrapping
      texture.colorSpace = THREE.SRGBColorSpace
      texture.center.set(0.5, 0.5)
      texture.rotation = Math.PI / 4
      return texture
    }

    const groundRadius = SLITHER_ARENA_RADIUS + 140
    const brickTexture = makeBrickTexture()
    brickTexture.repeat.set((groundRadius * 2) / 118, (groundRadius * 2) / 59)
    const groundGeometry = new THREE.CircleGeometry(groundRadius, 96)
    const groundMaterial = new THREE.MeshBasicMaterial({ map: brickTexture })
    const ground = new THREE.Mesh(groundGeometry, groundMaterial)
    ground.rotation.x = -Math.PI / 2
    scene.add(ground)
    disposables.push(groundGeometry, groundMaterial, brickTexture)

    const ringGeometry = new THREE.TorusGeometry(SLITHER_ARENA_RADIUS, 8, 10, 180)
    const ringMaterial = new THREE.MeshBasicMaterial({ color: 0xff5233, toneMapped: false })
    const ring = new THREE.Mesh(ringGeometry, ringMaterial)
    ring.rotation.x = -Math.PI / 2
    ring.position.y = 6
    scene.add(ring)
    disposables.push(ringGeometry, ringMaterial)

    const dummy = new THREE.Object3D()

    // Aset jajanan dibangun sendiri dari bentuk dasar, warnanya dipanggang ke simpul supaya satu
    // benda tetap satu geometri dan bisa digambar massal lewat instans.
    const paint = (geometry: THREE.BufferGeometry, color: string) => {
      const total = geometry.attributes.position.count
      const colors = new Float32Array(total * 3)
      const shade = new THREE.Color(color)
      for (let index = 0; index < total; index += 1) {
        colors[index * 3] = shade.r
        colors[index * 3 + 1] = shade.g
        colors[index * 3 + 2] = shade.b
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      return geometry
    }

    // Gradasi atas-bawah dipanggang ke simpul: bagian atas kena cahaya, bawah lebih gelap.
    // Ini yang membuat buah terlihat berisi, bukan sekadar bola berwarna rata.
    const paintRipe = (geometry: THREE.BufferGeometry, top: string, bottom: string) => {
      geometry.computeBoundingBox()
      const box = geometry.boundingBox
      if (!box) return paint(geometry, top)
      const spread = Math.max(0.001, box.max.y - box.min.y)
      const total = geometry.attributes.position.count
      const position = geometry.attributes.position
      const colors = new Float32Array(total * 3)
      const light = new THREE.Color(top)
      const dark = new THREE.Color(bottom)
      const mix = new THREE.Color()
      for (let index = 0; index < total; index += 1) {
        const ratio = (position.getY(index) - box.min.y) / spread
        mix.copy(dark).lerp(light, ratio * ratio * 0.6 + ratio * 0.4)
        colors[index * 3] = mix.r
        colors[index * 3 + 1] = mix.g
        colors[index * 3 + 2] = mix.b
      }
      geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))
      return geometry
    }

    const makeStalk = (color: string, height: number) =>
      paint(new THREE.CylinderGeometry(0.34, 0.34, height, 6), color)

    const makeLeaf = (color: string, size: number) => {
      const leaf = paint(new THREE.SphereGeometry(size, 8, 6), color)
      leaf.scale(1, 0.22, 0.5)
      return leaf
    }

    const makeApple = () => {
      const body = paintRipe(new THREE.SphereGeometry(4.1, 22, 18), '#f0584a', '#9c1f1a')
      body.scale(1, 0.96, 1)
      // Cekungan kecil di pangkal tangkai.
      const dimple = paintRipe(new THREE.SphereGeometry(1.5, 12, 8), '#8f1c18', '#8f1c18').translate(0, 3.7, 0)
      const stalk = makeStalk('#6b4a2a', 2.6).translate(0, 4.4, 0)
      const leaf = makeLeaf('#4fa83c', 2.1).translate(1.6, 4.6, 0)
      return mergeGeometries([body, dimple, stalk, leaf], false)
    }

    const makeOrange = () => {
      const body = paintRipe(new THREE.SphereGeometry(4.2, 22, 18), '#ffb03a', '#c25c08')
      const dimple = paintRipe(new THREE.SphereGeometry(1.2, 10, 8), '#b35408', '#b35408').translate(0, 3.9, 0)
      const stalk = makeStalk('#5d4022', 1.2).translate(0, 4.3, 0)
      const leaf = makeLeaf('#3f9b34', 2.2).translate(1.3, 4.4, 0)
      return mergeGeometries([body, dimple, stalk, leaf], false)
    }

    const makeStrawberry = () => {
      // Kerucut membulat: lebar di atas, meruncing ke bawah.
      const body = paintRipe(new THREE.SphereGeometry(3.9, 20, 16), '#f2445c', '#94101f')
      body.scale(1, 1.2, 1)
      body.translate(0, -0.6, 0)
      const parts = [body]
      // Biji-biji kuning di permukaan.
      for (let index = 0; index < 12; index += 1) {
        const angle = ((Math.PI * 2) / 6) * index + (index % 2) * 0.5
        const level = -2.4 + Math.floor(index / 6) * 2.5
        const spread = 3.5 - Math.abs(level) * 0.28
        const seed = paint(new THREE.SphereGeometry(0.34, 6, 5), '#f7e08a')
        seed.translate(Math.cos(angle) * spread, level, Math.sin(angle) * spread)
        parts.push(seed)
      }
      for (let index = 0; index < 5; index += 1) {
        const angle = ((Math.PI * 2) / 5) * index
        parts.push(makeLeaf('#46a336', 2.4).translate(Math.cos(angle) * 1.8, 3.4, Math.sin(angle) * 1.8))
      }
      parts.push(makeStalk('#4f7a2a', 1.8).translate(0, 4.4, 0))
      return mergeGeometries(parts, false)
    }

    const makeCarrot = () => {
      const body = paintRipe(new THREE.ConeGeometry(2.5, 9, 16), '#ff9236', '#c2530c')
      body.rotateX(Math.PI)
      body.translate(0, 0.4, 0)
      const parts = [body]
      // Alur melintang khas wortel.
      for (let index = 0; index < 3; index += 1) {
        const level = 2.4 - index * 2.2
        const groove = paint(new THREE.TorusGeometry(1.9 - index * 0.42, 0.18, 6, 14), '#d4650f')
        groove.rotateX(Math.PI / 2)
        groove.translate(0, level, 0)
        parts.push(groove)
      }
      for (let index = 0; index < 3; index += 1) {
        const leaf = makeLeaf('#41a334', 2.7)
        leaf.rotateZ((index - 1) * 0.45)
        leaf.translate((index - 1) * 1.4, 5.4, 0)
        parts.push(leaf)
      }
      return mergeGeometries(parts, false)
    }

    const makeGrape = () => {
      const parts: THREE.BufferGeometry[] = []
      const spots = [
        [0, 1.4, 0, 2.2],
        [2.1, 0.2, 0.6, 2],
        [-2.1, 0.2, -0.6, 2],
        [0.6, -0.4, 2, 1.9],
        [-0.8, -0.5, -1.9, 1.9],
        [1.3, -2.2, 0.8, 1.9],
        [-1.3, -2.3, -0.8, 1.8],
        [0, -2.6, 1.5, 1.7],
        [0, -4.4, 0, 1.7],
      ]
      spots.forEach(([x, y, z, size]) => {
        parts.push(paintRipe(new THREE.SphereGeometry(size, 12, 10), '#a86fdb', '#4e2270').translate(x, y + 1.4, z))
      })
      parts.push(makeStalk('#5d7a2a', 2.2).translate(0, 4.8, 0))
      parts.push(makeLeaf('#4c8f2e', 2.4).translate(1.5, 5.2, 0))
      return mergeGeometries(parts, false)
    }

    const makeBanana = () => {
      const parts: THREE.BufferGeometry[] = []
      // Lengkung pisang dibentuk dari beberapa bola yang mengikuti busur, meruncing di ujung.
      for (let index = 0; index < 11; index += 1) {
        const t = index / 10
        const angle = -0.95 + t * 1.9
        const size = 1.85 * Math.sin(Math.PI * (0.22 + t * 0.56))
        const chunk = paintRipe(new THREE.SphereGeometry(Math.max(0.35, size), 12, 10), '#ffe14f', '#c99516')
        chunk.translate(Math.sin(angle) * 5.4, Math.cos(angle) * 5.4 - 4.4, 0)
        parts.push(chunk)
      }
      const tipAngle = -0.95
      parts.push(
        paint(new THREE.SphereGeometry(0.7, 8, 6), '#5b4718').translate(
          Math.sin(tipAngle) * 5.4,
          Math.cos(tipAngle) * 5.4 - 4.4,
          0,
        ),
      )
      return mergeGeometries(parts, false)
    }

    const makeEggplant = () => {
      const body = paintRipe(new THREE.SphereGeometry(3.5, 20, 16), '#9a5ccc', '#3d1a5c')
      body.scale(1, 1.4, 1)
      const parts = [body]
      for (let index = 0; index < 5; index += 1) {
        const angle = ((Math.PI * 2) / 5) * index
        parts.push(makeLeaf('#3f8f36', 2.4).translate(Math.cos(angle) * 1.6, 4.1, Math.sin(angle) * 1.6))
      }
      parts.push(makeStalk('#3f8f36', 2.2).translate(0, 5.4, 0))
      return mergeGeometries(parts, false)
    }

    const makeCorn = () => {
      const body = paintRipe(new THREE.CylinderGeometry(2.2, 1.6, 8.6, 16), '#ffe14f', '#c08f16')
      const parts = [body]
      // Butir jagung: cincin bola kecil berlapis.
      for (let row = 0; row < 5; row += 1) {
        for (let index = 0; index < 8; index += 1) {
          const angle = ((Math.PI * 2) / 8) * index + (row % 2) * 0.39
          const level = 3 - row * 1.55
          const spread = 2.1 - row * 0.11
          const kernel = paint(new THREE.SphereGeometry(0.52, 6, 5), '#ffd93a')
          kernel.translate(Math.cos(angle) * spread, level, Math.sin(angle) * spread)
          parts.push(kernel)
        }
      }
      for (let index = 0; index < 3; index += 1) {
        const angle = ((Math.PI * 2) / 3) * index
        const husk = paintRipe(new THREE.SphereGeometry(2.6, 10, 8), '#67c24a', '#2f7a26')
        husk.scale(0.42, 1.3, 0.42)
        husk.translate(Math.cos(angle) * 2, -1.8, Math.sin(angle) * 2)
        parts.push(husk)
      }
      return mergeGeometries(parts, false)
    }

    const makeTomato = () => {
      const body = paintRipe(new THREE.SphereGeometry(4, 22, 18), '#f2564a', '#98170f')
      body.scale(1, 0.84, 1)
      const parts = [body]
      for (let index = 0; index < 6; index += 1) {
        const angle = ((Math.PI * 2) / 6) * index
        parts.push(makeLeaf('#3f9b34', 2.2).translate(Math.cos(angle) * 1.7, 3.2, Math.sin(angle) * 1.7))
      }
      parts.push(makeStalk('#3f7a2a', 1.2).translate(0, 3.9, 0))
      return mergeGeometries(parts, false)
    }

    const makeDonut = () => {
      const dough = paintRipe(new THREE.TorusGeometry(3.3, 1.75, 12, 24), '#dfa262', '#8a5423').rotateX(
        -Math.PI / 2,
      )
      const glaze = paintRipe(new THREE.TorusGeometry(3.3, 1.68, 12, 24), '#ff8cc2', '#c4407f')
      glaze.rotateX(-Math.PI / 2)
      glaze.scale(1, 0.68, 1)
      glaze.translate(0, 0.85, 0)
      const parts = [dough, glaze]
      const sprinkleColors = ['#ffffff', '#f2d43c', '#4fd6c4', '#ffffff', '#8b4fc4', '#f2d43c', '#5ec26a', '#4aa3e0']
      for (let index = 0; index < 8; index += 1) {
        const angle = ((Math.PI * 2) / 8) * index + 0.3
        const sprinkle = paint(new THREE.BoxGeometry(1.2, 0.36, 0.36), sprinkleColors[index])
        sprinkle.rotateY(angle * 1.9)
        sprinkle.translate(Math.cos(angle) * 3.3, 1.6, Math.sin(angle) * 3.3)
        parts.push(sprinkle)
      }
      return mergeGeometries(parts, false)
    }

    const junkGeometries = [
      makeApple(),
      makeOrange(),
      makeStrawberry(),
      makeCarrot(),
      makeGrape(),
      makeBanana(),
      makeEggplant(),
      makeCorn(),
      makeTomato(),
      makeDonut(),
    ]
    const foodMaterial = new THREE.MeshStandardMaterial({
      vertexColors: true,
      roughness: 0.62,
      metalness: 0.04,
    })
    disposables.push(foodMaterial, ...junkGeometries)

    const foodField = getSlitherFood(seed).map((food) => ({ ...food, active: true, readyAt: 0 }))
    const foodRandom = getSlitherRandom((seed ^ 0x9e3779b9) >>> 0)
    // Tiap jenis jajanan punya wadah instans sendiri, isinya dipetakan sekali di awal.
    const foodSlots: number[][] = junkGeometries.map(() => [])
    foodField.forEach((food, index) => foodSlots[food.kind].push(index))
    const foodMeshes = junkGeometries.map((geometry, kind) => {
      const mesh = new THREE.InstancedMesh(geometry, foodMaterial, Math.max(1, foodSlots[kind].length))
      mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
      mesh.count = foodSlots[kind].length
      mesh.frustumCulled = false
      scene.add(mesh)
      return mesh
    })

    const syncFood = (now: number) => {
      for (let kind = 0; kind < foodMeshes.length; kind += 1) {
        const slots = foodSlots[kind]
        const mesh = foodMeshes[kind]
        for (let slot = 0; slot < slots.length; slot += 1) {
          const food = foodField[slots[slot]]
          if (food.active) {
            dummy.position.set(food.x, 9, food.y)
            dummy.rotation.set(0.3, food.spin + now * 0.0006, 0)
            dummy.scale.setScalar(1.75)
          } else {
            dummy.position.set(food.x, -80, food.y)
            dummy.rotation.set(0, 0, 0)
            dummy.scale.setScalar(0.001)
          }
          dummy.updateMatrix()
          mesh.setMatrixAt(slot, dummy.matrix)
        }
        mesh.instanceMatrix.needsUpdate = true
      }
    }
    syncFood(0)

    const makeLabel = (text: string) => {
      const canvas = document.createElement('canvas')
      canvas.width = 256
      canvas.height = 64
      const drawLabel = (value: string) => {
        const context = canvas.getContext('2d')
        if (!context) return
        context.clearRect(0, 0, 256, 64)
        context.font = 'bold 30px sans-serif'
        context.textAlign = 'center'
        context.textBaseline = 'middle'
        context.fillStyle = '#e8e3d6'
        context.fillText(value.slice(0, 14), 128, 34)
      }
      drawLabel(text)
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        depthTest: false,
        opacity: 0.8,
      })
      const sprite = new THREE.Sprite(material)
      sprite.scale.set(96, 24, 1)
      return { sprite, texture, material, drawLabel }
    }

    // Wajah digambar sebagai stiker datar di atas kepala — mata bergaris tepi, pupil dengan
    // kilau, dan garis muka — persis seperti gambar acuan.
    const makeFaceTexture = () => {
      const size = 128
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      if (context) {
        // Sisi atas kanvas menghadap ke arah moncong.
        context.strokeStyle = '#15151b'
        context.lineWidth = 2.6
        context.lineCap = 'round'
        context.beginPath()
        context.moveTo(64, 32)
        context.quadraticCurveTo(61, 46, 64, 60)
        context.stroke()
        context.beginPath()
        context.arc(64, 62, 7, Math.PI * 0.15, Math.PI * 0.85)
        context.stroke()

        const drawEye = (centerX: number, centerY: number) => {
          context.fillStyle = '#15151b'
          context.beginPath()
          context.ellipse(centerX, centerY, 16, 17.5, 0, 0, Math.PI * 2)
          context.fill()
          context.fillStyle = '#ffffff'
          context.beginPath()
          context.ellipse(centerX, centerY, 12.5, 14, 0, 0, Math.PI * 2)
          context.fill()
          context.fillStyle = '#15151b'
          context.beginPath()
          context.ellipse(centerX, centerY - 1.5, 6.6, 7.6, 0, 0, Math.PI * 2)
          context.fill()
          context.fillStyle = '#ffffff'
          context.beginPath()
          context.arc(centerX - 2.4, centerY - 5, 2.4, 0, Math.PI * 2)
          context.fill()
        }
        drawEye(47, 56)
        drawEye(81, 56)
      }
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4
      return texture
    }

    const faceGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
    const faceTexture = makeFaceTexture()
    const faceMaterial = new THREE.MeshBasicMaterial({
      map: faceTexture,
      transparent: true,
      depthWrite: false,
      toneMapped: false,
    })
    disposables.push(faceGeometry, faceTexture, faceMaterial)

    // Badan digambar sebagai deretan cakram bundar yang saling menumpuk — sama persis dengan
    // pratinjau di lobi. Tiap cakram punya lingkaran gelap sedikit lebih besar di belakangnya
    // sebagai garis tepi, sehingga tiap ruas tetap terlihat batasnya.
    const makeDiscTexture = () => {
      const size = 128
      const canvas = document.createElement('canvas')
      canvas.width = size
      canvas.height = size
      const context = canvas.getContext('2d')
      if (context) {
        context.fillStyle = '#ffffff'
        context.beginPath()
        context.arc(size / 2, size / 2, size / 2 - 3, 0, Math.PI * 2)
        context.fill()
      }
      const texture = new THREE.CanvasTexture(canvas)
      texture.colorSpace = THREE.SRGBColorSpace
      texture.anisotropy = 4
      return texture
    }

    const discGeometry = new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2)
    const discTexture = makeDiscTexture()
    disposables.push(discGeometry, discTexture)

    // Ekor mengecil di seperempat bagian terakhir, seperti pratinjau.
    const getDiscTaper = (t: number) => {
      if (t < 0.74) return 1
      const k = (t - 0.74) / 0.26
      return 1 - Math.pow(k, 1.4) * 0.72
    }

    interface SnakeView {
      fillMesh: THREE.InstancedMesh
      rimMesh: THREE.InstancedMesh
      fillMaterial: THREE.MeshBasicMaterial
      rimMaterial: THREE.MeshBasicMaterial
      parts: THREE.Mesh[]
      label: ReturnType<typeof makeLabel>
      draw: (line: number[][], radius: number, fade: number) => void
    }

    const makeSnakeView = (skinIndex: number, name: string): SnakeView => {
      const skin = getSlitherSkin(skinIndex)
      // Cakram isi diwarnai per instans supaya corak dua warna berselang-seling antar ruas.
      const fillMaterial = new THREE.MeshBasicMaterial({
        map: discTexture,
        alphaTest: 0.5,
        toneMapped: false,
      })
      const rimMaterial = new THREE.MeshBasicMaterial({
        map: discTexture,
        color: new THREE.Color(skin.band),
        alphaTest: 0.5,
        toneMapped: false,
      })
      const fillMesh = new THREE.InstancedMesh(discGeometry, fillMaterial, DISC_MAX)
      const rimMesh = new THREE.InstancedMesh(discGeometry, rimMaterial, DISC_MAX)
      ;[fillMesh, rimMesh].forEach((mesh) => {
        mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage)
        mesh.frustumCulled = false
        mesh.count = 0
        scene.add(mesh)
      })

      // Warna tiap ruas hanya bergantung pada nomor urutnya, jadi cukup disetel sekali.
      const tint = new THREE.Color()
      for (let index = 0; index < DISC_MAX; index += 1) {
        tint.set(skin.bands[index % skin.bands.length])
        fillMesh.setColorAt(index, tint)
      }
      if (fillMesh.instanceColor) fillMesh.instanceColor.needsUpdate = true

      const label = makeLabel(name)
      scene.add(label.sprite)

      const parts = [new THREE.Mesh(faceGeometry, faceMaterial)]
      parts.forEach((part) => {
        part.frustumCulled = false
        part.renderOrder = 2
        scene.add(part)
      })

      const draw = (line: number[][], radius: number, fade: number) => {
        if (line.length < 2) return
        const spacing = Math.max(3, radius * 1.02)
        let length = 0
        for (let index = 1; index < line.length; index += 1) {
          length += Math.hypot(line[index][0] - line[index - 1][0], line[index][1] - line[index - 1][1])
        }
        const count = Math.max(4, Math.min(DISC_MAX, Math.floor(length / spacing) + 1))
        const discs = getSlitherSampled(line, count, spacing)
        const total = discs.length
        if (!total) return

        for (let index = 0; index < total; index += 1) {
          const t = index / Math.max(1, total - 1)
          // Ruas yang lebih dekat kepala digambar lebih tinggi sehingga tumpukannya benar
          // tanpa perlu mengurutkan instans.
          const level = BODY_Y + (total - index) * 0.05
          const width = radius * 2.1 * getDiscTaper(t) * fade
          dummy.position.set(discs[index][0], level, discs[index][1])
          dummy.rotation.set(0, 0, 0)
          dummy.scale.setScalar(width * 1.13)
          dummy.updateMatrix()
          rimMesh.setMatrixAt(index, dummy.matrix)
          dummy.position.y = level + 0.025
          dummy.scale.setScalar(width)
          dummy.updateMatrix()
          fillMesh.setMatrixAt(index, dummy.matrix)
        }
        rimMesh.count = total
        fillMesh.count = total
        rimMesh.instanceMatrix.needsUpdate = true
        fillMesh.instanceMatrix.needsUpdate = true

        // Arah moncong diambil dari dua cakram terdepan, jadi wajah tidak mungkin melenceng.
        let noseX = discs[0][0] - discs[1][0]
        let noseZ = discs[0][1] - discs[1][1]
        const noseLength = Math.hypot(noseX, noseZ)
        if (noseLength > 0.0001) {
          noseX /= noseLength
          noseZ /= noseLength
        }

        const isVisible = fade > 0.05
        const face = parts[0]
        face.visible = isVisible
        face.position.set(discs[0][0], BODY_Y + (total + 2) * 0.05, discs[0][1])
        face.rotation.set(0, Math.atan2(-noseX, -noseZ), 0)
        face.scale.setScalar(radius * 1.9 * fade)

        label.sprite.position.set(discs[0][0], BODY_Y + 24, discs[0][1] - radius * 1.6)
        label.material.opacity = fade * 0.85
      }

      return { fillMesh, rimMesh, fillMaterial, rimMaterial, parts, label, draw }
    }

    const dropSnakeView = (view: SnakeView) => {
      scene.remove(view.fillMesh)
      scene.remove(view.rimMesh)
      scene.remove(view.label.sprite)
      view.parts.forEach((part) => scene.remove(part))
      view.fillMesh.dispose()
      view.rimMesh.dispose()
      view.fillMaterial.dispose()
      view.rimMaterial.dispose()
      view.label.texture.dispose()
      view.label.material.dispose()
    }

    // Tulang punggung dipakai untuk uji tabrakan dan dikirim ke lawan; gambar cakram punya
    // pencuplikannya sendiri di dalam draw().
    const getSpine = (path: number[][], score: number) => {
      const bodyLength = getSlitherSegmentCount(score) * SLITHER_SEGMENT_SPACING
      return getSlitherSampled(path, RINGS, bodyLength / (RINGS - 1))
    }

    const seededPath = (x: number, y: number, angle: number) => {
      const path: number[][] = []
      for (let index = 0; index < 40; index += 1) {
        path.push([x - Math.cos(angle) * index * 2, y - Math.sin(angle) * index * 2])
      }
      return path
    }

    // Ular sendiri
    const selfView = makeSnakeView(selfHue, selfName)
    const self = {
      x: 0,
      y: 0,
      angle: 0,
      targetAngle: 0,
      score: 0,
      alive: true,
      boosting: false,
      fade: 1,
      path: [] as number[][],
      segments: [] as number[][],
      lastScoreSent: -1,
    }
    const resetSelf = () => {
      const spawn = getSlitherSpawnPoint(getSlitherRandom((seed ^ Date.now()) >>> 0))
      self.x = spawn.x
      self.y = spawn.y
      self.angle = Math.random() * Math.PI * 2
      self.targetAngle = self.angle
      self.score = 0
      self.alive = true
      self.boosting = false
      self.fade = 1
      self.lastScoreSent = -1
      self.path = seededPath(self.x, self.y, self.angle)
    }
    resetSelf()

    // Ular komputer
    interface Bot {
      id: string
      name: string
      x: number
      y: number
      angle: number
      score: number
      alive: boolean
      fade: number
      wander: number
      respawnAt: number
      path: number[][]
      segments: number[][]
      view: SnakeView
    }
    const botRandom = getSlitherRandom((seed ^ 0x51ed270b) >>> 0)
    const bots: Bot[] = []
    for (let index = 0; index < botCount; index += 1) {
      const spawn = getSlitherSpawnPoint(botRandom)
      const angle = botRandom() * Math.PI * 2
      bots.push({
        id: `bot-${index}`,
        name: getSlitherBotName(index),
        x: spawn.x,
        y: spawn.y,
        angle,
        score: Math.floor(botRandom() * 14),
        alive: true,
        fade: 1,
        wander: 0,
        respawnAt: 0,
        path: seededPath(spawn.x, spawn.y, angle),
        segments: [],
        view: makeSnakeView(1 + Math.floor(botRandom() * (SLITHER_SKINS.length - 1)), getSlitherBotName(index)),
      })
    }
    const resetBot = (bot: Bot) => {
      const spawn = getSlitherSpawnPoint(botRandom)
      bot.x = spawn.x
      bot.y = spawn.y
      bot.angle = botRandom() * Math.PI * 2
      bot.score = Math.floor(botRandom() * 10)
      bot.alive = true
      bot.fade = 1
      bot.respawnAt = 0
      bot.path = seededPath(bot.x, bot.y, bot.angle)
    }

    // Lawan online
    interface RemoteView {
      view: SnakeView
      labelText: string
      wasAlive: boolean
      render: { x: number; y: number; angle: number; segments: number[][] }
    }
    const remotes = new Map<string, RemoteView>()

    // Kontrol arah
    const pointerPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0)
    const raycaster = new THREE.Raycaster()
    const pointer = new THREE.Vector2()
    const hitPoint = new THREE.Vector3()
    const updatePointerTarget = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect()
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1
      raycaster.setFromCamera(pointer, camera)
      if (!raycaster.ray.intersectPlane(pointerPlane, hitPoint)) return
      self.targetAngle = Math.atan2(hitPoint.z - self.y, hitPoint.x - self.x)
    }
    const startBoost = (event: PointerEvent) => {
      updatePointerTarget(event)
      self.boosting = true
    }
    const stopBoost = () => {
      self.boosting = false
    }
    renderer.domElement.addEventListener('pointermove', updatePointerTarget)
    renderer.domElement.addEventListener('pointerdown', startBoost)
    window.addEventListener('pointerup', stopBoost)
    renderer.domElement.addEventListener('pointerleave', stopBoost)

    const updateViewportSize = () => {
      const width = mount.clientWidth
      const height = mount.clientHeight
      if (!width || !height) return
      renderer.setSize(width, height)
      composer.setSize(width, height)
      bloomPass.setSize(width, height)
      camera.aspect = width / height
      camera.updateProjectionMatrix()
    }
    updateViewportSize()
    const resizeObserver = new ResizeObserver(updateViewportSize)
    resizeObserver.observe(mount)

    const cameraTarget = new THREE.Vector3(self.x, 0, self.y)

    const advanceSnake = (
      body: { x: number; y: number; angle: number; score: number; path: number[][] },
      speed: number,
      dt: number,
    ) => {
      body.x += Math.cos(body.angle) * speed * dt
      body.y += Math.sin(body.angle) * speed * dt
      // Jejak dibuat rapat supaya tulang punggung tabung tidak bersudut saat ular berbelok.
      const head = body.path[0]
      if (!head || Math.hypot(body.x - head[0], body.y - head[1]) >= 2.2) {
        body.path.unshift([body.x, body.y])
      } else {
        body.path[0] = [body.x, body.y]
      }
      const budget = (getSlitherSegmentCount(body.score) + 4) * SLITHER_SEGMENT_SPACING
      let travelled = 0
      let cut = body.path.length
      for (let index = 1; index < body.path.length; index += 1) {
        travelled += Math.hypot(
          body.path[index][0] - body.path[index - 1][0],
          body.path[index][1] - body.path[index - 1][1],
        )
        if (travelled > budget) {
          cut = index + 1
          break
        }
      }
      if (cut < body.path.length) body.path.length = cut
    }

    const eatFood = (x: number, y: number, now: number) => {
      let gained = 0
      for (let index = 0; index < foodField.length; index += 1) {
        const food = foodField[index]
        if (!food.active) continue
        const dx = x - food.x
        const dy = y - food.y
        if (dx * dx + dy * dy <= SLITHER_EAT_RADIUS * SLITHER_EAT_RADIUS) {
          food.active = false
          food.readyAt = now + FOOD_RESPAWN_MS
          gained += 1
        }
      }
      return gained
    }

    const respawnFood = (now: number) => {
      for (let index = 0; index < foodField.length; index += 1) {
        const food = foodField[index]
        if (food.active || now < food.readyAt) continue
        const spot = getSlitherRespawnFood(foodRandom)
        food.x = spot.x
        food.y = spot.y
        food.spin = spot.spin
        food.active = true
      }
    }

    // Ular yang mati luruh jadi makanan sepanjang bekas badannya. Butir yang dipakai diambil dari
    // stok yang sedang mati supaya jumlah makanan di arena tetap dan tidak perlu wadah baru.
    const dropFood = (segments: number[][], score: number) => {
      if (segments.length < 2) return
      const amount = Math.max(SLITHER_DROP_MIN, Math.min(SLITHER_DROP_MAX, Math.round(score * 0.7)))
      let dropped = 0
      for (let index = 0; index < foodField.length && dropped < amount; index += 1) {
        const food = foodField[index]
        if (food.active) continue
        const point = segments[Math.floor((dropped / amount) * (segments.length - 1))]
        food.x = point[0] + (foodRandom() - 0.5) * 26
        food.y = point[1] + (foodRandom() - 0.5) * 26
        food.spin = foodRandom() * Math.PI * 2
        food.active = true
        food.readyAt = 0
        dropped += 1
      }
    }

    const collectHazards = (skipBotId: string | null) => {
      const points: number[][] = []
      if (self.alive) {
        for (let index = 2; index < self.segments.length; index += 1) points.push(self.segments[index])
      }
      bots.forEach((bot) => {
        if (!bot.alive || bot.id === skipBotId) return
        for (let index = 0; index < bot.segments.length; index += 3) points.push(bot.segments[index])
      })
      frameRef.current.remotePlayers.forEach((rival) => {
        if (!rival.alive) return
        for (let index = 0; index < rival.segments.length; index += 3) points.push(rival.segments[index])
      })
      return points
    }

    const stepBots = (dt: number, now: number) => {
      const activeFood: number[][] = []
      for (let index = 0; index < foodField.length; index += 1) {
        if (foodField[index].active) activeFood.push([foodField[index].x, foodField[index].y])
      }
      bots.forEach((bot) => {
        if (!bot.alive) {
          bot.fade = Math.max(0, bot.fade - dt * 1.6)
          if (now >= bot.respawnAt) resetBot(bot)
        }
        if (bot.alive) {
          bot.wander += (Math.random() - 0.5) * 0.6 * dt
          bot.wander = Math.max(-1, Math.min(1, bot.wander))
          const hazards = collectHazards(bot.id)
          const target = getSlitherBotTarget(bot.x, bot.y, bot.angle, activeFood, hazards, bot.wander)
          bot.angle = getSlitherSteered(bot.angle, target, SLITHER_TURN_RATE * 0.75 * dt)
          const speed = SLITHER_BASE_SPEED * 0.94
          advanceSnake(bot, speed, dt)

          bot.score += eatFood(bot.x, bot.y, now)

          if (getSlitherOutOfBounds(bot.x, bot.y)) {
            bot.alive = false
            bot.respawnAt = now + SLITHER_BOT_RESPAWN_MS
          }
          if (bot.alive && self.alive && self.segments.length) {
            if (getSlitherHit(bot.x, bot.y, self.segments, getSlitherRadius(self.score) * 2)) {
              bot.alive = false
              bot.respawnAt = now + SLITHER_BOT_RESPAWN_MS
            }
          }
          for (let index = 0; index < bots.length && bot.alive; index += 1) {
            const other = bots[index]
            if (other.id === bot.id || !other.alive || !other.segments.length) continue
            if (getSlitherHit(bot.x, bot.y, other.segments, getSlitherRadius(other.score) * 1.9)) {
              bot.alive = false
              bot.respawnAt = now + SLITHER_BOT_RESPAWN_MS
            }
          }
          if (!bot.alive) dropFood(bot.segments, bot.score)
        }

        const spine = getSpine(bot.path, bot.score)
        bot.segments = spine
        bot.view.draw(bot.path, getSlitherRadius(bot.score), bot.alive ? 1 : bot.fade)
      })

      // Jajanan yang habis dimakan dimunculkan lagi setelah waktunya; matriksnya sendiri
      // disegarkan tiap frame di updateFrame karena benda-benda ini ikut berputar pelan.
      respawnFood(now)
    }

    const stepSelf = (dt: number, now: number) => {
      if (self.alive) {
        // Stik kiri di layar sentuh menimpa arah penunjuk; tombol kanan menyalakan sprint.
        const control = controlRef.current
        if (control.angle !== null) self.targetAngle = control.angle
        // Belok sedikit lebih berat saat ngebut supaya ngebut terasa punya risiko.
        const canBoost = (self.boosting || control.boost) && self.score > SLITHER_BOOST_MIN_SCORE
        const turnRate = SLITHER_TURN_RATE * (canBoost ? 0.78 : 1)
        self.angle = getSlitherSteered(self.angle, self.targetAngle, turnRate * dt)
        const speed = canBoost ? SLITHER_BOOST_SPEED : SLITHER_BASE_SPEED
        advanceSnake(self, speed, dt)
        if (canBoost) self.score = Math.max(0, self.score - SLITHER_BOOST_DRAIN * dt)

        self.score += eatFood(self.x, self.y, now)

        if (getSlitherOutOfBounds(self.x, self.y)) self.alive = false
        const selfRadius = getSlitherRadius(self.score)
        for (let index = 0; index < bots.length && self.alive; index += 1) {
          const bot = bots[index]
          if (!bot.alive || !bot.segments.length) continue
          if (getSlitherHit(self.x, self.y, bot.segments, selfRadius + getSlitherRadius(bot.score))) {
            self.alive = false
          }
        }
        const others = frameRef.current.remotePlayers
        for (let index = 0; index < others.length && self.alive; index += 1) {
          const rival = others[index]
          if (!rival.alive || !rival.segments?.length) continue
          if (getSlitherHit(self.x, self.y, rival.segments, selfRadius + getSlitherRadius(rival.score))) {
            self.alive = false
          }
        }
        if (!self.alive) {
          dropFood(self.segments, self.score)
          frameRef.current.onSubmitSlitherDead()
        }

        const rounded = Math.round(self.score)
        if (rounded !== self.lastScoreSent) {
          self.lastScoreSent = rounded
          frameRef.current.onSubmitSlitherScore(rounded)
        }
      } else if (self.fade > 0) {
        self.fade = Math.max(0, self.fade - dt * 1.6)
      }

      const spine = getSpine(self.path, self.score)
      self.segments = spine
      selfView.draw(self.path, getSlitherRadius(self.score), self.fade)
    }

    const stepRemotes = (dt: number) => {
      const incoming = frameRef.current.remotePlayers
      const seen = new Set<string>()
      const blend = Math.min(1, dt * 12)

      incoming.forEach((rival) => {
        seen.add(rival.playerId)
        let entry = remotes.get(rival.playerId)
        if (!entry) {
          entry = {
            view: makeSnakeView(rival.hue, rival.name),
            labelText: rival.name,
                  wasAlive: rival.alive,
            render: {
              x: rival.x,
              y: rival.y,
              angle: rival.angle,
              segments: rival.segments.map((point) => [point[0], point[1]]),
            },
          }
          remotes.set(rival.playerId, entry)
        }
        const view = entry
        // Lawan yang baru saja mati ikut luruh jadi makanan di layar ini.
        if (view.wasAlive && !rival.alive) dropFood(rival.segments, rival.score)
        view.wasAlive = rival.alive
        if (entry.labelText !== rival.name) {
          entry.labelText = rival.name
          entry.view.label.drawLabel(rival.name)
          entry.view.label.texture.needsUpdate = true
        }

        const render = entry.render
        render.x += (rival.x - render.x) * blend
        render.y += (rival.y - render.y) * blend
        render.angle = rival.angle
        if (render.segments.length !== rival.segments.length) {
          render.segments = rival.segments.map((point) => [point[0], point[1]])
        } else {
          for (let index = 0; index < render.segments.length; index += 1) {
            render.segments[index][0] += (rival.segments[index][0] - render.segments[index][0]) * blend
            render.segments[index][1] += (rival.segments[index][1] - render.segments[index][1]) * blend
          }
        }
        entry.view.draw(render.segments, getSlitherRadius(rival.score), rival.alive ? 1 : 0.25)
      })

      remotes.forEach((entry, id) => {
        if (!seen.has(id)) {
          dropSnakeView(entry.view)
          remotes.delete(id)
        }
      })
    }

    let networkAt = 0
    const sendFrame = (now: number) => {
      if (now - networkAt < SLITHER_FRAME_INTERVAL) return
      networkAt = now
      frameRef.current.onSubmitSlitherFrame({
        playerId: selfId,
        name: frameRef.current.selfName,
        hue: selfHue,
        x: self.x,
        y: self.y,
        angle: self.angle,
        score: Math.round(self.score),
        alive: self.alive,
        segments: getSlitherSampled(self.path, SLITHER_SAMPLE_COUNT, SLITHER_NETWORK_SPACING),
        ts: now,
      })
    }

    let boardAt = 0
    const sendBoard = (now: number) => {
      if (now - boardAt < BOARD_INTERVAL) return
      boardAt = now
      frameRef.current.onSubmitSlitherBoard([
        { playerId: selfId, name: frameRef.current.selfName, score: Math.round(self.score), alive: self.alive },
        ...bots.map((bot) => ({ playerId: bot.id, name: bot.name, score: bot.score, alive: bot.alive })),
        ...frameRef.current.remotePlayers.map((rival) => ({
          playerId: rival.playerId,
          name: rival.name,
          score: rival.score,
          alive: rival.alive,
        })),
      ])
    }

    let animationId = 0
    let lastAt = 0
    const updateFrame = () => {
      animationId = requestAnimationFrame(updateFrame)
      const now = performance.now()
      const dt = lastAt ? Math.min(0.05, (now - lastAt) / 1000) : 0.016
      lastAt = now

      stepBots(dt, now)
      stepSelf(dt, now)
      stepRemotes(dt)
      syncFood(now)
      sendFrame(now)
      sendBoard(now)

      cameraTarget.x += (self.x - cameraTarget.x) * Math.min(1, dt * 6)
      cameraTarget.z += (self.y - cameraTarget.z) * Math.min(1, dt * 6)
      camera.position.set(cameraTarget.x + CAMERA_OFFSET.x, CAMERA_OFFSET.y, cameraTarget.z + CAMERA_OFFSET.z)
      camera.lookAt(cameraTarget)

      composer.render()
    }

    const start = () => {
      if (animationId) return
      lastAt = 0
      updateFrame()
    }
    const stop = () => {
      if (!animationId) return
      cancelAnimationFrame(animationId)
      animationId = 0
    }

    sceneRef.current = { start, stop, respawn: resetSelf }
    if (frameRef.current.isActive) start()

    return () => {
      sceneRef.current = null
      cancelAnimationFrame(animationId)
      resizeObserver.disconnect()
      renderer.domElement.removeEventListener('pointermove', updatePointerTarget)
      renderer.domElement.removeEventListener('pointerdown', startBoost)
      window.removeEventListener('pointerup', stopBoost)
      renderer.domElement.removeEventListener('pointerleave', stopBoost)
      remotes.forEach((entry) => dropSnakeView(entry.view))
      remotes.clear()
      bots.forEach((bot) => dropSnakeView(bot.view))
      dropSnakeView(selfView)
      foodMeshes.forEach((mesh) => mesh.dispose())
      disposables.forEach((item) => item.dispose())
      bloomPass.dispose()
      composer.dispose()
      renderer.dispose()
      if (renderer.domElement.parentNode === mount) mount.removeChild(renderer.domElement)
    }
    // Adegan dibangun sekali; data lawan & callback dialirkan lewat frameRef.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selfId, selfSkin, seed, botCount])

  return <div ref={mountRef} className="h-full w-full touch-none" />
}
