"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyRoom = void 0;
const colyseus_1 = require("colyseus");
const MyRoomState_1 = require("./schema/MyRoomState");
const axios_1 = __importDefault(require("axios"));
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
            y: this.game.height + this.blocksVerticalDistance - this.blocksOffset,
            height: 800,
            width: 200,
        };
        this.bottomBlock = {
            x: 900,
            y: 0 - this.blocksVerticalDistance - this.blocksOffset,
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
        this.apiUrl = "https://lb-dev.gmfrens.games";
        this.serverObjects = {
            player: this.player,
            topBlock: this.topBlock,
            bottomBlock: this.bottomBlock,
            invisibleScoreBlock: this.invisibleScoreBlock,
            score: this.score,
        };
        this.update = () => {
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
    testPostScore(sessionId, score) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let result = yield axios_1.default.post(`${this.apiUrl}/game/score`, {
                    sessionId,
                    score,
                });
                console.log(`Posted score ${score} succesfully!`);
            }
            catch (error) {
                console.log(error);
            }
        });
    }
    gameOver() {
        this.testPostScore(this.sessionId, this.score);
        this.broadcast("gameover");
    }
    onCreate(options) {
        this.setState(new MyRoomState_1.MyRoomState());
        this.onMessage("sessionId", (client, message) => {
            this.sessionId = message;
        });
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
