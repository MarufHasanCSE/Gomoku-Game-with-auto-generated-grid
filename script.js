document.addEventListener("DOMContentLoaded", () => {
  const gameBoard = document.getElementById("gameBoard")
  const currentPlayerDisplay = document.getElementById("currentPlayer")
  const timerDisplay = document.getElementById("timer")
  const player1ScoreDisplay = document.getElementById("player1Score")
  const player2ScoreDisplay = document.getElementById("player2Score")
  const playButton = document.getElementById("playButton")
  const undoButton = document.getElementById("undoButton")
  const moveCountDisplay = document.getElementById("moveCount")
  const infoButton = document.getElementById("infoButton")
  const closeInfoButton = document.getElementById("closeInfoButton")
  const infoPanel = document.getElementById("infoPanel")
  const winMessage = document.getElementById("winMessage")
  const winText = document.getElementById("winText")
  const nextButton = document.getElementById("nextButton")
  const playerNameModal = document.getElementById("playerNameModal")
  const player1NameInput = document.getElementById("player1Name")
  const player2NameInput = document.getElementById("player2Name")
  const startGameButton = document.getElementById("startGameButton")

  let gameActive = false
  let currentPlayer = 1
  let player1Wins = 0
  let player2Wins = 0
  let totalGames = 0
  let board = []
  let timerInterval = null
  let timeLeft = 30
  let player1Name = "Player 1"
  let player2Name = "Player 2"
  let moveInProgress = false
  let moveHistory = []
  let moveCount = 0

  function loadStats() {
    const saved = localStorage.getItem('gomokuStats')
    if (saved) {
      const stats = JSON.parse(saved)
      player1Wins = stats.player1Wins || 0
      player2Wins = stats.player2Wins || 0
      totalGames = stats.totalGames || 0
    }
  }

  function saveStats() {
    localStorage.setItem('gomokuStats', JSON.stringify({
      player1Wins,
      player2Wins,
      totalGames
    }))
  }

  function playSound(type) {
    try {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)()
      const oscillator = audioContext.createOscillator()
      const gainNode = audioContext.createGain()
      
      oscillator.connect(gainNode)
      gainNode.connect(audioContext.destination)
      
      if (type === 'move') {
        oscillator.frequency.value = 800
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.1)
      } else if (type === 'win') {
        oscillator.frequency.value = 1200
        gainNode.gain.setValueAtTime(0.3, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.3)
      } else if (type === 'undo') {
        oscillator.frequency.value = 600
        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime)
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.08)
        oscillator.start(audioContext.currentTime)
        oscillator.stop(audioContext.currentTime + 0.08)
      }
    } catch (e) {
    }
  }

  function initializeBoard() {
    gameBoard.innerHTML = ""

    board = Array(10)
      .fill()
      .map(() => Array(10).fill(0))

    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement("div")
        cell.className = "cell"
        cell.dataset.row = row
        cell.dataset.col = col

        const piece = document.createElement("div")
        piece.className = "piece"
        cell.appendChild(piece)

        cell.addEventListener("click", () => handleCellClick(row, col))

        gameBoard.appendChild(cell)
      }
    }
    setTimeout(adjustBoardSize, 0)
  }

  function handleCellClick(row, col) {
    if (!gameActive || board[row][col] !== 0 || moveInProgress) {
      return
    }
    
    moveInProgress = true

    board[row][col] = currentPlayer

    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`)
    const piece = cell.querySelector(".piece")

    if (currentPlayer === 1) {
      piece.classList.add("player1-piece")
    } else {
      piece.classList.add("player2-piece")
    }

    if (checkWin(row, col)) {
      playSound('win')
      endGame(currentPlayer)
      moveInProgress = false
      return
    }

    if (checkDraw()) {
      endGame(0)
      moveInProgress = false
      return
    }

    moveHistory.push({ row, col, player: currentPlayer })
    moveCount++
    moveCountDisplay.textContent = moveCount
    playSound('move')

    currentPlayer = currentPlayer === 1 ? 2 : 1
    updateCurrentPlayerDisplay()
    moveInProgress = false
    resetTimer()
  }

  function checkWin(row, col) {
    const directions = [
      [0, 1],
      [1, 0],
      [1, 1],
      [1, -1],
    ]

    const player = board[row][col]

    for (const [dx, dy] of directions) {
      let count = 1
      const positions = [[row, col]]

      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dx
        const newCol = col + i * dy

        if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10 || board[newRow][newCol] !== player) {
          break
        }

        count++
        positions.push([newRow, newCol])
      }

      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dx
        const newCol = col - i * dy

        if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10 || board[newRow][newCol] !== player) {
          break
        }

        count++
        positions.push([newRow, newCol])
      }

      if (count >= 5) {
        highlightWinningPieces(positions)
        return true
      }
    }

    return false
  }

  function highlightWinningPieces(positions) {
    for (const [row, col] of positions) {
      const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`)
      const piece = cell.querySelector(".piece")
      piece.classList.add("winning-piece")
    }
  }

  function checkDraw() {
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        if (board[row][col] === 0) {
          return false
        }
      }
    }
    return true
  }

  function endGame(winner) {
    gameActive = false
    totalGames++
    stopTimer()
    undoButton.disabled = true

    if (winner === 1) {
      player1Wins++
      winText.textContent = `${player1Name} Wins!`
      winText.style.color = "#4CAF50"
    } else if (winner === 2) {
      player2Wins++
      winText.textContent = `${player2Name} Wins!`
      winText.style.color = "#2196F3"
    } else {
      winText.textContent = "Draw!"
      winText.style.color = "#333"
    }

    updateScoreDisplay()
    winMessage.classList.add("show")
  }

  function updateCurrentPlayerDisplay() {
    const playerName = currentPlayer === 1 ? player1Name : player2Name
    currentPlayerDisplay.textContent = `Current Player: ${playerName}`

    if (currentPlayer === 1) {
      currentPlayerDisplay.style.color = "#4CAF50"
    } else {
      currentPlayerDisplay.style.color = "#2196F3"
    }
    
    undoButton.disabled = moveHistory.length === 0 || !gameActive
  }

  function updateScoreDisplay() {
    player1ScoreDisplay.textContent = `${player1Wins}/${totalGames}`
    player2ScoreDisplay.textContent = `${player2Wins}/${totalGames}`
    saveStats()
  }

  function startTimer() {
    timeLeft = 30
    updateTimerDisplay()

    if (timerInterval) {
      clearInterval(timerInterval)
    }

    timerInterval = setInterval(() => {
      timeLeft--
      updateTimerDisplay()

      if (timeLeft <= 0) {
        clearInterval(timerInterval)
        currentPlayer = currentPlayer === 1 ? 2 : 1
        updateCurrentPlayerDisplay()
        resetTimer()
      }
    }, 1000)
  }

  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function resetTimer() {
    stopTimer()
    startTimer()
  }

  function updateTimerDisplay() {
    const displayTime = Math.max(0, timeLeft)
    timerDisplay.textContent = `Time: ${displayTime}s`

    timerDisplay.classList.remove("warning", "danger")
    if (displayTime <= 10 && displayTime > 5) {
      timerDisplay.classList.add("warning")
    } else if (displayTime <= 5) {
      timerDisplay.classList.add("danger")
    }
  }

  function startNewGame() {
    initializeBoard()
    gameActive = true
    currentPlayer = 1
    moveHistory = []
    moveCount = 0
    updateCurrentPlayerDisplay()
    playButton.textContent = "Restart"
    winMessage.classList.remove("show")
    resetTimer()
  }

  function showPlayerNameModal() {
    playerNameModal.classList.add("show")
    gameActive = false
    stopTimer()
    player1NameInput.value = player1Name
    player2NameInput.value = player2Name
    player1NameInput.focus()
  }

  function savePlayerNamesAndStartGame() {
    player1Name = player1NameInput.value.trim() || "Player 1"
    player2Name = player2NameInput.value.trim() || "Player 2"

    document.getElementById("player1Label").textContent = `${player1Name}:`
    document.getElementById("player2Label").textContent = `${player2Name}:`

    playerNameModal.classList.remove("show")
    startNewGame()
  }

  function undoMove() {
    if (moveHistory.length === 0 || !gameActive) {
      return
    }

    const lastMove = moveHistory.pop()
    moveCount--
    
    board[lastMove.row][lastMove.col] = 0
    const cell = document.querySelector(`.cell[data-row="${lastMove.row}"][data-col="${lastMove.col}"]`)
    const piece = cell.querySelector(".piece")
    piece.className = "piece"
    
    currentPlayer = lastMove.player
    playSound('undo')
    updateCurrentPlayerDisplay()
    resetTimer()
  }

  function adjustBoardSize() {
    const container = document.querySelector(".container")
    const header = document.querySelector("header")
    const footer = document.querySelector("footer")
    const gameBoard = document.getElementById("gameBoard")

    if (!header || !footer || header.offsetHeight === 0) {
      return
    }

    const availableHeight = window.innerHeight - header.offsetHeight - footer.offsetHeight - 30
    const size = Math.max(200, Math.min(availableHeight, window.innerWidth * 0.8))
    
    gameBoard.style.width = `${size}px`
    gameBoard.style.height = `${size}px`
  }

  window.addEventListener("resize", adjustBoardSize)

  playButton.addEventListener("click", () => {
    if (playButton.textContent === "Play") {
      showPlayerNameModal()
    } else {
      if (gameActive) {
        if (confirm("Are you sure you want to restart the game?")) {
          showPlayerNameModal()
        }
      } else {
        showPlayerNameModal()
      }
    }
  })

  nextButton.addEventListener("click", () => {
    startNewGame()
  })

  infoButton.addEventListener("click", () => {
    infoPanel.classList.add("show")
  })

  closeInfoButton.addEventListener("click", () => {
    infoPanel.classList.remove("show")
  })

  startGameButton.addEventListener("click", () => {
    savePlayerNamesAndStartGame()
  })

  player1NameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      player2NameInput.focus()
    }
  })

  player2NameInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      savePlayerNamesAndStartGame()
    }
  })

  undoButton.addEventListener("click", undoMove)

  document.addEventListener("keydown", (e) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "z") {
      e.preventDefault()
      undoMove()
    }
  })

  loadStats()
  initializeBoard()
  updateScoreDisplay()

  setTimeout(adjustBoardSize, 0)
})
