"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRoom = void 0;
const colyseus_1 = require("colyseus");
const MyRoomState_1 = require("./schema/MyRoomState");
class MyRoom extends colyseus_1.Room {
    constructor() {
        super(...arguments);
        this.maxClients = 1;
        this.game = {
            width: 800,
            height: 800,
        };
        this.playerGravity = 1;
        this.playerVelocityY = 0;
        this.playerJumpForce = -15;
        this.blocksWidth = 200;
        this.blocksOffsetDistance = 200;
        this.blocksOffset = this.setBlocksGroupOffset(-this.blocksOffsetDistance, this.blocksOffsetDistance);
        this.blocksVerticalDistance = 150;
        this.score = 0;
        this.player = {
            x: 400,
            y: 400,
            width: 160,
            height: 160,
        };
        this.topBlock = {
            x: 900,
            y: -85,
            height: 800,
            width: 200,
        };
        this.bottomBlock = {
            x: 900,
            y: 1014,
            height: 800,
            width: 200,
        };
        this.invisibleScoreBlock = {
            x: 400,
            y: 400,
            height: 800,
            width: 200,
            scored: false,
        };
        this.serverObjects = {
            player: this.player,
            topBlock: this.topBlock,
            bottomBlock: this.bottomBlock,
            invisibleScoreBlock: this.invisibleScoreBlock,
            score: this.score,
        };
        this.update = () => {
            //console.log(this);
            this.updatePlayer();
            this.updateBlocks();
            this.checkForCollisions();
            this.serverObjects = {
                player: this.player,
                topBlock: this.topBlock,
                bottomBlock: this.bottomBlock,
                invisibleScoreBlock: this.invisibleScoreBlock,
                score: this.score,
            };
            this.broadcast("update", this.serverObjects);
        };
    }
    setBlocksGroupOffset(min, max) {
        return Math.floor(Math.random() * (max - min + 1) + min);
    }
    updatePlayer() {
        this.playerVelocityY += this.playerGravity;
        this.player.y += this.playerVelocityY;
        if (this.player.y + this.player.height * 0.5 >= this.game.height) {
            this.gameOver();
        }
        if (this.player.y - this.player.height * 0.5 <= 0) {
            this.gameOver();
        }
    }
    makePlayerJump() {
        this.playerVelocityY = this.playerJumpForce;
    }
    updateBlocks() {
        this.topBlock.x -= 10;
        if (this.topBlock.x < -this.topBlock.width * 0.5) {
            this.blocksOffset = this.setBlocksGroupOffset(-this.blocksOffsetDistance, this.blocksOffsetDistance);
            this.topBlock.x = this.game.width + this.topBlock.width * 0.5;
            this.topBlock.y =
                this.game.height + this.blocksVerticalDistance - this.blocksOffset;
            this.invisibleScoreBlock.scored = false;
        }
        if (this.invisibleScoreBlock.scored === false) {
            this.invisibleScoreBlock.x =
                this.topBlock.x + this.invisibleScoreBlock.width * 0.5;
        }
        this.bottomBlock.x -= 10;
        if (this.bottomBlock.x < -this.bottomBlock.width * 0.5) {
            this.bottomBlock.x = this.game.width + this.bottomBlock.width * 0.5;
            this.bottomBlock.y = 0 - this.blocksVerticalDistance - this.blocksOffset;
        }
    }
    detectCollisionBetweenBodies(bodyA, bodyB) {
        if (bodyA.x - bodyA.width * 0.5 <= bodyB.x + bodyB.width * 0.5 &&
            bodyA.x + bodyA.width * 0.5 >= bodyB.x - bodyB.width * 0.5 &&
            bodyA.y - bodyA.height * 0.5 <= bodyB.y + bodyB.height * 0.5 &&
            bodyA.y + bodyA.height * 0.5 >= bodyB.y - bodyB.height * 0.5) {
            return true;
        }
    }
    checkForCollisions() {
        if (this.detectCollisionBetweenBodies(this.player, this.topBlock) === true) {
            this.gameOver();
        }
        if (this.detectCollisionBetweenBodies(this.player, this.bottomBlock) === true) {
            this.gameOver();
        }
        if (this.detectCollisionBetweenBodies(this.player, this.invisibleScoreBlock) === true) {
            this.invisibleScoreBlock.scored = true;
            this.invisibleScoreBlock.x = -this.invisibleScoreBlock.width * 0.5;
            this.score += 1;
        }
    }
    gameOver() {
        this.broadcast("gameover");
    }
    onCreate(options) {
        this.setState(new MyRoomState_1.MyRoomState());
        this.onMessage("jump", (client, message) => {
            this.makePlayerJump();
            this.broadcast("jump", this.player.y);
            console.log("jump");
        });
        this.loop = this.clock.setInterval(this.update, 1, this);
    }
    onJoin(client, options) {
        console.log(client.sessionId, "joined!");
    }
    onLeave(client, consented) {
        console.log(client.sessionId, "left!");
    }
    onDispose() {
        console.log("room", this.roomId, "disposing...");
    }
}
exports.MyRoom = MyRoom;
