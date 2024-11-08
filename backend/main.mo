import Blob "mo:base/Blob";
import Bool "mo:base/Bool";

import Timer "mo:base/Timer";
import Random "mo:base/Random";
import Array "mo:base/Array";
import Nat "mo:base/Nat";
import Nat8 "mo:base/Nat8";
import Int "mo:base/Int";
import Time "mo:base/Time";
import Text "mo:base/Text";
import Buffer "mo:base/Buffer";
import Debug "mo:base/Debug";
import Iter "mo:base/Iter";

actor TreasureHunt {
    // Types
    type GameState = {
        gameId: Text;
        startTime: Int;
        treasuresFound: Nat;
        isActive: Bool;
        score: Nat;
    };

    type Treasure = {
        id: Nat;
        x: Nat;
        y: Nat;
        value: Nat;
        found: Bool;
    };

    // State variables
    stable var currentGameId: Text = "";
    stable var highScores: [(Text, Nat)] = [];
    private var activeGame: ?GameState = null;
    private var treasures = Buffer.Buffer<Treasure>(0);
    private var gameTimer: Timer.TimerId = 0;

    // Generate random number between 0 and max-1
    private func generateRandom(seed: Blob, max: Nat): Nat {
        let random = Random.Finite(seed);
        let byte = switch (random.byte()) {
            case (?val) { Nat8.toNat(val) };
            case null { 0 };
        };
        return byte % max;
    };

    // Generate new treasures
    private func generateTreasures(seed: Blob) {
        treasures.clear();
        for (i in Iter.range(0, 4)) {
            let xPos = generateRandom(seed, 100);
            let yPos = generateRandom(Text.encodeUtf8(Int.toText(Time.now())), 100);
            let value = generateRandom(Text.encodeUtf8(Nat.toText(xPos)), 90) + 10;
            
            treasures.add({
                id = i;
                x = xPos;
                y = yPos;
                value = value;
                found = false;
            });
        };
    };

    // Timer callback (non-async wrapper)
    private func timerCallback() : async () {
        await endGame();
    };

    // Start new game
    public func startGame() : async Text {
        // Cancel existing timer if any
        ignore Timer.cancelTimer(gameTimer);
        
        let gameId = Int.toText(Time.now());
        currentGameId := gameId;
        
        // Generate new treasures
        generateTreasures(Text.encodeUtf8(gameId));
        
        // Set up new game state
        activeGame := ?{
            gameId = gameId;
            startTime = Time.now();
            treasuresFound = 0;
            isActive = true;
            score = 0;
        };

        // Set timer for 2 minutes (120 seconds)
        gameTimer := Timer.setTimer(#seconds 120, timerCallback);
        
        return gameId;
    };

    // End game
    public func endGame() : async () {
        switch (activeGame) {
            case (?game) {
                if (game.score > 0) {
                    highScores := Array.sort<(Text, Nat)>(
                        Array.append(highScores, [(game.gameId, game.score)]),
                        func(a, b) { Nat.compare(b.1, a.1) }
                    );
                    // Keep only top 10 scores
                    if (highScores.size() > 10) {
                        highScores := Array.tabulate<(Text, Nat)>(10, func(i) = highScores[i]);
                    };
                };
                activeGame := null;
            };
            case null { };
        };
    };

    // Check treasure location
    public func checkLocation(x: Nat, y: Nat) : async Bool {
        switch (activeGame) {
            case (?game) {
                if (not game.isActive) return false;
                
                for (treasure in treasures.vals()) {
                    if (not treasure.found and 
                        x >= (if (treasure.x > 5) treasure.x - 5 else 0) and 
                        x <= treasure.x + 5 and
                        y >= (if (treasure.y > 5) treasure.y - 5 else 0) and 
                        y <= treasure.y + 5) {
                        
                        // Mark treasure as found and update score
                        let index = treasure.id;
                        treasures.put(index, {
                            id = treasure.id;
                            x = treasure.x;
                            y = treasure.y;
                            value = treasure.value;
                            found = true;
                        });
                        
                        activeGame := ?{
                            gameId = game.gameId;
                            startTime = game.startTime;
                            treasuresFound = game.treasuresFound + 1;
                            isActive = true;
                            score = game.score + treasure.value;
                        };
                        
                        return true;
                    };
                };
            };
            case null { };
        };
        return false;
    };

    // Get game state
    public query func getGameState() : async ?GameState {
        return activeGame;
    };

    // Get high scores
    public query func getHighScores() : async [(Text, Nat)] {
        return highScores;
    };

    // Get remaining time
    public query func getRemainingTime() : async Int {
        switch (activeGame) {
            case (?game) {
                let elapsed = (Time.now() - game.startTime) / 1_000_000_000;
                return 120 - elapsed;
            };
            case null { return 0; };
        };
    };
}
