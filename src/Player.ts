import * as THREE from 'three';
import { PointerLockControls } from 'three/addons/controls/PointerLockControls.js';
import { SoundManager } from './SoundManager';
import { ModelFactory } from './ModelFactory';
import { Enemy } from './Enemy';

class Bullet {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  isAlive: boolean = true;
  lifeTime: number = 2.0;
  prevPosition: THREE.Vector3;
  damage: number;

  constructor(position: THREE.Vector3, direction: THREE.Vector3, damage: number) {
    const geometry = new THREE.BoxGeometry(0.02, 0.02, 0.5);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffaa });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.copy(position);
    
    this.mesh.lookAt(position.clone().add(direction));
    this.velocity = direction.clone().multiplyScalar(120);
    this.prevPosition = position.clone();
    this.damage = damage;
  }

  update(delta: number) {
    this.prevPosition.copy(this.mesh.position);
    this.lifeTime -= delta;
    if (this.lifeTime <= 0) {
      this.isAlive = false;
    }
    const moveStep = this.velocity.clone().multiplyScalar(delta);
    this.mesh.position.add(moveStep);
  }
}

enum WeaponType {
  Rifle = 'rifle',
  Pistol = 'pistol',
  Knife = 'knife'
}

interface WeaponConfig {
  type: WeaponType;
  model: THREE.Group;
  damage: number; 
  fireRate: number; 
  isAutomatic: boolean;
  ammoClip: number;
  ammoTotal: number;
  currentClip: number;
  reloadTime: number;
  positionOffset: THREE.Vector3;
  scale: number;
}

export class Player {
  camera: THREE.Camera;
  cameraContainer: THREE.Group;
  controls: PointerLockControls;
  velocity: THREE.Vector3;
  direction: THREE.Vector3;
  
  moveForward: boolean = false;
  moveBackward: boolean = false;
  moveLeft: boolean = false;
  moveRight: boolean = false;
  canJump: boolean = false;
  isSprinting: boolean = false;

  bullets: Bullet[] = [];
  health: number = 100;

  soundManager: SoundManager;
  collider: THREE.Box3;

  weapons: Map<WeaponType, WeaponConfig> = new Map();
  currentWeaponType: WeaponType = WeaponType.Rifle;
  isReloading: boolean = false;
  reloadStartTime: number = 0;
  
  lastFireTime: number = 0;
  isFiring: boolean = false;
  isMeleeAttacking: boolean = false;
  meleeStartTime: number = 0;
  meleeType: 'light' | 'heavy' = 'light';

  gunBasePosition: THREE.Vector3 = new THREE.Vector3();
  gunBaseRotation: THREE.Euler = new THREE.Euler();

  recoilX: number = 0; 
  recoilY: number = 0; 
  targetRecoilX: number = 0; 
  targetRecoilY: number = 0; 

  // 移动端相关
  isMobile: boolean = false;
  touchLookSensitivity: number = 0.002;
  activeLookTouchId: number | null = null;
  lastTouchX: number = 0;
  lastTouchY: number = 0;
  
  joystickId: number | null = null;
  joystickOrigin: { x: number, y: number } = { x: 0, y: 0 };
  joystickMove: { x: number, y: number } = { x: 0, y: 0 }; // -1 to 1

