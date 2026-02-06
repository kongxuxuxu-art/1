import './style.css';
import { Game } from './game';

const app = document.querySelector<HTMLDivElement>('#app');
if (!app) {
  throw new Error('app root missing');
}

const game = new Game(app);
game.start();
