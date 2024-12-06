const roomId = window.location.pathname.split('/')[1];


if (!sessionStorage.getItem('name')) {
    fetch(`/room/${roomId}/join`, {method: 'POST'}).then(response => response.json()).then(data => {
        sessionStorage.setItem('name', data.name);
    })
}

function displayRoom(data) {
    const name = sessionStorage.getItem('name');
    const results = document.getElementById('results');
    const votingButtons = document.getElementById('voting-buttons');
    const endVotingButton = document.getElementById('end-voting');
    const startVotingButton = document.getElementById('start-voting');
    const participantsList = document.getElementById('participants-list');
    const averageValue = document.getElementById('average-value');

    document.getElementById('participants-count').innerText = Object.keys(data.participants).length;

    document.getElementById('user-card').innerHTML = `<div id="user-avatar">${name.slice(0, 1)}</div><div id="user-name">${name}</div>`

    participantsList.innerHTML = '';
    for (const [participantName, value] of Object.entries(data.participants)) {
        const participantDiv = document.createElement('div');
        participantDiv.classList.add('participant');
        const participantCard = document.createElement('div');
        participantCard.classList.add('participant-card');
        if (data.status === 'results') {
            participantCard.classList.add('participant-card-result');
            participantCard.innerText = value >= 0 ? String(value) : 'pass';
        } else if (value >= 0) {
            participantCard.classList.add('participant-card-activated');
        }
        participantDiv.appendChild(participantCard);
        participantDiv.innerHTML += `<div class="participant-name">${participantName.slice(0, 10)}</div>`;
        participantsList.appendChild(participantDiv);
    }

    if (data.status === 'start') {
        startVotingButton.classList.remove('hidden');
        results.classList.add('hidden');
        votingButtons.classList.add('hidden');
        endVotingButton.classList.add('hidden');
    } else if (data.status === 'voting') {
        document.querySelectorAll('.vote-button').forEach(button => {
            const value = button.getAttribute('data-value');
            if (data.participants[name] === value) {
                button.classList.add('selected');
            } else {
                button.classList.remove('selected');
            }
        });

        startVotingButton.classList.add('hidden');
        results.classList.add('hidden');
        votingButtons.classList.remove('hidden');
        endVotingButton.classList.remove('hidden');
    } else if (data.status === 'results') {
        const average = calcAverage(data);
        averageValue.innerText = `${average}`;

        const votesList = document.getElementById('votes-list');
        votesList.innerHTML = '';
        for (const [vote, voteCount] of Object.entries(calcVotesCount(data))) {
            const voteDiv = document.createElement('div');
            voteDiv.innerHTML = `<div class="vote-card">${vote}</div><div class="vote-count"><span class="vote-count-value">${voteCount}</span> Vote</div>`;
            votesList.appendChild(voteDiv);
        }

        startVotingButton.classList.remove('hidden');
        votingButtons.classList.add('hidden');
        endVotingButton.classList.add('hidden');
        results.classList.remove('hidden');
    } else {
        console.error('Unknown state:' + data.status);
    }
}

function calcVotesCount(data) {
    let result = {};
    for (let value of Object.values(data.participants)) {
        value = parseInt(value);
        if (value >= 0) {
            if (!(value in result)) {
                result[value] = 0;
            }
            result[value] += 1
        }
    }
    return result
}

function calcAverage(data) {
    let result = 0, count = 0;

    for (let [_, value] of Object.entries(data.participants)) {
        value = parseInt(value);
        if (value > 0) {
            result += value;
            count += 1
        }
    }
    if (count > 0) {
        result /= count;
    }
    return result.toFixed(2);
}

function updateRoomStatus() {
    fetch(`/room/${roomId}`)
        .then(response => response.json())
        .then(data => {
            displayRoom(data);
        }).catch(error => console.error('Error updating room:', error));
}


function startRoomUpdate() {
    setInterval(() => {
        updateRoomStatus();
    }, 2000);
}

updateRoomStatus();
startRoomUpdate();

document.getElementById('join-button').addEventListener('click', function () {
    const name = document.getElementById('display-name-input').value;
    fetch(`/room/${roomId}/join`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({name: name})
    }).then(response => response.json()).then(data => {
        sessionStorage.setItem('name', name);
        document.getElementById('display-name-popup').classList.add('hidden');
        displayRoom(data);
    })
});

document.getElementById('display-name-input').addEventListener('keypress', function (event) {
    // If the user presses the "Enter" key on the keyboard
  if (event.key === "Enter") {
      // Cancel the default action, if needed
      event.preventDefault();
      // Trigger the button element with a click
      document.getElementById("join-button").click();
  }
});

document.getElementById('start-voting').addEventListener('click', function () {
    fetch(`/room/${roomId}/start_voting`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            displayRoom(data)
        });
});

document.getElementById('end-voting').addEventListener('click', function () {
    fetch(`/room/${roomId}/end_voting`, {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            displayRoom(data)
        });
});

document.querySelectorAll('.vote-button').forEach(button => {
    button.addEventListener('click', function () {
        const value = this.getAttribute('data-value');
        fetch(`/room/${roomId}/vote`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({name: sessionStorage.getItem('name'), value: value})
        })
            .then(response => response.json())
            .then(data => {
                displayRoom(data);
            });
    });
});