  constructor(camera: THREE.Camera, scene: THREE.Scene, soundManager: SoundManager) {
    this.camera = camera;
    this.soundManager = soundManager;
    
    this.cameraContainer = new THREE.Group();
    this.cameraContainer.position.y = 1.6; 
    
    this.camera.position.set(0, 0, 0);
    this.camera.rotation.set(0, 0, 0);
    this.cameraContainer.add(this.camera);

    this.controls = new PointerLockControls(this.cameraContainer as any, document.body);

    this.velocity = new THREE.Vector3();
    this.direction = new THREE.Vector3();
    this.collider = new THREE.Box3();

    // 检测是否为移动端 (简单的宽度检测或Touch事件检测)
    this.checkIfMobile();

    this.initWeapons();
    this.initInput();
    if (this.isMobile) {
        this.initTouchControls();
    }
    
    scene.add(this.controls.getObject());
    
    this.updateWeaponUI();
    
    requestAnimationFrame(() => {
        const weapon = this.currentWeapon;
        if (weapon) {
            weapon.model.position.copy(weapon.positionOffset);
            weapon.model.rotation.set(0, 0, 0);
            this.gunBasePosition.copy(weapon.positionOffset);
            this.gunBaseRotation.set(0, 0, 0);
            weapon.model.updateMatrixWorld(true);
        }
    });
  }

  checkIfMobile() {
      const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
      const isSmallScreen = window.innerWidth <= 1024;
      this.isMobile = isSmallScreen || isTouch;
      
      if (this.isMobile) {
          console.log("Mobile mode activated");
          this.controls.unlock = () => {};
          this.controls.lock = () => {};
      }
  }

  initWeapons() {
      // 1. Rifle
      const rifleModel = ModelFactory.createGun();
      this.camera.add(rifleModel);
      rifleModel.visible = false;
      this.weapons.set(WeaponType.Rifle, {
          type: WeaponType.Rifle,
          model: rifleModel,
          damage: 10,
          fireRate: 100,
          isAutomatic: true,
          ammoClip: 30,
          ammoTotal: 120,
          currentClip: 30,
          reloadTime: 1500,
          positionOffset: new THREE.Vector3(0.3, -0.25, -0.5),
          scale: 0.5
      });

      // 2. Pistol
      const pistolModel = ModelFactory.createPistol();
      this.camera.add(pistolModel);
      pistolModel.visible = false;
      this.weapons.set(WeaponType.Pistol, {
          type: WeaponType.Pistol,
          model: pistolModel,
          damage: 15,
          fireRate: 200,
          isAutomatic: false,
          ammoClip: 12,
          ammoTotal: 48,
          currentClip: 12,
          reloadTime: 1000,
          positionOffset: new THREE.Vector3(0.2, -0.2, -0.4),
          scale: 0.5
      });

      // 3. Knife
      const knifeModel = ModelFactory.createKnife();
      this.camera.add(knifeModel);
      knifeModel.visible = false;
      this.weapons.set(WeaponType.Knife, {
          type: WeaponType.Knife,
          model: knifeModel,
          damage: 0, 
          fireRate: 500,
          isAutomatic: false,
          ammoClip: 0,
          ammoTotal: 0,
          currentClip: 0,
          reloadTime: 0,
          positionOffset: new THREE.Vector3(0.3, -0.3, -0.4),
          scale: 0.6
      });

      this.switchWeapon(WeaponType.Rifle);
  }

  get currentWeapon(): WeaponConfig {
      return this.weapons.get(this.currentWeaponType)!;
  }

  get position() {
    return this.controls.getObject().position;
  }

