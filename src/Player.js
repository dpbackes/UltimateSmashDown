import * as Phaser from 'phaser';

export default class Player extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y, color, controls) {
        // Create a temporary texture if it doesn't exist
        const textureKey = `player-${color}`;
        if (!scene.textures.exists(textureKey)) {
            const graphics = scene.make.graphics({ x: 0, y: 0, add: false });
            graphics.fillStyle(color, 1);
            graphics.fillRect(0, 0, 32, 48);
            graphics.generateTexture(textureKey, 32, 48);
        }

        super(scene, x, y, textureKey);

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.setCollideWorldBounds(false); // We want ring-outs
        this.setBounce(0.1);
        this.setDragX(1000);

        this.controls = controls;
        this.jumpCount = 0;
        this.maxJumps = 2;
        this.damagePct = 0;
        this.lives = 3;
        this.isAttacking = false;
        this.facingRight = true;
        this.isDead = false;

        this.spawnPos = { x, y };

        // Setup attack hitbox (semi-transparent when active)
        this.hitbox = scene.add.rectangle(0, 0, 50, 40, 0xffffff, 0.5);
        scene.physics.add.existing(this.hitbox);
        this.hitbox.body.setAllowGravity(false);
        this.hitbox.body.enable = false;
        this.hitbox.setVisible(false);

        // Setup input keys
        this.keys = scene.input.keyboard.addKeys(controls);
    }

    update() {
        if (this.isDead) return;

        const { left, right, up, attack } = this.keys;

        // Horizontal movement
        if (left.isDown) {
            this.setVelocityX(-250);
            this.facingRight = false;
        } else if (right.isDown) {
            this.setVelocityX(250);
            this.facingRight = true;
        }

        // Jumping
        if (Phaser.Input.Keyboard.JustDown(up)) {
            if (this.body.blocked.down || this.jumpCount < this.maxJumps) {
                this.setVelocityY(-400);
                this.jumpCount++;
            }
        }

        // Reset jump count when on floor
        if (this.body.blocked.down) {
            this.jumpCount = 0;
        }

        // Basic attack trigger
        if (Phaser.Input.Keyboard.JustDown(attack) && !this.isAttacking) {
            this.performAttack();
        }

        // Update hitbox position and check for hits
        if (this.isAttacking && this.hitbox.body.enable) {
            const offsetX = this.facingRight ? 30 : -30;
            this.hitbox.x = this.x + offsetX;
            this.hitbox.y = this.y;

            this.scene.physics.overlap(this.hitbox, this.scene.players, (h, victim) => {
                if (victim !== this && !victim.isDead) {
                    let damage = 10;
                    let kbX = this.facingRight ? 300 : -300;
                    let kbY = -200;

                    if (this.currentAttackIsSmash) {
                        damage = 20;
                        kbX *= 1.5;
                        kbY *= 1.5;
                    }

                    victim.takeDamage(damage, kbX, kbY);
                    this.hitbox.body.enable = false; // One hit per attack
                }
            });
        }

        // Check for ring-out
        if (this.y > 900 || this.x < -400 || this.x > 1200) {
            this.die();
        }
    }

    performAttack() {
        this.isAttacking = true;
        
        const { left, right, up } = this.keys;
        this.currentAttackIsSmash = left.isDown || right.isDown || up.isDown;
        
        const attackColor = this.currentAttackIsSmash ? 0xff00ff : 0xffff00;
        this.setTint(attackColor);
        
        // Enable and show hitbox
        this.hitbox.body.enable = true;
        this.hitbox.setVisible(true);
        this.hitbox.setFillStyle(attackColor, 0.5);
        
        this.scene.time.delayedCall(this.currentAttackIsSmash ? 300 : 150, () => {
            this.isAttacking = false;
            this.hitbox.body.enable = false;
            this.hitbox.setVisible(false);
            this.clearTint();
        });
    }

    takeDamage(amount, knockbackX, knockbackY) {
        this.damagePct += amount;
        
        // Instant KO at 200%
        if (this.damagePct >= 200) {
            this.die();
            return;
        }
        
        // Scale knockback based on percentage
        const multiplier = 1 + (this.damagePct / 100);
        this.setVelocity(knockbackX * multiplier, knockbackY * multiplier);
        
        // Visual feedback
        this.setTint(0xff0000);
        this.scene.cameras.main.shake(100, 0.01);
        this.scene.time.delayedCall(100, () => this.clearTint());
    }

    die() {
        this.lives--;
        this.isDead = true;
        this.setVisible(false);
        this.setActive(false);
        this.body.enable = false;
        
        this.scene.events.emit('player-died', this);
    }

    respawn() {
        this.isDead = false;
        this.damagePct = 0;
        this.setVisible(true);
        this.setActive(true);
        this.body.enable = true;
        this.setPosition(this.spawnPos.x, this.spawnPos.y);
        this.setVelocity(0, 0);
        
        // Invincibility flicker
        this.setAlpha(0.5);
        this.scene.time.delayedCall(2000, () => {
            this.setAlpha(1);
        });
    }
}
