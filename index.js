// Set up
const GAME_STATE = {
  FirstCardAwaits: "FirstCardAwaits",
  SecondCardAwaits: "SecondCardAwaits",
  CardsMatchFailed: "CardsMatchFailed",
  CardsMatched: "CardsMatched",
  GameFinished: "GameFinished",
}
// mode
let cheatMode = false

// default
const scorePoint = 100

// elements
const cardContainer = document.querySelector("#cards-container")
const cheatModeButton = document.querySelector("#cheat-mode-btn")
const cheatModeIcon = document.querySelector("#cheat-mode-icon")
const cheatModeText = document.querySelector("#cheat-mode-text")
const triesText = document.querySelector("#tries")
const scoreText = document.querySelector("#score")
const endGameScreen = document.querySelector("#end-game-screen")
const endGameScore = document.querySelector("#end-score")
const endGameTries = document.querySelector("#end-tries")
const playAgainBtn = document.querySelector("#play-again-btn")

// MODEL
const model = {
  reveledCards: [], // 翻出的牌
  scores: 0, // 分數
  maxScores: 2600,
  tries : 0, // 嘗試數

  isReveledCardsMatched() {
    const cardOneNumber = Number(this.reveledCards[0].dataset.number) % 13
    const cardTwoNumber = Number(this.reveledCards[1].dataset.number) % 13
    return cardOneNumber === cardTwoNumber
  },

  isGameOver(){
    return this.scores === this.maxScores
  }
}


// VIEW
const view = {
  getCardContent(num) {
    const cardNumber = this.getCardNumber(num)
    const cardIcon = this.getCardIconShape(num)
    const raw = `
    <p>${cardNumber}</p>
    <div class="card-img ${cardIcon}"></div>
    <p>${cardNumber}</p>
    `
    return raw
  },
  getCardBack(num) {
    let raw = ""
    // top
    raw += `<div class="card back" data-number=${num}>`
    // mid : cheat mode only
    if (cheatMode) {
      raw += this.getCardContent(num)
    }
    // bottom
    raw += `</div>`
    return raw
  },
  getCardNumber(num) {
    const number = (Number(num) % 13) + 1
    switch (number) {
      case 1:
        return "A"
      case 13:
        return "K"
      case 12:
        return "Q"
      case 11:
        return "J"
      default:
        return number
    }
  },
  getCardIconShape(num) {
    const index = Math.ceil((Number(num) + 1) / 13);
    switch (index) {
      case 1:
        return "heart"
      case 2:
        return "diamond"
      case 3:
        return "club"
      case 4:
        return "spades"
    }
  },
  flipCard(card) {
    // 背面 -> 正面
    if (card.classList.contains("back")) {
      card.innerHTML = this.getCardContent(card.dataset.number)
      card.classList.remove("back")
      card.classList.add("flip") // 用來偵測翻開
      return
    }
    // 正面 -> 背面
    if (cheatMode) {
      card.innerHTML = this.getCardContent(card.dataset.number)
    } else {
      card.innerHTML = ""
    }
    card.classList.add("back")
    card.classList.remove("flip") // 用來偵測翻開
  },

  clearAllCards() {
    cardContainer.innerHTML = ""
  },

  renderAllCards() {
    this.clearAllCards()
    this.cheatModeButtonUpdate()
    utility.getShuffledArray(52).forEach(number => {
      cardContainer.innerHTML += this.getCardBack(number)
    })
  },
  highLightPairedCard(card) {
    card.classList.add("paired")
  },
  cheatModeButtonUpdate() {
    if (cheatMode) {
      cheatModeText.textContent = "ON"
      cheatModeButton.classList.add("btn-danger")
      cheatModeButton.classList.remove("btn-success")
      cheatModeIcon.classList.add("fa-eye")
      cheatModeIcon.classList.remove("fa-eye-slash")
    } else {
      cheatModeText.textContent = "OFF"
      cheatModeButton.classList.remove("btn-danger")
      cheatModeButton.classList.add("btn-success")
      cheatModeIcon.classList.remove("fa-eye")
      cheatModeIcon.classList.add("fa-eye-slash")
    }
  },
  scoreUpdate(amount){
    scoreText.textContent = amount
  }, 
  triesUpdate(amount){
    triesText.textContent = amount
  },
  wrongAnimationAppend(...cards){
    cards.forEach(card => {
      // 加入 wrong class, css 內有@keyframe動畫
      card.classList.add("wrong")
      // 加入一次性event listener 監聽 animation end 
      card.addEventListener("animationend", event => {
        card.classList.remove("wrong")
      }, {once: true} )
    })
  },
  showEndGameScreen(score, tries){
    endGameScore.textContent = score
    endGameTries.textContent = tries
    endGameScreen.classList.remove("hide")
  },

}

