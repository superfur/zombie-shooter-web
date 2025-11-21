import * as THREE from 'three';
import { Player } from './Player';
import { Enemy } from './Enemy';
import { SoundManager } from './SoundManager';
import { ModelFactory } from './ModelFactory';

export class Game {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  player: Player;
  enemies: Enemy[] = [];
  walls: THREE.Box3[] = [];
  wallMeshes: THREE.Mesh[] = [];
  
  soundManager: SoundManager;
  
  lastTime: number = 0;
  score: number = 0;
  isRunning: boolean = false;
  
  readonly ZOMBIE_SPAWN_RATE = 3000; 
  lastSpawnTime = 0;

  raycaster: THREE.Raycaster;

  constructor() {
    this.soundManager = new SoundManager();
    this.raycaster = new THREE.Raycaster();

    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x111111);
    this.scene.fog = new THREE.FogExp2(0x111111, 0.02);

    this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.body.appendChild(this.renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    this.scene.add(ambientLight);

    const dirLight = new THREE.DirectionalLight(0xffffff, 1);
    dirLight.position.set(20, 30, 10);
    dirLight.castShadow = true;
    dirLight.shadow.mapSize.width = 2048;
    dirLight.shadow.mapSize.height = 2048;
    dirLight.shadow.camera.top = 50;
    dirLight.shadow.camera.bottom = -50;
    dirLight.shadow.camera.left = -50;
    dirLight.shadow.camera.right = 50;
    this.scene.add(dirLight);

    const floorGeometry = new THREE.PlaneGeometry(200, 200);
    const floorMaterial = new THREE.MeshStandardMaterial({ 
      color: 0x333333,
      roughness: 0.8,
    });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);
    
    const gridHelper = new THREE.GridHelper(200, 50, 0x444444, 0x222222);
    this.scene.add(gridHelper);

    this.generateMap();

    this.player = new Player(this.camera, this.scene, this.soundManager);

