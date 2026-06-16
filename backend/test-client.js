import { io } from "socket.io-client";

console.log("=== Starting Real-Time Grid Board Automated Verification ===");

const socket = io("http://localhost:5000", {
  reconnectionDelayMax: 10000,
});

let myUser = null;
let testStep = 0;

socket.on("connect", () => {
  console.log("✔ Connected to backend server via WebSockets");
});

socket.on("init:state", (data) => {
  myUser = data.user;
  console.log(`✔ Received initial state. Active players: ${data.onlineUsers.length}`);
  console.log(`✔ Assigned temporary profile: ${myUser.username} (${myUser.color})`);

  // Step 1: Update profile
  testStep = 1;
  console.log("\n--- Test 1: Updating Profile Name & Color ---");
  socket.emit("user:update", { username: "TestBot", color: "#10b981" });
});

socket.on("user:updated", (updatedUser) => {
  if (myUser && updatedUser.id === socket.id) {
    console.log(`✔ Profile updated successfully to: ${updatedUser.username} (${updatedUser.color})`);
    myUser = updatedUser;
    
    if (testStep === 1) {
      // Step 2: Capture a tile
      testStep = 2;
      console.log("\n--- Test 2: Capturing Tile (10-10) ---");
      socket.emit("tile:capture", { tileId: "10-10" });
    }
  }
});

socket.on("tile:updated", (tileUpdate) => {
  if (tileUpdate.tileId === "10-10" && testStep === 2) {
    if (tileUpdate.ownerName === "TestBot" && tileUpdate.ownerColor === "#10b981") {
      console.log("✔ Tile 10-10 successfully captured and broadcasted");
      
      // Step 3: Test Cooldown rejection by capturing immediately
      testStep = 3;
      console.log("\n--- Test 3: Verifying Cooldown Protection ---");
      console.log("Attempting to capture Tile 10-11 immediately...");
      socket.emit("tile:capture", { tileId: "10-11" });
    } else {
      console.error("❌ Tile capture mismatch:", tileUpdate);
      process.exit(1);
    }
  } else if (tileUpdate.tileId === "10-11" && testStep === 4) {
    if (tileUpdate.ownerName === "TestBot" && tileUpdate.ownerColor === "#10b981") {
      console.log("✔ Tile 10-11 successfully captured after cooldown elapsed");
      console.log("\n==========================================");
      console.log("🎉 ALL TESTS PASSED SUCCESSFULLY! 🎉");
      console.log("==========================================");
      socket.disconnect();
      process.exit(0);
    } else {
      console.error("❌ Tile capture mismatch for 10-11:", tileUpdate);
      process.exit(1);
    }
  }
});

socket.on("capture:rejected", (error) => {
  if (testStep === 3) {
    if (error.reason === "cooldown") {
      console.log(`✔ Capture rejected as expected. Cooldown active: ${error.timeLeft}s left.`);
      
      // Step 4: Wait out the cooldown, then capture again
      testStep = 4;
      const waitTime = (error.timeLeft + 1) * 1000;
      console.log(`Waiting ${waitTime / 1000}s for cooldown to elapse...`);
      setTimeout(() => {
        console.log("Attempting capture of Tile 10-11 again...");
        socket.emit("tile:capture", { tileId: "10-11" });
      }, waitTime);
    } else {
      console.error("❌ Unexpected capture rejection:", error);
      process.exit(1);
    }
  }
});

socket.on("activity:log", (log) => {
  console.log(`[Log Feed] ${log.username}: ${log.message}`);
});

// Timeout fail safe
setTimeout(() => {
  console.error("❌ Test timed out before finishing.");
  process.exit(1);
}, 15000);
