import { Game } from './Game';

window.addEventListener('DOMContentLoaded', () => {
  const game = new Game();
  
  // 处理开始屏幕点击
  const startScreen = document.getElementById('start-screen');
  if (startScreen) {
    startScreen.addEventListener('click', () => {
      game.start();
      startScreen.style.display = 'none';
    });
  }

  // 处理游戏结束后的重启
  const restartBtn = document.getElementById('restart-btn');
  if (restartBtn) {
    restartBtn.addEventListener('click', () => {
      window.location.reload(); // 简单粗暴的重启方式
    });
  }
});

