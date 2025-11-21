import * as THREE from 'three';
import { ModelFactory } from './ModelFactory';
import { SoundManager } from './SoundManager';

export class Enemy {
  mesh: THREE.Group;
  scene: THREE.Scene;
  speed: number = 3.5;
  health: number = 20;
  isDead: boolean = false;
  radius: number = 0.6;
  
  // 动画与攻击
  walkOffset: number = Math.random() * 100;
  isAttacking: boolean = false;
  lastAttackTime: number = 0;
  attackCooldown: number = 1500; // 1.5秒攻击一次
  attackRange: number = 2.0;
  
  // 外部传入引用
  soundManager: SoundManager | null = null;
  
  constructor(position: THREE.Vector3, scene: THREE.Scene) {
    this.scene = scene;
    this.mesh = ModelFactory.createZombie();
    this.mesh.position.copy(position);
    
    this.mesh.traverse(child => {
        if (child instanceof THREE.Mesh) {
            if (child.name === '') child.name = 'body'; 
        }
    });

    this.scene.add(this.mesh);
  }
  
  setSoundManager(sm: SoundManager) {
      this.soundManager = sm;
  }

  // 返回本次造成的伤害
  update(delta: number, playerPosition: THREE.Vector3, walls: THREE.Box3[]): number {
    if (this.isDead) return 0;

    const distToPlayer = this.mesh.position.distanceTo(playerPosition);
    let damageDealt = 0;

    // 攻击逻辑
    if (distToPlayer < this.attackRange) {
        // 停止移动并尝试攻击
        const now = performance.now();
        if (!this.isAttacking && now - this.lastAttackTime > this.attackCooldown) {
            this.startAttack(now);
            damageDealt = 10; // 造成10点伤害
            if (this.soundManager) this.soundManager.playZombieAttack();
        }
    } else {
        // 移动逻辑
        if (!this.isAttacking) {
            const direction = new THREE.Vector3()
              .subVectors(playerPosition, this.mesh.position)
              .normalize();
            
            direction.y = 0;
            this.mesh.lookAt(playerPosition.x, this.mesh.position.y, playerPosition.z);
            
            const moveStep = direction.multiplyScalar(this.speed * delta);
            this.mesh.position.add(moveStep);
        }
    }

    // 动画
    this.updateAnimation(delta);

    return damageDealt;
  }

  startAttack(time: number) {
      this.isAttacking = true;
      this.lastAttackTime = time;
      
      // 简单的攻击动作：抬手 0.5秒后恢复
      setTimeout(() => {
          this.isAttacking = false;
      }, 500);
  }

  updateAnimation(delta: number) {
      const time = performance.now();
      
      const leftArm = this.mesh.getObjectByName('leftArm');
      const rightArm = this.mesh.getObjectByName('rightArm');
      const leftLeg = this.mesh.getObjectByName('leftLeg');
      const rightLeg = this.mesh.getObjectByName('rightLeg');

      if (this.isAttacking) {
          // 攻击姿态：双手抬起挥舞
          const attackProgress = (time - this.lastAttackTime) / 500;
          if (attackProgress <= 1) {
              // 简单的挥击插值
              const swing = Math.sin(attackProgress * Math.PI);
              if (leftArm) leftArm.rotation.x = -Math.PI / 2 - swing * 1.0;
              if (rightArm) rightArm.rotation.x = -Math.PI / 2 - swing * 1.0;
          }
      } else {
          // 行走姿态
          const walkTime = time * 0.005 + this.walkOffset;
          if (leftArm && rightArm) {
              leftArm.rotation.x = -Math.PI / 2 + Math.sin(walkTime) * 0.5;
              rightArm.rotation.x = -Math.PI / 2 - Math.sin(walkTime) * 0.5;
          }
          if (leftLeg && rightLeg) {
              leftLeg.rotation.x = Math.sin(walkTime) * 0.5;
              rightLeg.rotation.x = -Math.sin(walkTime) * 0.5;
          }
      }
  }

  // 允许传入基础伤害
  hit(partName: string, baseDamage: number = 10): { damage: number, isCritical: boolean } {
    let damage = baseDamage;
    let isCritical = false;

    if (partName === 'head') {
        damage = baseDamage * 4; 
        isCritical = true;
    } else if (partName.includes('Arm') || partName.includes('Leg')) {
        damage = baseDamage * 0.5;
    } else {
        damage = baseDamage;
    }

    this.health -= damage;
    
    this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            const mat = child.material as THREE.MeshStandardMaterial;
            const originalColor = mat.color.getHex();
            mat.color.setHex(isCritical ? 0xffff00 : 0xff0000);
            setTimeout(() => {
                if (!this.isDead) mat.color.setHex(originalColor);
            }, 100);
        }
    });

    if (this.health <= 0) {
      this.die();
    }

    return { damage, isCritical };
  }

  die() {
    this.isDead = true;
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.position.y = 0.2;
  }

  dispose() {
    this.scene.remove(this.mesh);
    this.mesh.traverse((child) => {
        if (child instanceof THREE.Mesh) {
            child.geometry.dispose();
            child.material.dispose();
        }
    });
  }
}
