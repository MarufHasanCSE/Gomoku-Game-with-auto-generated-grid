document.addEventListener("DOMContentLoaded", () => {
  // Game elements
  const gameBoard = document.getElementById("gameBoard")
  const currentPlayerDisplay = document.getElementById("currentPlayer")
  const timerDisplay = document.getElementById("timer")
  const player1ScoreDisplay = document.getElementById("player1Score")
  const player2ScoreDisplay = document.getElementById("player2Score")
  const playButton = document.getElementById("playButton")
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

  // Game state
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

  // Initialize the game board
  function initializeBoard() {
    // Clear the game board
    gameBoard.innerHTML = ""

    // Create a 10x10 grid
    board = Array(10)
      .fill()
      .map(() => Array(10).fill(0))

    // Create cells for the game board
    for (let row = 0; row < 10; row++) {
      for (let col = 0; col < 10; col++) {
        const cell = document.createElement("div")
        cell.className = "cell"
        cell.dataset.row = row
        cell.dataset.col = col

        // Create piece element (initially hidden)
        const piece = document.createElement("div")
        piece.className = "piece"
        cell.appendChild(piece)

        // Add click event listener
        cell.addEventListener("click", () => handleCellClick(row, col))

        gameBoard.appendChild(cell)
      }
    }
    // Add this at the end of the function
    setTimeout(adjustBoardSize, 0)
  }

  // Handle cell click
  function handleCellClick(row, col) {
    // Check if the game is active and the cell is empty
    if (!gameActive || board[row][col] !== 0) {
      return
    }

    // Update the board state
    board[row][col] = currentPlayer

    // Update the UI
    const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`)
    const piece = cell.querySelector(".piece")

    if (currentPlayer === 1) {
      piece.classList.add("player1-piece")
    } else {
      piece.classList.add("player2-piece")
    }

    // Check for win
    if (checkWin(row, col)) {
      endGame(currentPlayer)
      return
    }

    // Check for draw
    if (checkDraw()) {
      endGame(0)
      return
    }

    // Switch player
    currentPlayer = currentPlayer === 1 ? 2 : 1
    updateCurrentPlayerDisplay()
    resetTimer()
  }

  // Check for win
  function checkWin(row, col) {
    const directions = [
      [0, 1], // horizontal
      [1, 0], // vertical
      [1, 1], // diagonal down-right
      [1, -1], // diagonal down-left
    ]

    const player = board[row][col]

    for (const [dx, dy] of directions) {
      let count = 1
      const positions = [[row, col]]

      // Check in positive direction
      for (let i = 1; i < 5; i++) {
        const newRow = row + i * dx
        const newCol = col + i * dy

        if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10 || board[newRow][newCol] !== player) {
          break
        }

        count++
        positions.push([newRow, newCol])
      }

      // Check in negative direction
      for (let i = 1; i < 5; i++) {
        const newRow = row - i * dx
        const newCol = col - i * dy

        if (newRow < 0 || newRow >= 10 || newCol < 0 || newCol >= 10 || board[newRow][newCol] !== player) {
          break
        }

        count++
        positions.push([newRow, newCol])
      }

      // If 5 or more in a row, it's a win
      if (count >= 5) {
        highlightWinningPieces(positions)
        return true
      }
    }

    return false
  }

  // Highlight winning pieces
  function highlightWinningPieces(positions) {
    for (const [row, col] of positions) {
      const cell = document.querySelector(`.cell[data-row="${row}"][data-col="${col}"]`)
      const piece = cell.querySelector(".piece")
      piece.classList.add("winning-piece")
    }
  }

  // Check for draw
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

  // End the game
  function endGame(winner) {
    gameActive = false
    totalGames++
    stopTimer()

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

  // Update the current player display
  function updateCurrentPlayerDisplay() {
    const playerName = currentPlayer === 1 ? player1Name : player2Name
    currentPlayerDisplay.textContent = `Current Player: ${playerName}`

    if (currentPlayer === 1) {
      currentPlayerDisplay.style.color = "#4CAF50"
    } else {
      currentPlayerDisplay.style.color = "#2196F3"
    }
  }

  // Update the score display
  function updateScoreDisplay() {
    player1ScoreDisplay.textContent = `${player1Wins}/${totalGames}`
    player2ScoreDisplay.textContent = `${player2Wins}/${totalGames}`
  }

  // Timer functions
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
        // Time's up, switch to the next player
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
    timerDisplay.textContent = `Time: ${timeLeft}s`

    // Add warning classes based on time left
    timerDisplay.classList.remove("warning", "danger")
    if (timeLeft <= 10 && timeLeft > 5) {
      timerDisplay.classList.add("warning")
    } else if (timeLeft <= 5) {
      timerDisplay.classList.add("danger")
    }
  }

  // Start a new game
  function startNewGame() {
    initializeBoard()
    gameActive = true
    currentPlayer = 1
    updateCurrentPlayerDisplay()
    playButton.textContent = "Restart"
    winMessage.classList.remove("show")
    resetTimer()
  }

  // Show player name modal
  function showPlayerNameModal() {
    playerNameModal.classList.add("show")
    player1NameInput.value = player1Name
    player2NameInput.value = player2Name
    player1NameInput.focus()
  }

  // Save player names and start game
  function savePlayerNamesAndStartGame() {
    player1Name = player1NameInput.value.trim() || "Player 1"
    player2Name = player2NameInput.value.trim() || "Player 2"

    // Update player labels in the score panel
    document.getElementById("player1Label").textContent = `${player1Name}:`
    document.getElementById("player2Label").textContent = `${player2Name}:`

    playerNameModal.classList.remove("show")
    startNewGame()
  }

  // Adjust the board size based on window dimensions
  function adjustBoardSize() {
    const container = document.querySelector(".container")
    const header = document.querySelector("header")
    const footer = document.querySelector("footer")

    const availableHeight = window.innerHeight - header.offsetHeight - footer.offsetHeight - 30
    const gameBoard = document.getElementById("gameBoard")

    const size = Math.min(availableHeight, window.innerWidth * 0.8)
    gameBoard.style.width = `${size}px`
    gameBoard.style.height = `${size}px`
  }

  // Add window resize event listener
  window.addEventListener("resize", adjustBoardSize)

  // Event listeners
  playButton.addEventListener("click", () => {
    if (playButton.textContent === "Play") {
      showPlayerNameModal()
    } else {
      // Confirm restart if game is in progress
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

  // Allow Enter key to submit player names
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

  // Initialize the game
  initializeBoard()
  updateScoreDisplay()

  // Add this at the end
  setTimeout(adjustBoardSize, 0)
})
