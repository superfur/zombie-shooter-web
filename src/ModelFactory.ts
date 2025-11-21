import * as THREE from 'three';

export class ModelFactory {
  
  static createZombie(): THREE.Group {
    const zombie = new THREE.Group();

    // 材质
    const skinMat = new THREE.MeshStandardMaterial({ color: 0x558855, roughness: 0.9 }); // 腐肉绿
    const shirtMat = new THREE.MeshStandardMaterial({ color: 0x555588, roughness: 0.9 }); // 破衣服蓝
    const pantsMat = new THREE.MeshStandardMaterial({ color: 0x333333, roughness: 0.9 }); // 裤子灰

    // 1. 身体
    const bodyGeo = new THREE.BoxGeometry(0.6, 0.7, 0.3);
    const body = new THREE.Mesh(bodyGeo, shirtMat);
    body.position.y = 1.1;
    body.castShadow = true;
    body.name = 'body';
    zombie.add(body);

    // 2. 头部
    const headGeo = new THREE.BoxGeometry(0.4, 0.4, 0.4);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.y = 1.75;
    head.castShadow = true;
    head.name = 'head';
    zombie.add(head);

    // 3. 手臂 (左/右)
    const armGeo = new THREE.BoxGeometry(0.15, 0.7, 0.15);
    
    const leftArm = new THREE.Mesh(armGeo, skinMat);
    leftArm.position.set(-0.45, 1.1, 0);
    leftArm.rotation.x = -Math.PI / 2; 
    leftArm.castShadow = true;
    leftArm.name = 'leftArm';
    zombie.add(leftArm);

    const rightArm = new THREE.Mesh(armGeo, skinMat);
    rightArm.position.set(0.45, 1.1, 0);
    rightArm.rotation.x = -Math.PI / 2;
    rightArm.castShadow = true;
    rightArm.name = 'rightArm';
    zombie.add(rightArm);

    // 4. 腿 (左/右)
    const legGeo = new THREE.BoxGeometry(0.2, 0.75, 0.2);

    const leftLeg = new THREE.Mesh(legGeo, pantsMat);
    leftLeg.position.set(-0.2, 0.375, 0);
    leftLeg.castShadow = true;
    leftLeg.name = 'leftLeg';
    zombie.add(leftLeg);

    const rightLeg = new THREE.Mesh(legGeo, pantsMat);
    rightLeg.position.set(0.2, 0.375, 0);
    rightLeg.castShadow = true;
    rightLeg.name = 'rightLeg';
    zombie.add(rightLeg);

    return zombie;
  }

  static createGun(): THREE.Group {
    const gun = new THREE.Group();
    
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x222222, metalness: 0.8, roughness: 0.2 });
    const woodMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });

    // 枪身主体 (长枪)
    const bodyGeo = new THREE.BoxGeometry(0.1, 0.1, 0.6);
    const body = new THREE.Mesh(bodyGeo, metalMat);
    gun.add(body);

    // 枪管
    const barrelGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
    const barrel = new THREE.Mesh(barrelGeo, metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.4;
    gun.add(barrel);

    // 弹夹
    const magGeo = new THREE.BoxGeometry(0.08, 0.2, 0.1);
    const mag = new THREE.Mesh(magGeo, metalMat);
    mag.position.set(0, -0.1, 0.1);
    mag.rotation.x = 0.3;
    gun.add(mag);

    // 枪托
    const stockGeo = new THREE.BoxGeometry(0.12, 0.15, 0.3);
    const stock = new THREE.Mesh(stockGeo, woodMat);
    stock.position.set(0, -0.05, 0.4);
    gun.add(stock);

    // 准星
    const sightGeo = new THREE.BoxGeometry(0.01, 0.05, 0.01);
    const sight = new THREE.Mesh(sightGeo, metalMat);
    sight.position.set(0, 0.08, -0.75);
    gun.add(sight);

    return gun;
  }

  static createPistol(): THREE.Group {
    const gun = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0x555555, metalness: 0.6, roughness: 0.3 });
    
    // 枪身
    const bodyGeo = new THREE.BoxGeometry(0.08, 0.08, 0.3);
    const body = new THREE.Mesh(bodyGeo, metalMat);
    gun.add(body);

    // 握把
    const gripGeo = new THREE.BoxGeometry(0.07, 0.15, 0.08);
    const grip = new THREE.Mesh(gripGeo, metalMat);
    grip.position.set(0, -0.1, 0.1);
    grip.rotation.x = 0.2;
    gun.add(grip);

    // 枪口
    const barrelGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8);
    const barrel = new THREE.Mesh(barrelGeo, metalMat);
    barrel.rotation.x = Math.PI / 2;
    barrel.position.z = -0.2;
    gun.add(barrel);

    return gun;
  }

  static createKnife(): THREE.Group {
    const knife = new THREE.Group();
    const metalMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, metalness: 0.9, roughness: 0.1 });
    const handleMat = new THREE.MeshStandardMaterial({ color: 0x222222, roughness: 0.9 });

    // 刀刃
    const bladeGeo = new THREE.BoxGeometry(0.05, 0.4, 0.02);
    // 稍微把刀刃做成尖的（简单缩放）
    const blade = new THREE.Mesh(bladeGeo, metalMat);
    blade.position.y = 0.2;
    knife.add(blade);

    // 刀柄
    const handleGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8);
    const handle = new THREE.Mesh(handleGeo, handleMat);
    handle.position.y = -0.075;
    knife.add(handle);

    // 护手
    const guardGeo = new THREE.BoxGeometry(0.1, 0.02, 0.04);
    const guard = new THREE.Mesh(guardGeo, metalMat);
    guard.position.y = 0;
    knife.add(guard);

    // 调整初始角度，使其像拿着
    knife.rotation.x = -Math.PI / 4;
    
    return knife;
  }

  static createCrate(size: number = 2): THREE.Mesh {
    const geometry = new THREE.BoxGeometry(size, size, size);
    const material = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.9 });
    
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d');
    if (ctx) {
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(0,0,128,128);
        ctx.strokeStyle = '#5C3317';
        ctx.lineWidth = 10;
        ctx.strokeRect(0,0,128,128);
        ctx.beginPath();
        ctx.moveTo(0,0); ctx.lineTo(128,128);
        ctx.moveTo(128,0); ctx.lineTo(0,128);
        ctx.stroke();
    }
    const texture = new THREE.CanvasTexture(canvas);
    const crateMat = new THREE.MeshStandardMaterial({ map: texture });

    const mesh = new THREE.Mesh(geometry, crateMat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.name = 'crate';
    return mesh;
  }
}
