function createAndDisplayNewRoom() {
    fetch('/room', {
        method: 'POST'
    })
        .then(response => response.json())
        .then(data => {
            const roomLink = `${window.location.origin}/${data.room_id}`;

            const roomLinkElement = document.getElementById('room-link');
            if (roomLinkElement) {
                roomLinkElement.value = roomLink;
            }

            const joinRoomButton = document.getElementById('join-room');
            if (joinRoomButton) {
                document.getElementById('join-room').addEventListener('click', function () {
                    window.open(roomLink, '_blank');
                });
            }
        });
}

document.addEventListener("DOMContentLoaded", function () {
    createAndDisplayNewRoom();
});
