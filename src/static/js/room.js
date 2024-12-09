const roomId = window.location.pathname.split('/')[1];

function displayRoom(data) {
    const name = localStorage.getItem('name');
    const results = document.getElementById('results');
    const votingButtons = document.getElementById('voting-buttons');
    const endVotingButton = document.getElementById('end-voting');
    const startVotingButton = document.getElementById('start-voting');
    const participantsList = document.getElementById('participants-list');
    const averageValue = document.getElementById('average-value');

    document.getElementById('participants-count').innerText = Object.keys(data.participants).length;

    if (name) {
        document.getElementById('user-card').innerHTML = `<div id="user-avatar">${name.slice(0, 1)}</div><div id="user-name">${name}</div>`
        changeDisplayNamePopupVisibility(false);
    } else {
        changeDisplayNamePopupVisibility(true);
    }

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
            if (name in data.participants && data.participants[name] === value) {
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

function changeDisplayNamePopupVisibility(show) {
    let elem = document.getElementById('display-name-popup');
    if (show && elem.classList.contains('hidden')) {
        elem.classList.remove('hidden');
    } else if (!show && !elem.classList.contains('hidden')) {
        elem.classList.add('hidden');
    }
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

function roomRequest(endpoint, participantName, callback) {
    fetch(`/room/${roomId}/${endpoint}`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({name: participantName})
    }).then(response => {
        if (!response.ok) {
            console.log(`Ошибка: ${response.status} ${response.statusText}`);
        }
        return response.json();
    }).then(data => {
        if (callback != null) {
            callback(data)
        }
    }).catch(error => {
        console.error('Произошла ошибка:', error);
    });
}


document.getElementById('join-button').addEventListener('click', function () {
    const input = document.getElementById('display-name-input-id');
    const errorMessage = document.getElementById('error-message');
    if (input.value.trim() === '') {
        input.classList.add('error');
        errorMessage.classList.remove('hidden');
        return;
    }
    const name = input.value;
    roomRequest("join", name, data => {
        localStorage.setItem('name', name);
        displayRoom(data);
    });
});

document.getElementById('display-name-input-id').addEventListener('keypress', function (event) {
    // If the user presses the "Enter" key on the keyboard
    if (event.key === "Enter") {
        // Cancel the default action, if needed
        event.preventDefault();
        // Trigger the button element with a click
        document.getElementById("join-button").click();
    }
});

document.getElementById('display-name-input-id').addEventListener('input', function () {
    const input = document.getElementById('display-name-input-id');
    const errorMessage = document.getElementById('error-message');

    if (input.value.trim() !== '') {
        input.classList.remove('error');
        errorMessage.classList.add('hidden');
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
            body: new URLSearchParams({name: localStorage.getItem('name'), value: value})
        })
            .then(response => response.json())
            .then(data => {
                displayRoom(data);
            });
    });
});

document.addEventListener("DOMContentLoaded", function () {
    const name = localStorage.getItem("name");
    if (name) {
        roomRequest("join", name, null);
    }
    updateRoomStatus();
    startRoomUpdate();
});


function uniqueTabId() {
    return 'tab-' + Date.now() + '-' + Math.random().toString(36).slice(2, 9);
}

if (!sessionStorage.getItem('tabId')) {
    sessionStorage.setItem('tabId', uniqueTabId());
}

let openedTabs = {};

const tabsChannel = new BroadcastChannel(roomId);

tabsChannel.onmessage = (event) => {
    const tabId = sessionStorage.getItem('tabId');

    if (event.data && typeof event.data === 'object') {
        console.log(`Tab ${tabId}: ${JSON.stringify(event.data)}`);

        switch (event.data.eventType) {
            case 'new_tab':
                tabsChannel.postMessage({eventType: "old_tab_exists", tabId});
                openedTabs[event.data.tabId] = true;
                break;

            case 'old_tab_exists':
                openedTabs[event.data.tabId] = true;
                break;

            case 'close_tab':
                openedTabs[event.data.tabId] = false;
                break;

            default:
                console.warn(`Unknown event type: ${event.data.eventType}`);
                break;
        }
    } else {
        console.error("Invalid event data received:", event.data);
    }
};

window.addEventListener('load', () => {
    const tabId = sessionStorage.getItem('tabId');
    tabsChannel.postMessage({eventType: "new_tab", tabId});
});

window.addEventListener('beforeunload', () => {
    const hasOpenTabs = Object.values(openedTabs).some(isOpen => isOpen);
    if (hasOpenTabs) {
        tabsChannel.postMessage({eventType: "close_tab", tabId: sessionStorage.getItem('tabId')});
    } else {
        const name = localStorage.getItem("name");
        roomRequest("leave", name, null);
    }
});
