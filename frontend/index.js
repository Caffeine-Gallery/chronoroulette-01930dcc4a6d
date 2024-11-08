import { backend } from "declarations/backend";

let gameActive = false;
let currentScore = 0;
let timerInterval;

const gameMap = document.getElementById('gameMap');
const player = document.getElementById('player');
const startButton = document.getElementById('startButton');
const timerDisplay = document.getElementById('timer');
const scoreDisplay = document.getElementById('score');
const notification = document.getElementById('notification');
const loadingOverlay = document.getElementById('loadingOverlay');
const highScoresContainer = document.getElementById('highScores');

// Initialize player position
let playerX = 50;
let playerY = 50;
updatePlayerPosition(playerX, playerY);

function showLoading() {
    loadingOverlay.classList.remove('hidden');
}

function hideLoading() {
    loadingOverlay.classList.add('hidden');
}

function updatePlayerPosition(x, y) {
    player.style.left = `${x}%`;
    player.style.top = `${y}%`;
}

function showNotification() {
    notification.classList.remove('hidden');
    setTimeout(() => {
        notification.classList.add('hidden');
    }, 2000);
}

async function updateHighScores() {
    try {
        const scores = await backend.getHighScores();
        if (scores.length === 0) {
            highScoresContainer.innerHTML = '<div class="text-center">No scores yet</div>';
            return;
        }

        const scoresList = scores.map((score, index) => `
            <div class="d-flex justify-content-between align-items-center mb-2">
                <span>#${index + 1}</span>
                <span>${score[1]} points</span>
            </div>
        `).join('');

        highScoresContainer.innerHTML = scoresList;
    } catch (error) {
        console.error('Error fetching high scores:', error);
    }
}

async function updateTimer() {
    try {
        const remainingTime = await backend.getRemainingTime();
        if (remainingTime <= 0) {
            endGame();
            return;
        }
        timerDisplay.textContent = `Time: ${remainingTime}s`;
    } catch (error) {
        console.error('Error updating timer:', error);
    }
}

async function endGame() {
    gameActive = false;
    clearInterval(timerInterval);
    await backend.endGame();
    startButton.textContent = 'Start New Game';
    updateHighScores();
}

async function startGame() {
    showLoading();
    try {
        await backend.startGame();
        gameActive = true;
        currentScore = 0;
        scoreDisplay.textContent = `Score: ${currentScore}`;
        startButton.textContent = 'Game in Progress';
        
        // Start timer updates
        timerInterval = setInterval(updateTimer, 1000);
        
        // Update high scores
        await updateHighScores();
    } catch (error) {
        console.error('Error starting game:', error);
    } finally {
        hideLoading();
    }
}

async function checkLocation(x, y) {
    if (!gameActive) return;
    
    showLoading();
    try {
        const found = await backend.checkLocation(Math.floor(x), Math.floor(y));
        if (found) {
            showNotification();
            const gameState = await backend.getGameState();
            if (gameState) {
                currentScore = gameState[0].score;
                scoreDisplay.textContent = `Score: ${currentScore}`;
            }
        }
    } catch (error) {
        console.error('Error checking location:', error);
    } finally {
        hideLoading();
    }
}

gameMap.addEventListener('mousemove', (e) => {
    if (!gameActive) return;
    
    const rect = gameMap.getBoundingClientRect();
    playerX = ((e.clientX - rect.left) / rect.width) * 100;
    playerY = ((e.clientY - rect.top) / rect.height) * 100;
    
    // Ensure player stays within bounds
    playerX = Math.max(0, Math.min(100, playerX));
    playerY = Math.max(0, Math.min(100, playerY));
    
    updatePlayerPosition(playerX, playerY);
});

gameMap.addEventListener('click', async (e) => {
    if (!gameActive) return;
    
    const rect = gameMap.getBoundingClientRect();
    const x = Math.floor(((e.clientX - rect.left) / rect.width) * 100);
    const y = Math.floor(((e.clientY - rect.top) / rect.height) * 100);
    
    await checkLocation(x, y);
});

startButton.addEventListener('click', async () => {
    if (!gameActive) {
        await startGame();
    }
});

// Initial high scores load
updateHighScores();
