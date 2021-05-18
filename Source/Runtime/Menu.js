// Menu.js - most (if not all) DOM-based GUI of app
//
// Menu will only have one single instance through the lifetime of application

function Menu () {
  this.modalElement = null
  this.gameListElement = null
  this.bannerElement = null
  this.bannerTitleElement = null
  this.fpsElement = null
}

Menu.prototype.CreateElement = function (application) {
  // assert no duplicated create

  // JSX helps here, but only here (and `UpdateGameList` below) maybe
  const banner = document.createElement('div')
  banner.classList.add('banner')
  banner.addEventListener('click', application.PauseGame)

  const bannerTitle = document.createElement('h1')
  bannerTitle.innerText = 'Reference Implementation of Games'
  banner.append(bannerTitle)
  this.bannerTitleElement = bannerTitle

  const fps = document.createElement('span')
  fps.classList.add('fps-text')
  banner.append(fps)
  this.fpsElement = fps
  this.SetFps('-')

  const bannerOverlay = document.createElement('div')
  bannerOverlay.classList.add('banner-overlay')
  bannerOverlay.innerText = 'Pause'
  banner.append(bannerOverlay)

  this.bannerElement = banner

  const modal = document.createElement('div')
  modal.classList.add('modal')

  const modalTitle = document.createElement('h1')
  modalTitle.innerText = 'Reference Implementation of Games'
  modal.append(modalTitle)

  this.modalElement = modal
  this.UpdateGameList(application)
}

Menu.prototype.AttachElement = function () {
  // assert no duplicate attach
  document.body.append(this.modalElement)
  document.body.append(this.bannerElement)
}

Menu.prototype.ShowModal = function () {
  this.modalElement.style.top = '0'
}

Menu.prototype.HideModal = function () {
  this.modalElement.style.top = '-100%'
}

Menu.prototype.SetGameName = function (gameName) {
  this.bannerTitleElement.innerHTML = `Ref. Impl. of <strong>${gameName}</strong>`
}

Menu.prototype.SetFps = function (fps) {
  // maybe should handle this earlier?
  if (Number.isNaN(fps)) {
    fps = '-'
  }
  if (fps !== '-') {
    // assert fps is number
    fps = fps.toFixed(1)
  }
  this.fpsElement.innerText = `FPS: ${fps}`
}

Menu.prototype.UpdateGameList = function (application) {
  const gameList = document.createElement('div')
  gameList.classList.add('modal-game-list')
  application.ForEachGame(function (gameItem) {
    const gameElement = document.createElement('div')
    gameElement.classList.add('modal-game-item')
    if (gameItem.supported) {
      gameElement.classList.add('supported')
    }
    gameElement.innerHTML = `
            <h3>
                ${gameItem.name}
                ${gameItem.running ? '<small style="color: gray">(running)</small>' : ''}
                ${gameItem.supported ? '' : '<small style="color: lightpink">(unsupported)</small>'}
            </h3>
            <p>${gameItem.description}</p>
            <div class="modal-game-item-overlay">${gameItem.running ? 'Resume' : 'Start'}</div>
        `
    if (gameItem.supported) {
      gameElement.addEventListener('click', gameItem.Select)
    }
    if (gameItem.running) {
      gameList.prepend(gameElement)
    } else {
      gameList.append(gameElement)
    }
  })
  // maybe not the best way
  if (!this.gameListElement) {
    this.modalElement.append(gameList)
  } else {
    this.modalElement.replaceChild(gameList, this.gameListElement)
  }
  this.gameListElement = gameList
}