import { Room, Client, Delayed } from "colyseus";
import { MyRoomState } from "./schema/MyRoomState";
import axios from "axios";

export class MyRoom extends Room<MyRoomState> {
  maxClients: number = 1;

  game = {
    width: 800,
    height: 800,
  };

  playerGravity = 1;
  playerVelocityY = 0;
  playerJumpForce = -15;

  blocksWidth = 200;
  blocksOffsetDistance = 200;
  blocksOffset = this.setBlocksGroupOffset(
    -this.blocksOffsetDistance,
    this.blocksOffsetDistance
  );
  blocksVerticalDistance = 150;

  score = 0;

  player = {
    x: 400,
    y: 400,
    width: 160,
    height: 160,
  };

  topBlock = {
    x: 900,
    y: this.game.height + this.blocksVerticalDistance - this.blocksOffset,
    height: 800,
    width: 200,
  };

  bottomBlock = {
    x: 900,
    y: 0 - this.blocksVerticalDistance - this.blocksOffset,
    height: 800,
    width: 200,
  };

  invisibleScoreBlock = {
    x: 400,
    y: 400,
    height: 800,
    width: 200,
    scored: false,
  };

  apiUrl = "https://lb-dev.gmfrens.games";

  projectSecret = "wY9tD3uW5oV5nZ2yA7lD9pO7sB2aP9kU";

  sessionId: string;

  serverObjects = {
    player: this.player,
    topBlock: this.topBlock,
    bottomBlock: this.bottomBlock,
    invisibleScoreBlock: this.invisibleScoreBlock,
    score: this.score,
  };

  loop!: Delayed;

  setBlocksGroupOffset(min: number, max: number) {
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
      this.blocksOffset = this.setBlocksGroupOffset(
        -this.blocksOffsetDistance,
        this.blocksOffsetDistance
      );
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

  detectCollisionBetweenBodies(bodyA: any, bodyB: any) {
    if (
      bodyA.x - bodyA.width * 0.5 <= bodyB.x + bodyB.width * 0.5 &&
      bodyA.x + bodyA.width * 0.5 >= bodyB.x - bodyB.width * 0.5 &&
      bodyA.y - bodyA.height * 0.5 <= bodyB.y + bodyB.height * 0.5 &&
      bodyA.y + bodyA.height * 0.5 >= bodyB.y - bodyB.height * 0.5
    ) {
      return true;
    }
  }

  checkForCollisions() {
    if (
      this.detectCollisionBetweenBodies(this.player, this.topBlock) === true
    ) {
      this.gameOver();
    }

    if (
      this.detectCollisionBetweenBodies(this.player, this.bottomBlock) === true
    ) {
      this.gameOver();
    }

    if (
      this.detectCollisionBetweenBodies(
        this.player,
        this.invisibleScoreBlock
      ) === true
    ) {
      this.invisibleScoreBlock.scored = true;
      this.invisibleScoreBlock.x = -this.invisibleScoreBlock.width * 0.5;
      this.score += 1;
    }
  }

  async testPostScore(sessionId: string, score: number, projectSecret: string) {
    try {
      let result = await axios.post(`${this.apiUrl}/game/score`, {
        sessionId,
        score,
        projectSecret,
      });
      console.log(`Posted score ${score} succesfully!`);
    } catch (error) {
      console.log(error);
    }
  }

  gameOver() {
    this.broadcast("gameover");
    this.disconnect();
    this.testPostScore(this.sessionId, this.score, this.projectSecret);
  }

  update = () => {
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

  onCreate(options: any) {
    this.setState(new MyRoomState());

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

  onJoin(client: Client, options: any) {
    console.log(client.sessionId, "joined!");
  }

  onLeave(client: Client, consented: boolean) {
    console.log(client.sessionId, "left!");
  }

  onDispose() {
    console.log("room", this.roomId, "disposing...");
  }
}
