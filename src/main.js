import * as Phaser from 'phaser';
import Player from './Player';

class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    preload() {
        // We'll add assets here later
    }

    create() {
        // Create static platforms group
        this.platforms = this.physics.add.staticGroup();

        // Main floor
        const floor = this.add.rectangle(400, 500, 600, 40, 0x666666);
        this.platforms.add(floor);

        // Floating platforms
        const plat1 = this.add.rectangle(200, 350, 200, 20, 0x888888);
        this.platforms.add(plat1);

        const plat2 = this.add.rectangle(600, 350, 200, 20, 0x888888);
        this.platforms.add(plat2);

        const plat3 = this.add.rectangle(400, 200, 150, 20, 0xaaaaaa);
        this.platforms.add(plat3);

        // Player 1 (Mario style - Red)
        this.player1 = new Player(this, 300, 400, 0xff0000, {
            left: 'A',
            right: 'D',
            up: 'W',
            attack: 'V'
        });

        // Player 2 (Luigi style - Green/Blue)
        this.player2 = new Player(this, 500, 400, 0x0000ff, {
            left: 'LEFT',
            right: 'RIGHT',
            up: 'UP',
            attack: 'SPACE'
        });

        this.players = this.add.group([this.player1, this.player2]);

        // Add collisions
        this.physics.add.collider(this.player1, this.platforms);
        this.physics.add.collider(this.player2, this.platforms);

        // Set world bounds larger than the screen for ring-outs
        this.physics.world.setBounds(-400, -300, 1600, 1200);

        // Setup camera to follow action (middle of both players)
        this.cameras.main.setBounds(-400, -300, 1600, 1200);

        this.titleText = this.add.text(400, 50, 'Super Mario Ultimate Smash Down', {
            fontSize: '24px',
            fill: '#fff'
        }).setOrigin(0.5).setScrollFactor(0);

        // UI for damage and lives
        this.p1Text = this.add.text(200, 550, 'P1: 0% | Lives: 3', {
            fontSize: '24px',
            fill: '#f00'
        }).setOrigin(0.5).setScrollFactor(0);

        this.p2Text = this.add.text(600, 550, 'P2: 0% | Lives: 3', {
            fontSize: '24px',
            fill: '#00f'
        }).setOrigin(0.5).setScrollFactor(0);

        // Listen for player death
        this.events.on('player-died', (player) => {
            if (player.lives > 0) {
                this.time.delayedCall(1000, () => {
                    player.respawn();
                });
            } else {
                const winner = player === this.player1 ? 'Player 2' : 'Player 1';
                this.add.text(400, 300, `GAME OVER\n${winner} Wins!`, {
                    fontSize: '64px',
                    fill: '#ff0',
                    align: 'center'
                }).setOrigin(0.5).setScrollFactor(0);

                this.time.delayedCall(5000, () => {
                    this.scene.restart();
                });
            }
        });
    }

    update() {
        this.player1.update();
        this.player2.update();

        // Update UI
        this.p1Text.setText(`P1: ${Math.floor(this.player1.damagePct)}% | Lives: ${this.player1.lives}`);
        this.p2Text.setText(`P2: ${Math.floor(this.player2.damagePct)}% | Lives: ${this.player2.lives}`);

        // Camera follow both players
        if (this.player1.active && this.player2.active) {
            const midX = (this.player1.x + this.player2.x) / 2;
            const midY = (this.player1.y + this.player2.y) / 2;
            this.cameras.main.centerOn(midX, midY);
        } else if (this.player1.active) {
            this.cameras.main.startFollow(this.player1, true, 0.1, 0.1);
        } else if (this.player2.active) {
            this.cameras.main.startFollow(this.player2, true, 0.1, 0.1);
        }
    }
}

const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false
        }
    },
    scene: GameScene
};

new Phaser.Game(config);
