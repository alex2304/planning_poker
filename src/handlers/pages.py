from flask import Blueprint, redirect, render_template, url_for
from storage.storage import rooms

bp = Blueprint("pages", __name__)


@bp.route("/")
def index():
    return render_template("index.html", header_text="Create new room")


@bp.route("/<room_id>")
def room(room_id):
    if room_id not in rooms:
        return redirect(url_for("pages.index"))

    return render_template("room.html", room_id=room_id, header_text=f"Voting Room", participants=rooms[room_id]["participants"])
