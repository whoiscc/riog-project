function Menu() {
    this.modalElement = null;
}

Menu.prototype.CreateElement = function (application) {
    // assert this.modalElement is null

    // JSX helps here, but only here maybe
    const modal = document.createElement('div');
    modal.classList.add('modal');

    const title = document.createElement('h1');
    title.innerText = 'Reference Implementation of Games';
    modal.append(title);

    const gameList = document.createElement('div');
    gameList.classList.add('modal-game-list');
    application.ForEach(function (gameItem) {
        const gameElement = document.createElement('div');
        gameElement.classList.add('modal-game-item');
        gameElement.innerHTML = `
            <h3>${gameItem.name}</h3>
            <p>${gameItem.description}</p>
        `;
        gameElement.addEventListener('click', function () {
            gameItem.Select();
        });
        gameList.append(gameElement);
    });
    modal.append(gameList);

    this.modalElement = modal;
}

Menu.prototype.AttachElement = function () {
    document.body.append(this.modalElement);
}

Menu.prototype.Show = function () {
    this.modalElement.style.top = '0';
}

Menu.prototype.Hide = function () {
    this.modalElement.style.top = '-100%';
}
