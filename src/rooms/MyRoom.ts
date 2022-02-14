import { Room, Client, Delayed } from "colyseus";
import { MyRoomState } from "./schema/MyRoomState";

export class MyRoom extends Room<MyRoomState> {
  maxClients: number = 1;

  game = {
    width: 800,
    height: 800,
  };

  playerGravity = 0.5;
  playerVelocityY = 0;
  playerJumpForce = -10;

  player = {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  };

  loop!: Delayed;

  updatePlayer() {
    this.playerVelocityY += this.playerGravity;
    this.player.y += this.playerVelocityY;

    if (this.player.y + this.player.height * 0.5 >= this.game.height) {
      //this.handleCollision();
    }

    if (this.player.y - this.player.height * 0.5 <= 0) {
      //this.handleCollision();
    }
  }

  makePlayerJump() {
    this.playerVelocityY = this.playerJumpForce;
  }

  update = () => {
    //console.log(this);
    this.updatePlayer();
    this.broadcast("update", this.player);
  }

  onCreate(options: any) {
    this.setState(new MyRoomState());

    this.player = {
      x: 400,
      y: 400,
      width: 160,
      height: 160,
    };

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