// CONTROL
const control = {

  currentGameState: GAME_STATE.FirstCardAwaits,

  cheatModeButtonClick() {
    // 選出還沒配對的卡 (用Array.from讓nodeList變成array)
    const unpairedCards =
      Array.from(document.querySelectorAll(".card"))
        .filter(card => !card.classList.contains("paired") && !card.classList.contains("flip"))

    if (cheatMode) {
      cheatMode = false
      unpairedCards.forEach(card => {
        // 其他卡片隱藏內容
        card.innerHTML = ""
      })
    } else {
      cheatMode = true
      unpairedCards.forEach(card => {
        card.innerHTML += view.getCardContent(card.dataset.number)
      })
    }
    view.cheatModeButtonUpdate()
  },

  onCardClick(card) {
    if (!card.classList.contains("back") || card.classList.contains("paired")) {
      return
    }
    switch (this.currentGameState) {
      // STATE: 翻第一張
      case GAME_STATE.FirstCardAwaits:
        view.flipCard(card)
        model.reveledCards.push(card)
        this.currentGameState = GAME_STATE.SecondCardAwaits
        break

      // STATE: 翻第二張
      case GAME_STATE.SecondCardAwaits:
        view.flipCard(card)
        model.reveledCards.push(card)
        // 嘗試次數
        model.tries++
        view.triesUpdate(model.tries)
        // 比對卡片
        if (model.isReveledCardsMatched()) {
          // 卡片一樣
          this.currentGameState = GAME_STATE.CardsMatched
          // remove flip class
          model.reveledCards.forEach(card => card.classList.remove("flip"))
          // highlight cards
          model.reveledCards.forEach(card => view.highLightPairedCard(card))
          model.reveledCards = []
          // 加分數
          model.scores += scorePoint
          view.scoreUpdate(model.scores)
          // 偵測是否勝利
          if (model.isGameOver()) {
            view.showEndGameScreen(model.scores, model.tries)
            this.currentGameState = GAME_STATE.GameFinished
            return
          } 
          // 還沒勝利就繼續
          this.currentGameState = GAME_STATE.FirstCardAwaits
        } else {
          // 卡片不一樣
          this.currentGameState = GAME_STATE.CardsMatchFailed
          // 卡片閃爍
          view.wrongAnimationAppend(...model.reveledCards)
          // 1 秒後翻回去
          setTimeout(() => {
            view.flipCard(model.reveledCards[0])
            view.flipCard(model.reveledCards[1])
            model.reveledCards = []
            this.currentGameState = GAME_STATE.FirstCardAwaits
          }, 1000);
        }
        break
    }
  },
  playAgainBtnClick(){
    window.location.reload()
  }, 

}


// Utility
const utility = {
  // Fisher-Yates Shuffle
  // 由 Ronald Fisher 跟 Frank Yates 在1938發表的演算法
  // 可是我們目前使用的是 Donal Knuth 微改後的版本，所以也叫做 Knuth Shuffle
  // 兩個版本主要的差異：
  // Fisher-Yates 從後往前，每個東西都會隨機跟任何一個東西交換，可能會跟自己換
  // Knuth 從前往後，每個東西都會跟後面還沒有交換過的東西交換，不會跟自己換 
  // Knuth 能產生更均勻的隨機排列
  getShuffledArray(num) {
    const array = Array.from(Array(num).keys())
    const length = array.length

    for (let index = 0; index < length; index++) {
      const randomIndex = Math.floor(Math.random() * (length - index)) + index;
      [array[index], array[randomIndex]] = [array[randomIndex], array[index]]
    }
    return array
  }
}

// Start
view.renderAllCards()

// Listener
// cards
document.querySelectorAll(".card").forEach(card => {
  card.addEventListener("click", event => {
    control.onCardClick(card)
  })
})
// cheat mode button
cheatModeButton.addEventListener("click", control.cheatModeButtonClick)

// play again button
playAgainBtn.addEventListener("click", control.playAgainBtnClick)