    window.addEventListener('resize', this.onWindowResize.bind(this));
  }

  generateMap() {
    for (let i = 0; i < 40; i++) {
      const size = 2 + Math.random() * 2;
      const x = (Math.random() - 0.5) * 100;
      const z = (Math.random() - 0.5) * 100;
      
      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue;

      const crate = ModelFactory.createCrate(size);
      crate.position.set(x, size / 2, z);
      crate.name = 'crate'; 
      
      this.scene.add(crate);
      this.wallMeshes.push(crate);

      const box = new THREE.Box3().setFromObject(crate);
      this.walls.push(box);
    }
  }

  start() {
    this.player.lockControls();
    this.isRunning = true;
    this.lastTime = performance.now();
    this.soundManager.resume();
    this.animate();
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }

  spawnEnemy() {
    let x, z;
    let validPosition = false;
    let attempts = 0;

    while (!validPosition && attempts < 10) {
        const angle = Math.random() * Math.PI * 2;
        const distance = 20 + Math.random() * 20;
        x = Math.sin(angle) * distance + this.player.position.x;
        z = Math.cos(angle) * distance + this.player.position.z;
        
        const spawnPoint = new THREE.Vector3(x, 1, z);
        let inWall = false;
        for (const wall of this.walls) {
            if (wall.containsPoint(spawnPoint)) {
                inWall = true;
                break;
            }
        }
        if (!inWall) validPosition = true;
        attempts++;
    }

    if (validPosition) {
        const enemy = new Enemy(new THREE.Vector3(x, 0, z), this.scene);
        // 注入 SoundManager
        enemy.setSoundManager(this.soundManager);
        this.enemies.push(enemy);
    }
  }

  checkCollisions() {
    const bullets = this.player.bullets;
    
    // 1. 子弹射线检测
    let hitTargets: THREE.Object3D[] = [];
    this.enemies.forEach(e => {
        if (!e.isDead) hitTargets.push(...e.mesh.children);
    });
    hitTargets.push(...this.wallMeshes);

    if (hitTargets.length > 0) {
        for (let j = bullets.length - 1; j >= 0; j--) {
            const bullet = bullets[j];
            const startPoint = bullet.prevPosition;
            const endPoint = bullet.mesh.position;
            const direction = endPoint.clone().sub(startPoint).normalize();
            const distance = startPoint.distanceTo(endPoint);

            if (distance === 0) continue;

            this.raycaster.set(startPoint, direction);
            this.raycaster.far = distance; 

            const intersects = this.raycaster.intersectObjects(hitTargets, false);

            if (intersects.length > 0) {
                const hit = intersects[0];
                const object = hit.object;

                this.createHitEffect(hit.point, object.name === 'head' ? 0xffff00 : 0xff0000);

                const enemy = this.enemies.find(e => e.mesh.children.includes(object as THREE.Mesh));
                
                if (enemy) {
                    const { damage, isCritical } = enemy.hit(object.name, bullet.damage);
                    
                    this.showDamageText(hit.point, damage, isCritical);

                    if (isCritical) {
                        this.soundManager.playHeadshot();
                    }

                    if (enemy.isDead) {
                        this.soundManager.playEnemyDeath();
                        enemy.dispose();
                        const idx = this.enemies.indexOf(enemy);
                        if (idx > -1) this.enemies.splice(idx, 1);
                        this.score++;
                        this.updateUI();
                    }
                }

                this.player.removeBullet(j);
            }
        }
    }
    
    // 敌人对玩家的伤害逻辑已经移交给 Enemy.update 返回值，这里不需要再做距离判断扣血了
  }

  createHitEffect(position: THREE.Vector3, color: number) {
      const geometry = new THREE.BufferGeometry();
      const vertices = [];
      for(let i=0; i<5; i++) {
          vertices.push(0,0,0);
      }
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      const material = new THREE.PointsMaterial({ color: color, size: 0.2 });
      const points = new THREE.Points(geometry, material);
      points.position.copy(position);
      this.scene.add(points);

      const dirs: THREE.Vector3[] = [];
      for(let i=0; i<5; i++) {
          dirs.push(new THREE.Vector3(Math.random()-0.5, Math.random()-0.5, Math.random()-0.5).normalize());
      }

      let frame = 0;
      const animate = () => {
          if(frame > 10) {
              this.scene.remove(points);
              geometry.dispose();
              material.dispose();
              return;
          }
          const positions = points.geometry.attributes.position.array as Float32Array;
          for(let i=0; i<5; i++) {
              positions[i*3] += dirs[i].x * 0.1;
              positions[i*3+1] += dirs[i].y * 0.1;
              positions[i*3+2] += dirs[i].z * 0.1;
          }
          points.geometry.attributes.position.needsUpdate = true;
          frame++;
          requestAnimationFrame(animate);
      };
      animate();
  }

  showDamageText(position: THREE.Vector3, damage: number, isCrit: boolean) {
      const div = document.createElement('div');
      div.className = 'damage-text' + (isCrit ? ' damage-crit' : '');
      div.innerText = isCrit ? 'HEADSHOT!' : `-${damage}`;
      document.body.appendChild(div);

      const updatePos = () => {
          if (!div.isConnected) return;
          const screenPos = position.clone().project(this.camera);
          const x = (screenPos.x * .5 + .5) * window.innerWidth;
          const y = (-(screenPos.y * .5) + .5) * window.innerHeight;
          div.style.left = `${x}px`;
          div.style.top = `${y}px`;
          requestAnimationFrame(updatePos);
      };
      updatePos();

      setTimeout(() => div.remove(), 1000);
  }

  updateUI() {
    const scoreEl = document.getElementById('score');
    const healthEl = document.getElementById('health');
    if (scoreEl) scoreEl.innerText = this.score.toString();
    if (healthEl) healthEl.innerText = Math.floor(this.player.health).toString();
  }

  gameOver() {
    this.isRunning = false;
    this.player.unlockControls();
    const gameOverEl = document.getElementById('game-over');
    if (gameOverEl) gameOverEl.style.display = 'flex';
  }

  animate() {
    if (!this.isRunning) return;

    const time = performance.now();
    const delta = (time - this.lastTime) / 1000;
    this.lastTime = time;

    this.player.update(delta, this.scene, this.walls, this.enemies);

    if (time - this.lastSpawnTime > this.ZOMBIE_SPAWN_RATE) {
      this.spawnEnemy();
      this.lastSpawnTime = time;
    }

    // 更新敌人并获取伤害
    this.enemies.forEach(enemy => {
      const damage = enemy.update(delta, this.player.position, this.walls);
      if (damage > 0) {
          this.player.takeDamage(damage);
          this.updateUI();
          if (this.player.health <= 0) {
              this.gameOver();
          }
      }
    });

    this.checkCollisions();

    this.renderer.render(this.scene, this.camera);
    requestAnimationFrame(this.animate.bind(this));
  }
}