  initInput() {
    // PC 键盘输入
    const onKeyDown = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp': case 'KeyW': this.moveForward = true; break;
        case 'ArrowLeft': case 'KeyA': this.moveLeft = true; break;
        case 'ArrowDown': case 'KeyS': this.moveBackward = true; break;
        case 'ArrowRight': case 'KeyD': this.moveRight = true; break;
        case 'Space': if (this.canJump) { this.velocity.y += 10; this.canJump = false; } break;
        case 'ShiftLeft': case 'ShiftRight': this.isSprinting = true; break;
        case 'KeyR': this.reload(); break;
        case 'Digit1': this.switchWeapon(WeaponType.Rifle); break;
        case 'Digit2': this.switchWeapon(WeaponType.Pistol); break;
        case 'Digit3': this.switchWeapon(WeaponType.Knife); break;
      }
    };

    const onKeyUp = (event: KeyboardEvent) => {
      switch (event.code) {
        case 'ArrowUp': case 'KeyW': this.moveForward = false; break;
        case 'ArrowLeft': case 'KeyA': this.moveLeft = false; break;
        case 'ArrowDown': case 'KeyS': this.moveBackward = false; break;
        case 'ArrowRight': case 'KeyD': this.moveRight = false; break;
        case 'ShiftLeft': case 'ShiftRight': this.isSprinting = false; break;
      }
    };

    const onMouseDown = (event: MouseEvent) => {
        if (!this.isMobile && this.controls.isLocked) {
             if (this.currentWeaponType === WeaponType.Knife) {
                this.attack(event.button === 2 ? 'heavy' : 'light');
            } else {
                if (event.button === 0) this.isFiring = true;
            }
        }
    };

    const onMouseUp = (event: MouseEvent) => {
        if (!this.isMobile && event.button === 0) this.isFiring = false;
    };

    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mouseup', onMouseUp);
    document.addEventListener('contextmenu', e => e.preventDefault());
  }

  // --- 移动端触摸逻辑 ---
  initTouchControls() {
      const joystickZone = document.getElementById('joystick-zone');
      const joystickKnob = document.getElementById('joystick-knob');
      const lookZone = document.getElementById('touch-look-zone');
      const fireBtn = document.getElementById('fire-btn');
      const jumpBtn = document.getElementById('jump-btn');
      const reloadBtn = document.getElementById('reload-btn');
      const switchBtn = document.getElementById('switch-btn');

      // 1. 摇杆逻辑
      if (joystickZone && joystickKnob) {
          const rect = joystickZone.getBoundingClientRect();
          const center = { x: rect.left + rect.width/2, y: rect.top + rect.height/2 };
          const maxRadius = rect.width / 2;

          joystickZone.addEventListener('touchstart', (e) => {
              e.preventDefault();
              const touch = e.changedTouches[0];
              this.joystickId = touch.identifier;
              this.updateJoystick(touch.clientX, touch.clientY, center, maxRadius, joystickKnob);
          });

          joystickZone.addEventListener('touchmove', (e) => {
              e.preventDefault();
              for (let i=0; i<e.changedTouches.length; i++) {
                  if (e.changedTouches[i].identifier === this.joystickId) {
                      const touch = e.changedTouches[i];
                      this.updateJoystick(touch.clientX, touch.clientY, center, maxRadius, joystickKnob);
                  }
              }
          });

          const endJoystick = (e: TouchEvent) => {
              e.preventDefault();
              for (let i=0; i<e.changedTouches.length; i++) {
                  if (e.changedTouches[i].identifier === this.joystickId) {
                      this.joystickId = null;
                      this.joystickMove = { x: 0, y: 0 };
                      joystickKnob.style.transform = `translate(-50%, -50%)`;
                      
                      this.moveForward = false;
                      this.moveBackward = false;
                      this.moveLeft = false;
                      this.moveRight = false;
                  }
              }
          };
          joystickZone.addEventListener('touchend', endJoystick);
          joystickZone.addEventListener('touchcancel', endJoystick);
      }

      // 2. 视角控制逻辑
      if (lookZone) {
          lookZone.addEventListener('touchstart', (e) => {
              e.preventDefault();
              if (this.activeLookTouchId === null) {
                  const touch = e.changedTouches[0];
                  this.activeLookTouchId = touch.identifier;
                  this.lastTouchX = touch.clientX;
                  this.lastTouchY = touch.clientY;
              }
          });

          lookZone.addEventListener('touchmove', (e) => {
              e.preventDefault();
              for (let i=0; i<e.changedTouches.length; i++) {
                  if (e.changedTouches[i].identifier === this.activeLookTouchId) {
                      const touch = e.changedTouches[i];
                      const dx = touch.clientX - this.lastTouchX;
                      const dy = touch.clientY - this.lastTouchY;
                      
                      // 左右旋转 (Yaw) - 控制 Container
                      this.controls.getObject().rotation.y -= dx * this.touchLookSensitivity;
                      
                      // 上下旋转 (Pitch) - 控制 Container
                      this.cameraContainer.rotation.x -= dy * this.touchLookSensitivity;
                      this.cameraContainer.rotation.x = Math.max(-Math.PI/2 + 0.1, Math.min(Math.PI/2 - 0.1, this.cameraContainer.rotation.x));

                      this.lastTouchX = touch.clientX;
                      this.lastTouchY = touch.clientY;
                  }
              }
          });

          const endLook = (e: TouchEvent) => {
              e.preventDefault();
              for (let i=0; i<e.changedTouches.length; i++) {
                  if (e.changedTouches[i].identifier === this.activeLookTouchId) {
                      this.activeLookTouchId = null;
                  }
              }
          };
          lookZone.addEventListener('touchend', endLook);
          lookZone.addEventListener('touchcancel', endLook);
      }

      // 3. 按钮逻辑
      if (fireBtn) {
          fireBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.isFiring = true; if(this.currentWeaponType===WeaponType.Knife) this.attack('light'); });
          fireBtn.addEventListener('touchend', (e) => { e.preventDefault(); this.isFiring = false; });
      }
      if (jumpBtn) {
          jumpBtn.addEventListener('touchstart', (e) => { e.preventDefault(); if (this.canJump) { this.velocity.y += 10; this.canJump = false; } });
      }
      if (reloadBtn) {
          reloadBtn.addEventListener('touchstart', (e) => { e.preventDefault(); this.reload(); });
      }
      if (switchBtn) {
          switchBtn.addEventListener('touchstart', (e) => { 
              e.preventDefault(); 
              const types = [WeaponType.Rifle, WeaponType.Pistol, WeaponType.Knife];
              const idx = types.indexOf(this.currentWeaponType);
              const next = types[(idx + 1) % types.length];
              this.switchWeapon(next);
          });
      }
  }

  updateJoystick(x: number, y: number, center: {x:number,y:number}, maxRadius: number, knob: HTMLElement) {
      const deltaX = x - center.x;
      const deltaY = y - center.y;
      const distance = Math.sqrt(deltaX*deltaX + deltaY*deltaY);
      const limit = Math.min(distance, maxRadius);
      const angle = Math.atan2(deltaY, deltaX);
      
      const knobX = Math.cos(angle) * limit;
      const knobY = Math.sin(angle) * limit;

      knob.style.transform = `translate(calc(-50% + ${knobX}px), calc(-50% + ${knobY}px))`;

      this.joystickMove.x = knobX / maxRadius;
      this.joystickMove.y = knobY / maxRadius;

      const threshold = 0.2;
      this.moveRight = this.joystickMove.x > threshold;
      this.moveLeft = this.joystickMove.x < -threshold;
      this.moveBackward = this.joystickMove.y > threshold;
      this.moveForward = this.joystickMove.y < -threshold;
      
      this.isSprinting = distance > maxRadius * 0.8; 
  }

  switchWeapon(type: WeaponType) {
      if (this.isReloading || this.isMeleeAttacking) return;
      
      this.currentWeapon.model.visible = false;
      this.currentWeaponType = type;
      const weapon = this.currentWeapon;
      
      weapon.model.visible = true;
      weapon.model.position.copy(weapon.positionOffset);
      weapon.model.scale.set(weapon.scale, weapon.scale, weapon.scale);
      
      if (type === WeaponType.Knife) {
          weapon.model.rotation.set(-Math.PI/4, 0, 0); 
          this.gunBaseRotation.set(-Math.PI/4, 0, 0);
      } else {
          weapon.model.rotation.set(0, 0, 0);
          this.gunBaseRotation.set(0, 0, 0);
      }
      this.gunBasePosition.copy(weapon.positionOffset);
      this.isFiring = false;
      this.updateWeaponUI();
  }

  reload() {
      const weapon = this.currentWeapon;
      if (weapon.type === WeaponType.Knife) return;
      if (this.isReloading || weapon.currentClip === weapon.ammoClip || weapon.ammoTotal === 0) return;

      this.isReloading = true;
      this.isFiring = false; 
      this.reloadStartTime = performance.now();
      this.soundManager.playReload();
      
      this.updateWeaponUI();

      setTimeout(() => {
        const needed = weapon.ammoClip - weapon.currentClip;
        const available = Math.min(needed, weapon.ammoTotal);
        weapon.currentClip += available;
        weapon.ammoTotal -= available;
        
        this.isReloading = false;
        this.currentWeapon.model.position.copy(this.gunBasePosition);
        this.currentWeapon.model.rotation.copy(this.gunBaseRotation);
        
        this.updateWeaponUI();
      }, weapon.reloadTime);
  }

  attack(meleeType: 'light' | 'heavy' = 'light') {
      const weapon = this.currentWeapon;
      if (weapon.type === WeaponType.Knife) {
          if (this.isMeleeAttacking) return;
          this.isMeleeAttacking = true;
          this.meleeStartTime = performance.now();
          this.meleeType = meleeType;
          this.soundManager.playKnifeSwing();
          return;
      }

      if (this.isReloading) return;
      if (weapon.currentClip <= 0) {
          if (weapon.ammoTotal > 0) this.reload();
          return;
      }

      weapon.currentClip--;
      this.updateWeaponUI();
      if (weapon.type === WeaponType.Pistol) this.soundManager.playPistolShoot();
      else this.soundManager.playShoot();

      const crosshair = document.getElementById('crosshair');
      if (crosshair) {
          crosshair.classList.add('shooting');
          setTimeout(() => crosshair.classList.remove('shooting'), 50);
      }

      const shootOrigin = weapon.model.position.clone();
      weapon.model.localToWorld(shootOrigin);

      const shootDir = new THREE.Vector3();
      this.camera.getWorldDirection(shootDir);
      
      const isMoving = this.moveForward || this.moveBackward || this.moveLeft || this.moveRight;
      const spreadFactor = isMoving ? 0.08 : 0.01;
      shootDir.x += (Math.random() - 0.5) * spreadFactor;
      shootDir.y += (Math.random() - 0.5) * spreadFactor;
      shootDir.z += (Math.random() - 0.5) * spreadFactor;
      shootDir.normalize();

      const bullet = new Bullet(shootOrigin, shootDir, weapon.damage);
      this.bullets.push(bullet);
      
      weapon.model.position.z += 0.1;
      weapon.model.rotation.x += 0.1;
      this.targetRecoilX += 0.05; 
      this.targetRecoilY += (Math.random() - 0.5) * 0.02; 
  }

  updateWeaponUI() {
      const ammoEl = document.getElementById('ammo-count');
      const msg = document.getElementById('reload-msg');
      const weapon = this.currentWeapon;
      if (weapon.type === WeaponType.Knife) {
          if (ammoEl) ammoEl.innerText = "---";
          if (msg) msg.style.display = 'none';
      } else {
          if (ammoEl) ammoEl.innerText = `${weapon.currentClip} / ${weapon.ammoTotal}`;
          if (msg) {
            if (weapon.currentClip === 0 && weapon.ammoTotal === 0) {
                 msg.innerText = "NO AMMO";
                 msg.style.display = 'block';
            } else if (!this.isReloading && weapon.currentClip < weapon.ammoClip) {
                 msg.innerText = "RELOAD";
                 msg.style.display = 'none'; 
            } else {
                 msg.style.display = 'none';
            }
          }
      }
  }
  
  checkMeleeHit(enemies: any[]) { }

  lockControls() {
    if (!this.isMobile) {
        this.controls.lock();
    }
    this.soundManager.resume();
  }

  unlockControls() {
    if (!this.isMobile) {
        this.controls.unlock();
    }
  }

  takeDamage(amount: number) {
    this.health -= amount;
    this.soundManager.playPlayerHurt();
    if (this.health < 0) this.health = 0;
  }

  removeBullet(index: number) {
      const bullet = this.bullets[index];
      if (bullet.mesh.parent) {
          bullet.mesh.parent.remove(bullet.mesh);
      }
      this.bullets.splice(index, 1);
  }

  update(delta: number, scene: THREE.Scene, walls: THREE.Box3[], enemies: Enemy[]) {
    const now = performance.now();
    const weapon = this.currentWeapon;

    if (weapon.type !== WeaponType.Knife) {
        if (this.isFiring && !this.isReloading) {
            if (now - this.lastFireTime > weapon.fireRate) {
                this.attack();
                this.lastFireTime = now;
                if (!weapon.isAutomatic) this.isFiring = false; 
            }
        }
    } else {
        if (this.isMeleeAttacking) {
            const elapsed = now - this.meleeStartTime;
            const duration = this.meleeType === 'light' ? 300 : 600;
            const progress = Math.min(elapsed / duration, 1);
            const swing = Math.sin(progress * Math.PI);
            
            if (this.meleeType === 'light') {
                weapon.model.rotation.y = -swing * 1.5;
                weapon.model.position.x = this.gunBasePosition.x - swing * 0.5;
            } else {
                weapon.model.position.z = this.gunBasePosition.z - swing * 0.8;
            }

            if (elapsed > duration * 0.3 && elapsed < duration * 0.5) {
                 const attackRange = 2.5;
                 const attackAngle = Math.PI / 3; 
                 const forward = new THREE.Vector3();
                 this.camera.getWorldDirection(forward);
                 forward.y = 0; forward.normalize();

                 for (const enemy of enemies) {
                     if (enemy.isDead) continue;
                     const toEnemy = enemy.mesh.position.clone().sub(this.position);
                     toEnemy.y = 0;
                     const dist = toEnemy.length();
                     toEnemy.normalize();
                     
                     if (dist < attackRange) {
                         const angle = forward.angleTo(toEnemy);
                         if (angle < attackAngle) {
                             const dmg = this.meleeType === 'light' ? 25 : 50;
                             const result = enemy.hit('body', dmg); 
                             if (result.damage > 0) {
                                 enemy.mesh.position.add(forward.clone().multiplyScalar(0.5));
                             }
                         }
                     }
                 }
            }

            if (progress >= 1) {
                this.isMeleeAttacking = false;
                weapon.model.position.copy(this.gunBasePosition);
                weapon.model.rotation.copy(this.gunBaseRotation);
            }
        }
    }

    if (this.isReloading && weapon.type !== WeaponType.Knife) {
        const elapsed = now - this.reloadStartTime;
        const progress = Math.min(elapsed / weapon.reloadTime, 1);
        const offset = Math.sin(progress * Math.PI); 
        weapon.model.position.y = this.gunBasePosition.y - offset * 0.3; 
        weapon.model.rotation.x = this.gunBaseRotation.x - offset * 1.0; 
    } else if (!this.isMeleeAttacking) {
        weapon.model.position.lerp(this.gunBasePosition, delta * 10);
        weapon.model.rotation.x = THREE.MathUtils.lerp(weapon.model.rotation.x, this.gunBaseRotation.x, delta * 10);
        weapon.model.rotation.y = THREE.MathUtils.lerp(weapon.model.rotation.y, this.gunBaseRotation.y, delta * 10);
    }

    this.recoilX = THREE.MathUtils.lerp(this.recoilX, this.targetRecoilX, delta * 20);
    this.recoilY = THREE.MathUtils.lerp(this.recoilY, this.targetRecoilY, delta * 20);
    
    this.camera.rotation.x = this.recoilX;
    this.camera.rotation.y = this.recoilY;
    this.targetRecoilX = THREE.MathUtils.lerp(this.targetRecoilX, 0, delta * 10);
    this.targetRecoilY = THREE.MathUtils.lerp(this.targetRecoilY, 0, delta * 10);

    for (let i = this.bullets.length - 1; i >= 0; i--) {
        const bullet = this.bullets[i];
        if (!bullet.mesh.parent) scene.add(bullet.mesh);
        bullet.update(delta);
        
        const currentPos = bullet.mesh.position;
        let hitWall = false;
        for (const wall of walls) {
            if (wall.containsPoint(currentPos)) {
                hitWall = true;
                break;
            }
        }
        if (hitWall || !bullet.isAlive || currentPos.distanceTo(this.position) > 200) {
            this.removeBullet(i);
        }
    }

    this.velocity.x -= this.velocity.x * 10.0 * delta;
    this.velocity.z -= this.velocity.z * 10.0 * delta;
    this.velocity.y -= 9.8 * 5.0 * delta;

    this.direction.z = Number(this.moveForward) - Number(this.moveBackward);
    this.direction.x = Number(this.moveRight) - Number(this.moveLeft);
    this.direction.normalize();
    
    if (this.isMobile && (this.joystickMove.x !== 0 || this.joystickMove.y !== 0)) {
        this.direction.z = -this.joystickMove.y; 
        this.direction.x = this.joystickMove.x;
    }

    const baseSpeed = 200.0;
    const speedMultiplier = this.isSprinting ? 1.0 : 0.5; 
    const currentSpeed = baseSpeed * speedMultiplier;

    const inputMagnitude = this.isMobile ? Math.sqrt(this.joystickMove.x**2 + this.joystickMove.y**2) : 1;
    const effectiveSpeed = currentSpeed * Math.min(inputMagnitude, 1);

    if (this.moveForward || this.moveBackward || (this.isMobile && this.joystickMove.y !== 0)) 
        this.velocity.z -= this.direction.z * effectiveSpeed * delta;
    if (this.moveLeft || this.moveRight || (this.isMobile && this.joystickMove.x !== 0)) 
        this.velocity.x -= this.direction.x * effectiveSpeed * delta;

    this.controls.moveRight(-this.velocity.x * delta);
    this.controls.moveForward(-this.velocity.z * delta);
    this.controls.getObject().position.y += (this.velocity.y * delta);

    if (this.controls.getObject().position.y < 1.6) {
      this.velocity.y = 0;
      this.controls.getObject().position.y = 1.6;
      this.canJump = true;
    }

    this.checkWallCollision(walls);
  }

  checkWallCollision(walls: THREE.Box3[]) {
    const playerRadius = 0.3;
    const pos = this.position;
    
    this.collider.setFromCenterAndSize(
        new THREE.Vector3(pos.x, pos.y, pos.z),
        new THREE.Vector3(playerRadius * 2, 1.8, playerRadius * 2)
    );

    for (const wall of walls) {
        if (this.collider.intersectsBox(wall)) {
            const wallCenter = new THREE.Vector3();
            wall.getCenter(wallCenter);
            
            const dx = pos.x - wallCenter.x;
            const dz = pos.z - wallCenter.z;
            const wallSize = new THREE.Vector3();
            wall.getSize(wallSize);
            
            const overlapX = (wallSize.x / 2 + playerRadius) - Math.abs(dx);
            const overlapZ = (wallSize.z / 2 + playerRadius) - Math.abs(dz);
            
            if (overlapX < overlapZ) {
                if (dx > 0) pos.x += overlapX; else pos.x -= overlapX;
                this.velocity.x = 0;
            } else {
                if (dx > 0) pos.z += overlapZ; else pos.z -= overlapZ;
                this.velocity.z = 0;
            }
        }
    }
  }
}
